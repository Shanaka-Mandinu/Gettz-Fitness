import mongoose from "mongoose";
import "./user.js";
import "./Video_Portal.js";

const savedVideoSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  video_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
    required: true,
    index: true
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound index to prevent duplicate saves
savedVideoSchema.index({ user_id: 1, video_id: 1 }, { unique: true });

const SavedVideo = mongoose.model("SavedVideo", savedVideoSchema);
export default SavedVideo;
