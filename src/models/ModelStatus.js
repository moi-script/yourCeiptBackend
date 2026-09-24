import mongoose from "mongoose";

// Last probe results for the free model list, so a server restart (Render's
// free tier sleeps after 15 min idle) doesn't spend the OpenRouter daily
// free-request quota re-probing every model.
const ModelStatusSchema = new mongoose.Schema({
  _id: { type: String, default: "openrouter" },
  checkedAt: Date,
  models: [mongoose.Schema.Types.Mixed],
});

export default mongoose.model("model_status", ModelStatusSchema);
