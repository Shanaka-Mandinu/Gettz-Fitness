import mongoose from "mongoose";
import Video from "../model/Video_Portal.js";


export async function uploadVideo(req, res) {
  if(req.user == null){
        res.status(403).json({
            message: "You need logging first to upload video"
        })
        return;
    }
    
  try {
    const video = new Video(req.body);
    await video.save();
    return res.status(201).json({ message: "Video created", video });
  } catch (err) {
    console.error("createVideo error:", err);
    return res.status(500).json({ message: "Failed to create video", error: err.message });
  }
}


export async function getAllvideo(req, res) {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    return res.json(videos);
  } catch (err) {
    console.error("getAllVideos error:", err);
    return res.status(500).json({ message: "Failed to fetch videos", error: err.message });
  }
}


export async function getVideoById(req, res) {
  try {
    const { id } = req.params;
    const video = await Video.findOne(
      mongoose.isValidObjectId(id) ? { $or: [{ videoId: id }, { _id: id }] } : { videoId: id }
    );
    if (!video) return res.status(404).json({ message: "Video not found" });
    return res.json(video);
  } catch (err) {
    console.error("getVideoById error:", err);
    return res.status(500).json({ message: "Failed to fetch video", error: err.message });
  }
}

export async function updateVideo(req, res) {
  try {
    const { videoId } = req.params;
    const id = videoId;
    const updated = await Video.findOneAndUpdate(
      mongoose.isValidObjectId(id) ? { $or: [{ videoId: id }, { _id: id }] } : { videoId: id },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Video not found" });
    return res.json({ message: "Video updated", video: updated });
  } catch (err) {
    console.error("updateVideo error:", err);
    return res.status(500).json({ message: "Failed to update video", error: err.message });
  }
}


export async function deleteVideo(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Video.findOneAndDelete(
      mongoose.isValidObjectId(id) ? { $or: [{ videoId: id }, { _id: id }] } : { videoId: id }
    );
    if (!deleted) return res.status(404).json({ message: "Video not found" });
    return res.json({ message: "Video deleted", video: deleted });
  } catch (err) {
    console.error("deleteVideo error:", err);
    return res.status(500).json({ message: "Failed to delete video", error: err.message });
  }
}


export async function addView(req, res) {
  try {
    const { id } = req.params;
    const updated = await Video.findOneAndUpdate(
      mongoose.isValidObjectId(id) ? { $or: [{ videoId: id }, { _id: id }] } : { videoId: id },
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Video not found" });

    return res.json({
      message: "View count updated",
      videoId: updated.videoId ?? String(updated._id),
      viewCount: updated.viewCount || 0,
      likeCount: updated.likeCount || 0,
    });
  } catch (err) {
    console.error("addView error:", err);
    return res.status(500).json({ message: "Failed to update view count", error: err.message });
  }
}


export async function toggleLike(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?._id; 

    if (userId) {
      const video = await Video.findOne(
        mongoose.isValidObjectId(id) ? { $or: [{ videoId: id }, { _id: id }] } : { videoId: id }
      );
      if (!video) return res.status(404).json({ message: "Video not found" });

      if (!Array.isArray(video.likedBy)) video.likedBy = [];
      if (typeof video.likeCount !== "number") video.likeCount = 0;

      const userIdStr = String(userId);
      const alreadyLiked = video.likedBy.some((u) => String(u) === userIdStr);

      if (alreadyLiked) {
        video.likedBy = video.likedBy.filter((u) => String(u) !== userIdStr);
        video.likeCount = Math.max(0, video.likeCount - 1);
      } else {
        video.likedBy.push(userId);
        video.likeCount = video.likeCount + 1;
      }

      await video.save();
      return res.json({
        message: alreadyLiked ? "Like removed" : "Liked",
        videoId: video.videoId ?? String(video._id),
        likeCount: video.likeCount,
        liked: !alreadyLiked,
      });
    }

    // Fallback: no user context
    let delta = Number(req.body?.delta ?? 1);
    if (!Number.isFinite(delta) || ![-1, 1].includes(delta)) delta = 1;

    const updated = await Video.findOneAndUpdate(
      mongoose.isValidObjectId(id) ? { $or: [{ videoId: id }, { _id: id }] } : { videoId: id },
      { $inc: { likeCount: delta } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Video not found" });

    if ((updated.likeCount ?? 0) < 0) {
      updated.likeCount = 0;
      await updated.save();
    }

    return res.json({
      message: "Like count updated",
      videoId: updated.videoId ?? String(updated._id),
      likeCount: updated.likeCount || 0,
    });
  } catch (err) {
    console.error("toggleLike error:", err);
    return res.status(500).json({ message: "Failed to update like count", error: err.message });
  }
}
