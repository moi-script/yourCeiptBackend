import { canForceRefresh, listModels, refreshModels } from "../service/modelRegistry.js";
import Ai from "../models/Ai.js";

export async function getAiModels(req, res) {
  try {
    // ?refresh=1 re-probes (the "Check again" button). Throttled server-side
    // because probes spend the OpenRouter daily free quota.
    if (req.query.refresh) await refreshModels({ force: true });
    const result = await listModels();
    res.set("Cache-Control", req.query.refresh ? "no-store" : "public, max-age=60");
    res.status(200).json({ ...result, canRefresh: canForceRefresh() });
  } catch (err) {
    console.error("Unable to list models:", err.message);
    res.status(503).json({ models: [], checkedAt: null, message: "Model list unavailable" });
  }
}

export const saveAiModel = async (req, res) => {
  try {
    const { userId, modelName } = req.body;

    if (!userId || !modelName) {
      return res.status(400).json({ message: "userId and modelName are required" });
    }

    // One active model record per user.
    const updatedModel = await Ai.findOneAndUpdate(
      { userId },
      { model_name: modelName },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: "Active model updated", data: updatedModel });
  } catch (error) {
    console.error("Save/Update Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserModel = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const activeModel = await Ai.findOne({ userId }).sort({ updatedAt: -1 });

    if (!activeModel) {
      return res.status(404).json({ message: "No active model found for this user", model_name: null });
    }

    res.status(200).json({
      success: true,
      model_name: activeModel.model_name,
      activatedAt: activeModel.updatedAt,
    });
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
