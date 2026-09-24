// Finds a picture for a receipt card via Tavily image search.
//
// Before: an extra LLM call wrote the search query (and silently returned
// undefined when that model was down), then the extraction model was asked
// to copy one of the URLs into its JSON, which it often mangled. Now the
// query comes straight from the parsed receipt and we check that the URL
// actually serves an image before using it.

import { getTravilyKey } from "../utils/getKey.js";

const TAVILY_URL = "https://api.tavily.com/search";

const cleanDescription = (s) =>
  String(s || "")
    .replace(/\b\d+\s*(x|pcs?|pc|ml|g|kg|l)\b/gi, " ")
    .replace(/[#*@+·]|\b\d{4,}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function buildImageQuery(receipt) {
  const items = (receipt?.items || []).filter((i) => i.description);
  const main = [...items].sort((a, b) => (b.price || 0) * (b.quantity || 1) - (a.price || 0) * (a.quantity || 1))[0];
  const product = cleanDescription(main?.description).split(" ").slice(0, 5).join(" ");
  const store = cleanDescription(receipt?.store).split(" ").slice(0, 4).join(" ");

  if (product && product.length > 2) return `${product} product photo`;
  if (store) return `${store} store`;
  return null;
}

async function isImage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    // GET rather than HEAD: plenty of CDNs reject HEAD. We abort after headers.
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    const type = res.headers.get("content-type") || "";
    controller.abort();
    return res.ok && type.startsWith("image/");
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function findProductImage(query) {
  const apiKey = getTravilyKey();
  if (!apiKey || !query) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(TAVILY_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ query, include_images: true, search_depth: "basic", max_results: 3 }),
    });
    if (!res.ok) {
      console.warn(`[image] Tavily ${res.status} for "${query}"`);
      return null;
    }
    const { images = [] } = await res.json();
    const urls = images.map((i) => (typeof i === "string" ? i : i?.url)).filter((u) => /^https:\/\//.test(u || ""));

    // Check candidates in parallel, keep Tavily's ranking.
    const candidates = urls.slice(0, 4);
    const checks = await Promise.all(candidates.map(isImage));
    return candidates[checks.indexOf(true)] || null;
  } catch (err) {
    console.warn(`[image] lookup failed for "${query}": ${err.name === "AbortError" ? "timed out" : err.message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
