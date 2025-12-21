// models/Activity.js
import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  // This is the Magic Link
  user: {
    type: mongoose.Schema.Types.ObjectId, // It stores an ID
    ref: 'User',                          // It points to the 'User' model
    required: true
  },
  activityName: String,
  score: Number,
  completedAt: {
    type: Date,
    default: Date.now
  }
});

export const Activity = mongoose.model('Activity', activitySchema);