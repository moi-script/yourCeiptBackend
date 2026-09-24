// One place to ask a model for JSON.
//
// Models are tried as a hedged race rather than one after another: the
// first model starts, and if it hasn't answered within HEDGE_MS (or fails)
// the next one starts alongside it. The first valid answer wins and the
// rest are cancelled. Free models regularly take 40s+ or hang, so waiting
// for each to time out in turn made a single receipt take minutes.

import { getAiKey, getGeminiKey } from "../utils/getKey.js";
import { fallbackChain, recordResult, GEMINI_MODELS } from "./modelRegistry.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const HEDGE_MS = 8 * 1000;      // start the next model if this one is slow
const CALL_TIMEOUT_MS = 60 * 1000;
const DEADLINE_MS = 90 * 1000;  // give up on the whole request after this

async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function callOpenRouter(model, prompt, signal) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${getAiKey()}`,
      "Content-Type": "application/json",
      "X-Title": "Recepta",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      // Reasoning models otherwise spend most of their time thinking.
      reasoning: { effort: "low", exclude: true },
    }),
  });
  const body = await readJson(res);
  if (!res.ok) throw new Error(body?.error?.message?.slice(0, 160) || `HTTP ${res.status}`);
  const text = body?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Model returned no content");
  return text;
}

async function callGemini(modelId, prompt, signal) {
  const config = GEMINI_MODELS[modelId];
  const res = await fetch(`${GEMINI_URL}/${config.apiName}:generateContent`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", "x-goog-api-key": getGeminiKey() },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0,
        // Default thinking made Gemini 3 take 20-90s per receipt; "low"
        // gives the same extraction in 4-8s.
        thinkingConfig: config.thinking,
      },
    }),
  });
  const body = await readJson(res);
  if (!res.ok) {
    const quota = body?.error?.details?.find((d) => d.violations)?.violations?.[0];
    if (/PerDay/i.test(quota?.quotaId || "")) throw new Error(`Daily free quota used up (${quota.quotaValue}/day)`);
    throw new Error(body?.error?.message?.slice(0, 160) || `HTTP ${res.status}`);
  }
  const text = body?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("");
  if (!text) throw new Error(`No content (${body?.candidates?.[0]?.finishReason || "unknown"})`);
  return text;
}

// Models wrap JSON in all sorts of things: code fences, <think> blocks,
// the underscores an older prompt asked for, a sentence of preamble.
export function parseJsonLoose(text) {
  if (text && typeof text === "object") return text;
  if (typeof text !== "string") throw new Error("No text to parse");

  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?/gi, "")
    .trim()
    .replace(/^_+|_+$/g, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("No JSON object in response");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

async function runModel(model, prompt, validate, signal) {
  const timeout = AbortSignal.timeout(CALL_TIMEOUT_MS);
  const combined = AbortSignal.any([signal, timeout]);
  try {
    const text = GEMINI_MODELS[model]
      ? await callGemini(model, prompt, combined)
      : await callOpenRouter(model, prompt, combined);
    const data = parseJsonLoose(text);
    if (validate) validate(data);
    return data;
  } catch (err) {
    if (timeout.aborted) throw new Error("Timed out");
    if (signal.aborted) throw new Error("Cancelled");
    throw err;
  }
}

export async function completeJson(prompt, { preferredModel, validate } = {}) {
  const chain = await fallbackChain(preferredModel);
  const attempts = [];

  return new Promise((resolve, reject) => {
    const controllers = [];
    let next = 0;
    let running = 0;
    let settled = false;
    let hedgeTimer = null;

    const finish = (fn) => {
      settled = true;
      clearTimeout(hedgeTimer);
      clearTimeout(deadline);
      controllers.forEach((c) => c.abort());
      fn();
    };

    const fail = (reason) => {
      const error = new Error(reason);
      error.attempts = attempts;
      finish(() => reject(error));
    };

    const launch = () => {
      if (settled) return;
      if (next >= chain.length) {
        if (running === 0) fail("All models failed");
        return;
      }

      const model = chain[next++];
      const controller = new AbortController();
      controllers.push(controller);
      running++;
      clearTimeout(hedgeTimer);
      hedgeTimer = setTimeout(launch, HEDGE_MS);

      const started = Date.now();
      runModel(model, prompt, validate, controller.signal).then(
        (data) => {
          const latency = Date.now() - started;
          recordResult(model, { ok: true, latency });
          attempts.push({ model, ok: true, latency });
          if (!settled) finish(() => resolve({ data, model, attempts }));
        },
        (err) => {
          running--;
          if (err.message === "Cancelled") return;
          const latency = Date.now() - started;
          recordResult(model, { ok: false, latency, error: err.message });
          attempts.push({ model, ok: false, latency, error: err.message });
          console.warn(`[llm] ${model} failed after ${latency}ms: ${err.message}`);
          launch();
        }
      );
    };

    const deadline = setTimeout(() => fail("Timed out waiting for models"), DEADLINE_MS);
    launch();
  });
}
