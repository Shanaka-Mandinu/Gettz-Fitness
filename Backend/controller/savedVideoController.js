import SavedVideo from "../model/savedVideo.js";
import Playlist from "../model/playlist.js";
import Video from "../model/Video_Portal.js";

// Save video for later
export async function saveVideo(req, res) {
  try {
    const { videoId } = req.params;
    const userId = req.user._id;

    // Check if video exists
    const video = await Video.findOne({ videoId });
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Check if already saved
    const existingSave = await SavedVideo.findOne({ 
      user_id: userId, 
      video_id: video._id 
    });

    if (existingSave) {
      return res.status(400).json({ message: "Video already saved" });
    }

    // Save the video
    const savedVideo = new SavedVideo({
      user_id: userId,
      video_id: video._id
    });

    await savedVideo.save();

    res.json({ 
      message: "Video saved successfully", 
      savedVideo: {
        id: savedVideo._id,
        videoId: video.videoId,
        title: video.title,
        savedAt: savedVideo.savedAt
      }
    });
  } catch (error) {
    console.error("Error saving video:", error);
    res.status(500).json({ message: "Error saving video", error: error.message });
  }
}

// Remove saved video
export async function unsaveVideo(req, res) {
  try {
    const { videoId } = req.params;
    const userId = req.user._id;

    // Find the video
    const video = await Video.findOne({ videoId });
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Remove the saved video
    const result = await SavedVideo.findOneAndDelete({ 
      user_id: userId, 
      video_id: video._id 
    });

    if (!result) {
      return res.status(404).json({ message: "Video not found in saved list" });
    }

    res.json({ message: "Video removed from saved list" });
  } catch (error) {
    console.error("Error removing saved video:", error);
    res.status(500).json({ message: "Error removing saved video", error: error.message });
  }
}

// Get user's saved videos
export async function getSavedVideos(req, res) {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const savedVideos = await SavedVideo.find({ user_id: userId })
      .populate('video_id', 'videoId title description duration category videoUrl createdAt viewCount likeCount')
      .sort({ savedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SavedVideo.countDocuments({ user_id: userId });

    res.json({
      savedVideos: savedVideos.map(sv => ({
        id: sv._id,
        video: sv.video_id,
        savedAt: sv.savedAt
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching saved videos:", error);
    res.status(500).json({ message: "Error fetching saved videos", error: error.message });
  }
}

// Check if video is saved by user
export async function checkVideoSaved(req, res) {
  try {
    const { videoId } = req.params;
    const userId = req.user._id;

    const video = await Video.findOne({ videoId });
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const savedVideo = await SavedVideo.findOne({ 
      user_id: userId, 
      video_id: video._id 
    });

    res.json({ 
      isSaved: !!savedVideo,
      savedAt: savedVideo?.savedAt || null
    });
  } catch (error) {
    console.error("Error checking saved video:", error);
    res.status(500).json({ message: "Error checking saved video", error: error.message });
  }
}

// Create playlist
export async function createPlaylist(req, res) {
  try {
    const { name, description, isPublic } = req.body;
    const userId = req.user._id;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "Playlist name is required" });
    }

    const playlist = new Playlist({
      name: name.trim(),
      description: description?.trim() || "",
      user_id: userId,
      isPublic: isPublic || false
    });

    await playlist.save();

    res.json({ 
      message: "Playlist created successfully", 
      playlist: {
        id: playlist._id,
        playlistId: playlist.playlistId,
        name: playlist.name,
        description: playlist.description,
        isPublic: playlist.isPublic,
        videoCount: playlist.videos.length,
        createdAt: playlist.createdAt
      }
    });
  } catch (error) {
    console.error("Error creating playlist:", error);
    res.status(500).json({ message: "Error creating playlist", error: error.message });
  }
}

// Add video to playlist
export async function addVideoToPlaylist(req, res) {
  try {
    const { playlistId, videoId } = req.params;
    const userId = req.user._id;

    // Find playlist
    const playlist = await Playlist.findOne({ 
      playlistId, 
      user_id: userId 
    });
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    // Find video
    const video = await Video.findOne({ videoId });
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Check if video already in playlist
    const existingVideo = playlist.videos.find(v => 
      v.video_id.toString() === video._id.toString()
    );

    if (existingVideo) {
      return res.status(400).json({ message: "Video already in playlist" });
    }

    // Add video to playlist
    playlist.videos.push({
      video_id: video._id,
      order: playlist.videos.length
    });

    await playlist.save();

    res.json({ 
      message: "Video added to playlist successfully",
      playlist: {
        id: playlist._id,
        playlistId: playlist.playlistId,
        name: playlist.name,
        videoCount: playlist.videos.length
      }
    });
  } catch (error) {
    console.error("Error adding video to playlist:", error);
    res.status(500).json({ message: "Error adding video to playlist", error: error.message });
  }
}

// Get user's playlists
export async function getUserPlaylists(req, res) {
  try {
    const userId = req.user._id;

    const playlists = await Playlist.find({ user_id: userId })
      .populate('videos.video_id', 'videoId title duration category videoUrl')
      .sort({ createdAt: -1 });

    res.json({
      playlists: playlists.map(playlist => ({
        id: playlist._id,
        playlistId: playlist.playlistId,
        name: playlist.name,
        description: playlist.description,
        isPublic: playlist.isPublic,
        videoCount: playlist.videos.length,
        videos: playlist.videos.map(v => ({
          video: v.video_id,
          addedAt: v.addedAt,
          order: v.order
        })),
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt
      }))
    });
  } catch (error) {
    console.error("Error fetching playlists:", error);
    res.status(500).json({ message: "Error fetching playlists", error: error.message });
  }
}

// Get playlist details
export async function getPlaylistDetails(req, res) {
  try {
    const { playlistId } = req.params;
    const userId = req.user._id;

    const playlist = await Playlist.findOne({ 
      playlistId, 
      user_id: userId 
    }).populate('videos.video_id', 'videoId title description duration category videoUrl createdAt viewCount likeCount');

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    res.json({
      playlist: {
        id: playlist._id,
        playlistId: playlist.playlistId,
        name: playlist.name,
        description: playlist.description,
        isPublic: playlist.isPublic,
        videoCount: playlist.videos.length,
        videos: playlist.videos.map(v => ({
          video: v.video_id,
          addedAt: v.addedAt,
          order: v.order
        })),
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt
      }
    });
  } catch (error) {
    console.error("Error fetching playlist details:", error);
    res.status(500).json({ message: "Error fetching playlist details", error: error.message });
  }
}
