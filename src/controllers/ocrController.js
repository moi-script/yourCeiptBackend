import { Readable } from "stream";
import config from "../config/config.js";
import { processImages } from "../service/ocr.js";
import { completeJson } from "../service/llm.js";
import { buildImageQuery, findProductImage } from "../service/productImage.js";
import { receiptImagePrompt } from "../utils/prompts.js";
import { normalizeReceipt, assertUsableReceipt } from "../utils/receiptNormalize.js";

const uploadReceiptPhoto = (buffer) =>
  new Promise((resolve) => {
    const stream = config.cloudinary.uploader.upload_stream(
      { folder: "user_receipt_image", resource_type: "image" },
      (error, result) => resolve(error ? null : { url: result.secure_url, id: result.public_id })
    );
    Readable.from(buffer).pipe(stream);
  });

// Nothing will be saved, so don't leave the uploaded photo behind.
const discardPhoto = (req) =>
  req.receiptImageUpload?.then((p) => p && config.cloudinary.uploader.destroy(p.id)).catch(() => null);

// Step 1: Azure Read turns the photo into text lines.
export const getUploadImages = async (req, res, next) => {
  if (!req.file?.buffer?.length) {
    return res.status(400).json({ message: "Attach a receipt image as 'image_buffer'.", code: 400 });
  }

  req.timings = {};
  const started = Date.now();
  // Upload the original photo alongside OCR when the user keeps receipt photos.
  req.receiptImageUpload = req.body?.keepImage === "true" ? uploadReceiptPhoto(req.file.buffer) : null;
  try {
    req.contents = await processImages(req.file.buffer);
    req.timings.ocr = Date.now() - started;
  } catch (err) {
    console.error("[ocr] Azure failed:", err.message);
    discardPhoto(req);
    if (err.badImage) {
      return res.status(422).json({ message: "That file couldn't be opened as a photo. Try a JPG or PNG.", code: 422 });
    }
    return res.status(502).json({ message: "Couldn't read the image. Try again in a moment.", code: 502 });
  }

  if (!req.contents.length) {
    discardPhoto(req);
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
    discardPhoto(req);
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
  const [productImage, photo] = await Promise.all([findProductImage(query), req.receiptImageUpload]);
  req.jsonResult.metadata.image_source = productImage;
  if (photo) {
    req.jsonResult.metadata.receipt_image = photo.url;
    req.jsonResult.metadata.receipt_image_id = photo.id;
  }
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
