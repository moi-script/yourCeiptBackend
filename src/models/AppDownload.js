import mongoose from "mongoose";

// One counter document per downloadable file. The landing page serves the
// APK itself (not from GitHub), so GitHub's own download count stops growing.
const AppDownloadSchema = new mongoose.Schema({
  _id: { type: String, default: "android-apk" },
  count: { type: Number, default: 0 },
});

export default mongoose.model("app_download", AppDownloadSchema);
