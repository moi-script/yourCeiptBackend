// Privacy & security settings. Every handler here runs after verifyToken,
// so the user comes from the session cookie, never from the request body.

import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Receipt from "../models/Receipt.js";
import Manual from "../models/Manual.js";
import Budget from "../models/Budget.js";
import Notification from "../models/Notification.js";
import Ai from "../models/Ai.js";
import config from "../config/config.js";
import { sendMail } from "../utils/mailer.js";

const LOGIN_CODE_TTL_MS = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

const cookieOptions = { httpOnly: true, secure: true, sameSite: "none", path: "/" };

export const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
};

const describeDevice = (ua = "") => {
  const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad/i.test(ua) ? "iOS" : /Windows/i.test(ua) ? "Windows"
    : /Mac OS/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : "Unknown device";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome"
    : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  return `${browser} on ${os}`;
};

// Called by the login route once the password checks out. Either finishes the
// login (next) or, with two-step sign-in on, emails a code and stops here.
export const handleSecondFactor = async (req, res, next) => {
  const user = await User.findById(req.userId);
  req.tokenVersion = user.tokenVersion ?? 0;

  if (!user.twoFactor) {
    user.lastLoginAt = new Date();
    user.lastLoginDevice = describeDevice(req.headers["user-agent"]);
    await user.save();
    return next();
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  user.loginOtp = await bcrypt.hash(code, 8);
  user.loginOtpExpires = new Date(Date.now() + LOGIN_CODE_TTL_MS);
  user.loginOtpAttempts = 0;
  await user.save();

  try {
    await sendMail({
      to: user.email,
      subject: `Your Recepta sign-in code: ${code}`,
      text: `Your sign-in code is ${code}. It expires in 10 minutes.\n\nIf you didn't try to sign in, change your password in Privacy & Security.`,
    });
  } catch (err) {
    console.error("Couldn't send sign-in code:", err.message);
    return res.status(502).json({ message: "We couldn't email your sign-in code. Try again in a minute.", status: 502 });
  }

  const [name, domain] = user.email.split("@");
  res.status(202).json({
    status: 202,
    twoFactor: true,
    email: user.email,
    maskedEmail: `${name.slice(0, 2)}${"•".repeat(Math.max(1, name.length - 2))}@${domain}`,
  });
};

export const verifyLoginCode = async (req, res, next) => {
  const { email, code } = req.body || {};
  const user = await User.findOne({ email: String(email || "").toLowerCase() });

  if (!user?.loginOtp || !user.loginOtpExpires || user.loginOtpExpires < new Date()) {
    return res.status(400).json({ message: "That code has expired. Sign in again to get a new one.", status: 400 });
  }
  if (user.loginOtpAttempts >= MAX_CODE_ATTEMPTS) {
    return res.status(429).json({ message: "Too many wrong codes. Sign in again to get a new one.", status: 429 });
  }

  const ok = await bcrypt.compare(String(code || "").trim(), user.loginOtp);
  if (!ok) {
    user.loginOtpAttempts += 1;
    await user.save();
    return res.status(401).json({ message: "That code isn't right.", status: 401 });
  }

  user.loginOtp = undefined;
  user.loginOtpExpires = undefined;
  user.loginOtpAttempts = 0;
  user.lastLoginAt = new Date();
  user.lastLoginDevice = describeDevice(req.headers["user-agent"]);
  await user.save();

  req.userId = user._id;
  req.tokenVersion = user.tokenVersion ?? 0;
  req.user = await User.findById(user._id)
    .select("fullname nickname email _id currency theme nearLimit overSpending image_profile image_public_url twoFactor keepReceiptImages")
    .lean();
  next();
};

export const getSecurity = async (req, res) => {
  const u = req.user;
  res.json({
    twoFactor: Boolean(u.twoFactor),
    keepReceiptImages: u.keepReceiptImages !== false,
    lastLoginAt: u.lastLoginAt || null,
    lastLoginDevice: u.lastLoginDevice || null,
    currentDevice: describeDevice(req.headers["user-agent"]),
  });
};

export const updateSecurity = async (req, res) => {
  const update = {};
  if (typeof req.body?.twoFactor === "boolean") update.twoFactor = req.body.twoFactor;
  if (typeof req.body?.keepReceiptImages === "boolean") update.keepReceiptImages = req.body.keepReceiptImages;
  if (!Object.keys(update).length) return res.status(400).json({ message: "Nothing to update" });

  const u = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true }).select("twoFactor keepReceiptImages").lean();
  res.json({ twoFactor: Boolean(u.twoFactor), keepReceiptImages: u.keepReceiptImages !== false });
};

// Followed by generateTokenAndSetCookie in the route, then a responder.
export const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body || {};
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return res.status(400).json({ message: "Use at least 8 characters for the new password." });
  }

  const user = await User.findById(req.user._id);
  if (!(await user.checkPassword(String(currentPassword || "")))) {
    return res.status(401).json({ message: "Your current password isn't right." });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.tokenVersion = (user.tokenVersion ?? 0) + 1; // sign out other devices
  await user.save();

  // Keep this device signed in with a fresh token.
  req.userId = user._id;
  req.tokenVersion = user.tokenVersion;
  next();
};

export const signOutEverywhere = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
  clearAuthCookies(res);
  res.json({ message: "Signed out on every device." });
};

export const exportMyData = async (req, res) => {
  const userId = req.user._id;
  const [receipts, budgets, notifications] = await Promise.all([
    Receipt.find({ userId }).select("-__v").lean(),
    Budget.find({ userId }).select("-__v").lean(),
    Notification.find({ userId }).select("-__v").lean(),
  ]);
  const { tokenVersion, ...profile } = req.user; // eslint-disable-line no-unused-vars

  res.setHeader("Content-Disposition", `attachment; filename="recepta-export-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json({ exportedAt: new Date().toISOString(), profile, receipts, budgets, notifications });
};

export const deleteAccount = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!(await user.checkPassword(String(req.body?.password || "")))) {
    return res.status(401).json({ message: "That password isn't right." });
  }

  const userId = user._id;
  const receipts = await Receipt.find({ userId, "metadata.receipt_image_id": { $exists: true } })
    .select("metadata.receipt_image_id").lean();
  const imageIds = receipts.map((r) => r.metadata.receipt_image_id).filter(Boolean);
  if (user.image_public_url) imageIds.push(user.image_public_url);

  await Promise.all([
    Receipt.deleteMany({ userId }),
    Manual.deleteMany({ userId }),
    Budget.deleteMany({ userId }),
    Notification.deleteMany({ userId }),
    Ai.deleteMany({ userId: String(userId) }),
    ...imageIds.map((id) => config.cloudinary.uploader.destroy(id).catch(() => null)),
  ]);
  await User.deleteOne({ _id: userId });

  clearAuthCookies(res);
  res.json({ message: "Your account and all of its data were deleted." });
};
