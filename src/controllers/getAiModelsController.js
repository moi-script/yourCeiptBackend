import { getAiKey } from "../utils/getKey.js";
import { getFastFreeModel } from "../service/getFreeModels.js";
import Ai from "../models/Ai.js";

export async function getAiModels(req, res, next) {
    console.log('Getting ai models');
    try {
        
        req.models = await getFastFreeModel(getAiKey());
        next();
    } catch(err) {
        console.error('Unable to get free models');
        getModels(req, res, next)
    }
}



export const saveAiModel = async (req, res) => {
  try {
    const { userId, modelName } = req.body;

    // 1. Validation
    if (!userId || !modelName) {
      return res.status(400).json({ message: "userId and modelName are required" });
    }

    // 2. Find by userId and Update (or Insert if not found)
    // We search solely by userId so that one user only ever has ONE active model record
    const updatedModel = await Ai.findOneAndUpdate(
      { userId: userId },             // Filter: find the document with this userId
      { model_name: modelName },      // Update: set the new model name
      { 
        new: true,                    // Return the modified document rather than the original
        upsert: true,                 // Create a new document if one doesn't exist
        runValidators: true           // Ensure schema validation rules are followed
      }
    );

    // 3. Determine if it was an update or a new save for the message
    const isNew = updatedModel.createdAt === updatedModel.updatedAt;

    res.status(200).json({
      success: true,
      message: isNew ? "Model activated and saved" : "Active model updated successfully",
      data: updatedModel
    });

  } catch (error) {
    console.error("Save/Update Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserModel = async (req, res) => {
  try {
    const { userId } = req.query; // e.g., /extract/getactivemodel?userId=123

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find the most recent model activated by this user
    // .sort({ createdAt: -1 }) ensures we get the newest one first
    const activeModel = await Ai.findOne({ userId })
      .sort({ createdAt: -1 });

    if (!activeModel) {
      return res.status(404).json({ 
        message: "No active model found for this user",
        model_name: null 
      });
    }

    res.status(200).json({
      success: true,
      model_name: activeModel.model_name,
      activatedAt: activeModel.createdAt
    });

  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};