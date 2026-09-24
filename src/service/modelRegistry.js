// Keeps a live list of usable models instead of a hardcoded one.
//
// The old approach pinged a fixed list of 35 model ids on every request.
// OpenRouter rotates its free models often, so the list went stale (none of
// the 35 existed any more) and every page load fired 35 completions.
//
// Now:
// - the free-model list comes from OpenRouter's public catalog (no quota cost);
// - models are probed with a tiny JSON task at most every PROBE_TTL, and the
//   results are stored in MongoDB so restarts don't re-probe. Free accounts
//   get ~50 free-model requests a day, so probes have to be rationed;
// - real extractions update each model's status as a side effect;
// - hitting the daily free limit pauses OpenRouter until it resets.

import { getAiKey, getGeminiKey } from "../utils/getKey.js";
import ModelStatus from "../models/ModelStatus.js";

const CATALOG_URL = "https://openrouter.ai/api/v1/models";
const CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

const CATALOG_TTL_MS = 30 * 60 * 1000;       // catalog is free to fetch
const PROBE_TTL_MS = 6 * 60 * 60 * 1000;     // probes cost quota
const FORCE_PROBE_COOLDOWN_MS = 10 * 60 * 1000;
const PROBE_TIMEOUT_MS = 20 * 1000;
const PROBE_CONCURRENCY = 4;
const MAX_PROBES = 8;
const MAX_CANDIDATES = 16;

export const AUTO_MODEL_ID = "auto";

// Built-in models on our own Gemini key, in the order "auto" tries them.
// Measured on real receipts (17-item restaurant bill): each of these returns
// the same result in 2-8s. Free OpenRouter models took 40-85s or failed.
// On the free tier every Gemini model has its own quota of 20 requests a
// day, so a longer list means more free capacity, not just redundancy.
export const GEMINI_MODELS = {
  "google-ai/gemini-2.5-flash": {
    apiName: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    thinking: { thinkingBudget: 0 },
  },
  "google-ai/gemini-3-flash-preview": {
    apiName: "gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    thinking: { thinkingLevel: "low" },
  },
  "google-ai/gemini-3.6-flash": {
    apiName: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    thinking: { thinkingLevel: "low" },
  },
  "google-ai/gemini-3.5-flash-lite": {
    apiName: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash-Lite",
    thinking: { thinkingLevel: "minimal" },
  },
  "google-ai/gemini-3.5-flash": {
    apiName: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    thinking: { thinkingLevel: "low" },
  },
  "google-ai/gemini-3.1-flash-lite": {
    apiName: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash-Lite",
    thinking: { thinkingLevel: "minimal" },
  },
};
const GEMINI_IDS = Object.keys(GEMINI_MODELS);

// Free models that aren't general chat models (music, safety classifiers,
// the meta-router, coding agents) or that shouldn't see personal receipts.
const EXCLUDE_PATTERNS = [
  /lyria/i,
  /content-safety/i,
  /guard/i,
  /^openrouter\//i,
  /^stealth\//i,       // anonymous test models; prompts are typically logged
  /-code\b|coder|north-mini-code/i,
  /embed/i,
];

const state = {
  catalog: [],             // candidate models from the catalog
  catalogAt: 0,
  probes: new Map(),       // id -> { status, latency, error, checkedAt }
  probedAt: 0,
  lastForcedProbe: 0,
  loaded: false,           // probe cache read from Mongo
  refreshing: null,
  stats: new Map(),        // id -> { ok, fail, lastLatency, lastError, lastUsed }
  openrouterPausedUntil: 0,
  cooldowns: new Map(),    // id -> timestamp until which to skip (rate limits)
};

const withTimeout = (ms) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(timer) };
};

const providerLabel = (id) => {
  const vendor = id.split("/")[0] || id;
  return vendor.charAt(0).toUpperCase() + vendor.slice(1);
};

const displayName = (id, name) => {
  if (name) return name.replace(/\s*\(free\)\s*$/i, "").replace(/^[^:]+:\s*/, "");
  return id.split("/").pop().replace(/:free$/, "");
};

const isFree = (m) =>
  m.id.endsWith(":free") ||
  (Number(m.pricing?.prompt) === 0 && Number(m.pricing?.completion) === 0);

const acceptsText = (m) => {
  const input = m.architecture?.input_modalities || ["text"];
  const output = m.architecture?.output_modalities || ["text"];
  return input.includes("text") && output.includes("text");
};

const nextUtcMidnight = () => {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.getTime();
};

async function fetchCatalog() {
  const t = withTimeout(25000);
  try {
    const res = await fetch(CATALOG_URL, { signal: t.signal });
    if (!res.ok) throw new Error(`catalog ${res.status}`);
    const { data } = await res.json();
    return data
      .filter((m) => isFree(m) && acceptsText(m))
      .filter((m) => !EXCLUDE_PATTERNS.some((p) => p.test(m.id)))
      .sort((a, b) => (b.context_length || 0) - (a.context_length || 0))
      .slice(0, MAX_CANDIDATES)
      .map((m) => ({
        id: m.id,
        name: displayName(m.id, m.name),
        provider: providerLabel(m.id),
        contextLength: m.context_length || null,
        vision: (m.architecture?.input_modalities || []).includes("image"),
      }));
  } finally {
    t.done();
  }
}

// A probe is a real (tiny) extraction task, not "hi" with max_tokens 1.
// A model that answers "hi" can still be useless for JSON output.
async function probe(model, apiKey) {
  const started = Date.now();
  const t = withTimeout(PROBE_TIMEOUT_MS);
  const result = (status, error = null) => ({
    status,
    latency: Date.now() - started,
    error,
    checkedAt: Date.now(),
  });
  try {
    const res = await fetch(CHAT_URL, {
      method: "POST",
      signal: t.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Title": "Recepta" },
      body: JSON.stringify({
        model: model.id,
        messages: [{
          role: "user",
          content: 'Receipt text: "COFFEE 120.00 TOTAL 120.00". Reply with only this JSON filled in: {"total": number}',
        }],
        max_tokens: 300,
        temperature: 0,
        reasoning: { effort: "low", exclude: true },
      }),
    });

    const body = await res.json().catch(() => ({}));
    const message = body?.error?.message || "";
    if (/free-models-per-day/i.test(message)) {
      state.openrouterPausedUntil = nextUtcMidnight();
      return null; // quota, not the model's fault; keep the previous result
    }
    if (res.status === 429) return result("busy", "Rate limited by the provider");
    if (!res.ok) return result("down", message.slice(0, 120) || `HTTP ${res.status}`);

    const text = body?.choices?.[0]?.message?.content || "";
    return /"total"\s*:\s*120/.test(text) ? result("active") : result("degraded", "Didn't return valid JSON");
  } catch (err) {
    return result("down", err.name === "AbortError" ? "Timed out" : "Network error");
  } finally {
    t.done();
  }
}

async function probeModels(models, apiKey) {
  let cursor = 0;
  const worker = async () => {
    while (cursor < models.length && Date.now() > state.openrouterPausedUntil) {
      const model = models[cursor++];
      const r = await probe(model, apiKey);
      if (r) state.probes.set(model.id, r);
    }
  };
  await Promise.all(Array.from({ length: PROBE_CONCURRENCY }, worker));
  state.probedAt = Date.now();

  try {
    await ModelStatus.findByIdAndUpdate(
      "openrouter",
      { checkedAt: new Date(state.probedAt), models: [...state.probes].map(([id, p]) => ({ id, ...p })) },
      { upsert: true }
    );
  } catch (err) {
    console.warn("Couldn't save model status:", err.message);
  }
}

async function loadSavedProbes() {
  if (state.loaded) return;
  state.loaded = true;
  try {
    const doc = await ModelStatus.findById("openrouter").lean();
    if (doc?.checkedAt) {
      state.probedAt = new Date(doc.checkedAt).getTime();
      for (const { id, ...p } of doc.models || []) state.probes.set(id, p);
    }
  } catch (err) {
    console.warn("Couldn't load model status:", err.message);
  }
}

export async function refreshModels({ force = false } = {}) {
  if (state.refreshing) return state.refreshing;

  state.refreshing = (async () => {
    try {
      await loadSavedProbes();

      if (!state.catalog.length || Date.now() - state.catalogAt > CATALOG_TTL_MS) {
        state.catalog = await fetchCatalog();
        state.catalogAt = Date.now();
      }

      const apiKey = getAiKey();
      const canForce = force && Date.now() - state.lastForcedProbe > FORCE_PROBE_COOLDOWN_MS;
      const probesStale = Date.now() - state.probedAt > PROBE_TTL_MS;
      const unprobed = state.catalog.filter((m) => !state.probes.has(m.id));
      const paused = Date.now() < state.openrouterPausedUntil;

      if (apiKey && !paused && (canForce || probesStale || unprobed.length)) {
        if (canForce) state.lastForcedProbe = Date.now();
        // New models first, then the rest; cap the number to ration quota.
        const toProbe = canForce || probesStale
          ? [...unprobed, ...state.catalog.filter((m) => state.probes.has(m.id))]
          : unprobed;
        await probeModels(toProbe.slice(0, MAX_PROBES), apiKey);
      }
    } catch (err) {
      console.error("Model refresh failed:", err.message);
      if (!state.catalogAt) state.catalogAt = Date.now() - CATALOG_TTL_MS + 60 * 1000; // retry in a minute
    } finally {
      state.refreshing = null;
    }
  })();

  return state.refreshing;
}

function openrouterEntry(model) {
  const p = state.probes.get(model.id);
  const s = state.stats.get(model.id);
  const paused = Date.now() < state.openrouterPausedUntil;

  // A real extraction result is fresher evidence than the last probe.
  let status = p?.status || "unknown";
  let error = p?.error || null;
  if (s?.lastUsed && (!p || s.lastUsed > p.checkedAt)) {
    status = s.lastError ? "degraded" : "active";
    error = s.lastError;
  }
  if (paused) {
    status = "paused";
    error = "Daily free-model limit reached. Resets at midnight UTC.";
  }

  return {
    ...model,
    status,
    error,
    latency: s?.lastLatency ?? p?.latency ?? null,
    checkedAt: p?.checkedAt ? new Date(p.checkedAt).toISOString() : null,
    successRate: s && s.ok + s.fail ? s.ok / (s.ok + s.fail) : null,
    extractions: s ? s.ok + s.fail : 0,
  };
}

function geminiEntries() {
  const hasKey = Boolean(getGeminiKey());
  return GEMINI_IDS.map((id, i) => {
    const s = state.stats.get(id);
    const cooling = (state.cooldowns.get(id) || 0) > Date.now();
    return {
      id,
      name: GEMINI_MODELS[id].name,
      provider: "Google",
      contextLength: 1000000,
      vision: true,
      builtIn: true,
      recommended: i === 0,
      status: !hasKey ? "down" : cooling ? "busy" : s?.lastError ? "degraded" : "active",
      error: !hasKey ? "GEMINI_KEY not set" : s?.lastError || (cooling ? "Rate limited, trying again soon" : null),
      latency: s?.lastLatency ?? null,
      checkedAt: s?.lastUsed ? new Date(s.lastUsed).toISOString() : null,
      successRate: s && s.ok + s.fail ? s.ok / (s.ok + s.fail) : null,
      extractions: s ? s.ok + s.fail : 0,
    };
  });
}

const STATUS_RANK = { active: 0, degraded: 1, unknown: 2, busy: 3, paused: 4, down: 5 };

function sortModels(list) {
  return [...list].sort((a, b) => {
    const rank = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (rank !== 0) return rank;
    return (a.latency ?? Infinity) - (b.latency ?? Infinity);
  });
}

// Cold start is capped: after FIRST_WAIT_MS we answer with what we have.
const FIRST_WAIT_MS = 8 * 1000;

export async function listModels() {
  const catalogStale = Date.now() - state.catalogAt > CATALOG_TTL_MS;
  const probesStale = Date.now() - state.probedAt > PROBE_TTL_MS;
  if (!state.catalogAt) {
    await Promise.race([refreshModels(), new Promise((r) => setTimeout(r, FIRST_WAIT_MS))]);
  } else if (catalogStale || probesStale) {
    refreshModels();
  }

  return {
    checkedAt: state.probedAt ? new Date(state.probedAt).toISOString() : null,
    refreshing: Boolean(state.refreshing),
    openrouterPausedUntil:
      Date.now() < state.openrouterPausedUntil ? new Date(state.openrouterPausedUntil).toISOString() : null,
    models: [...geminiEntries(), ...sortModels(state.catalog.map(openrouterEntry))],
  };
}

export const canForceRefresh = () => Date.now() - state.lastForcedProbe > FORCE_PROBE_COOLDOWN_MS;

// Ordered list of models to try for an extraction (raced, see llm.js).
// "auto" means Gemini first. A specific pick goes first as long as it still
// exists: users may have saved a model that has since been retired.
export async function fallbackChain(preferred) {
  const { models } = await listModels();
  const now = Date.now();
  const ready = (id) => (state.cooldowns.get(id) || 0) < now;
  const byStatus = (...statuses) =>
    models.filter((m) => !m.builtIn && statuses.includes(m.status) && ready(m.id)).map((m) => m.id);

  const gemini = getGeminiKey() ? GEMINI_IDS.filter(ready) : [];
  const openrouter = [...byStatus("active", "degraded").slice(0, 2), ...byStatus("unknown").slice(0, 1)];

  const chain = [];
  const known = models.find((m) => m.id === preferred);
  if (preferred && preferred !== AUTO_MODEL_ID && known && !["down", "paused"].includes(known.status)) {
    chain.push(preferred);
  }
  chain.push(...gemini, ...openrouter);
  // If everything is cooling down, try Gemini anyway rather than failing instantly.
  if (!chain.length && getGeminiKey()) chain.push(...GEMINI_IDS);
  return [...new Set(chain)];
}

export function recordResult(modelId, { ok, latency, error }) {
  const s = state.stats.get(modelId) || { ok: 0, fail: 0, lastLatency: null, lastError: null, lastUsed: null };
  if (ok) s.ok += 1;
  else s.fail += 1;
  s.lastLatency = latency ?? s.lastLatency;
  s.lastError = ok ? null : error || "Failed";
  s.lastUsed = Date.now();
  state.stats.set(modelId, s);

  if (ok) {
    state.cooldowns.delete(modelId);
    return;
  }
  if (/free-models-per-day/i.test(error || "")) {
    state.openrouterPausedUntil = nextUtcMidnight();
  } else if (/daily free quota/i.test(error || "")) {
    // Gemini's per-model daily quota; check again in an hour.
    state.cooldowns.set(modelId, Date.now() + 60 * 60 * 1000);
  } else if (/quota|rate limit|429|high demand|overloaded/i.test(error || "")) {
    // Per-minute limits: skip this model for a minute instead of paying
    // a failed round trip on every request.
    state.cooldowns.set(modelId, Date.now() + 60 * 1000);
  }
}
