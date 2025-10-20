import mongoose from "mongoose";
import "./user.js";

const playlistSchema = new mongoose.Schema({
  playlistId: {
    type: String,
    unique: true,
    default: function() {
      return "playlist" + Date.now() + Math.random().toString(36).substr(2, 9);
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  videos: [{
    video_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  thumbnail: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

const Playlist = mongoose.model("Playlist", playlistSchema);
export default Playlist;
