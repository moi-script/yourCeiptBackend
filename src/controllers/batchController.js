import { completeJson } from "../service/llm.js";
import { buildImageQuery, findProductImage } from "../service/productImage.js";
import { quickTextPrompt } from "../utils/prompts.js";
import { normalizeReceipt, assertUsableReceipt } from "../utils/receiptNormalize.js";

const MAX_TEXT = 2000;

// Turns a typed note ("lunch at jollibee 250") into a receipt object.
// The old version retried forever when a model failed; completeJson now
// walks a bounded fallback chain instead.
export async function quickParseText(req, res, next) {
  const { quickText, activeModelName } = req.body || {};
  const text = typeof quickText === "string" ? quickText.trim() : "";

  if (!text) return res.status(400).json({ message: "Type something to parse first.", status: 400 });
  if (text.length > MAX_TEXT) {
    return res.status(413).json({ message: `Keep it under ${MAX_TEXT} characters.`, status: 413 });
  }

  const timings = {};
  let started = Date.now();
  try {
    const { data, model } = await completeJson(quickTextPrompt(text), {
      preferredModel: activeModelName,
      validate: assertUsableReceipt,
    });
    const receipt = normalizeReceipt(data, { sourceType: "text" });
    receipt.metadata.notes = receipt.metadata.notes || text;
    timings.ai = Date.now() - started;
    started = Date.now();
    receipt.metadata.image_source = await findProductImage(buildImageQuery(receipt));
    timings.image = Date.now() - started;
    req.timings = timings;
    req.output = receipt;
    req.modelUsed = model;
    next();
  } catch (err) {
    console.error("[quickText] every model failed", err.attempts);
    res.status(503).json({ message: "The AI models are busy right now. Please try again shortly.", status: 503 });
  }
}
