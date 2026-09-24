import { processImages } from "../service/ocr.js";
import { completeJson } from "../service/llm.js";
import { buildImageQuery, findProductImage } from "../service/productImage.js";
import { receiptImagePrompt } from "../utils/prompts.js";
import { normalizeReceipt, assertUsableReceipt } from "../utils/receiptNormalize.js";

// Step 1: Azure Read turns the photo into text lines.
export const getUploadImages = async (req, res, next) => {
  if (!req.file?.buffer?.length) {
    return res.status(400).json({ message: "Attach a receipt image as 'image_buffer'.", code: 400 });
  }

  req.timings = {};
  const started = Date.now();
  try {
    req.contents = await processImages(req.file.buffer);
    req.timings.ocr = Date.now() - started;
  } catch (err) {
    console.error("[ocr] Azure failed:", err.message);
    if (err.badImage) {
      return res.status(422).json({ message: "That file couldn't be opened as a photo. Try a JPG or PNG.", code: 422 });
    }
    return res.status(502).json({ message: "Couldn't read the image. Try again in a moment.", code: 502 });
  }

  if (!req.contents.length) {
    return res.status(422).json({
      message: "No text found. Make sure the whole receipt is in frame and well lit.",
      code: 422,
    });
  }
  next();
};

// Step 2: a model structures the lines into the receipt schema.
export const extractReceiptJson = async (req, res, next) => {
  const started = Date.now();
  try {
    const { data, model, attempts } = await completeJson(receiptImagePrompt(req.contents), {
      preferredModel: req.body?.activeModelName,
      validate: assertUsableReceipt,
    });
    req.jsonResult = normalizeReceipt(data, { sourceType: "image" });
    req.modelUsed = model;
    req.attempts = attempts;
    req.timings.ai = Date.now() - started;
    next();
  } catch (err) {
    console.error("[ocr] every model failed", err.attempts);
    res.status(503).json({
      message: "The AI models are busy right now. Your photo was read, please try again shortly.",
      code: 503,
      attempts: err.attempts,
    });
  }
};

// Step 3: attach a product picture for the receipt card. Never blocks the result.
export const attachProductImage = async (req, res, next) => {
  const started = Date.now();
  const query = buildImageQuery(req.jsonResult);
  req.jsonResult.metadata.image_source = await findProductImage(query);
  req.timings.image = Date.now() - started;
  next();
};

export const sendReceipt = (req, res) => {
  res.status(200).json({
    message: "Done extracting text",
    code: 200,
    contents: req.jsonResult,
    model: req.modelUsed,
    attempts: req.attempts,
    timings: req.timings,
  });
};
