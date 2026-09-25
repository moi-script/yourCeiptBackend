import express from "express";
import rateLimit from "express-rate-limit";
import AppDownload from "../models/AppDownload.js";

const app = express.Router();

// Tapping Download three times shouldn't count as three people.
const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/downloads", async (req, res) => {
  const doc = await AppDownload.findById("android-apk").lean();
  res.set("Cache-Control", "public, max-age=60");
  res.json({ count: doc?.count ?? 0 });
});

app.post("/downloads", downloadLimiter, async (req, res) => {
  const doc = await AppDownload.findByIdAndUpdate(
    "android-apk",
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  ).lean();
  res.json({ count: doc.count });
});

export default app;
