import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  ArrowLeft, 
  Heart, 
  Eye, 
  AlertTriangle, 
  Share2, 
  Clock, 
  Play, 
  Calendar,
  User,
  ThumbsUp,
  MessageCircle,
  Bookmark,
  ExternalLink,
  X,
  Plus
} from "lucide-react";
import Header from "../../components/header";

// Utility function to format duration from seconds to readable format
function formatDuration(seconds) {
  if (!seconds || seconds < 0) return "0 min";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes} min`;
  } else {
    return `${remainingSeconds} sec`;
  }
}

const RAW_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
const API_BASE = RAW_BASE.replace(/\/+$/, "");

const endpoints = {
  getOne: (id) => `${API_BASE}/api/video/${id}`,
  addView: (id) => `${API_BASE}/api/video/${id}/view`,
  toggleLike: (id) => `${API_BASE}/api/video/${id}/like`,
  saveVideo: (id) => `${API_BASE}/api/saved-videos/save/${id}`,
  unsaveVideo: (id) => `${API_BASE}/api/saved-videos/unsave/${id}`,
  checkSaved: (id) => `${API_BASE}/api/saved-videos/check-saved/${id}`,
  getUserProfile: () => `${API_BASE}/api/user/profile`,
  getPlaylists: () => `${API_BASE}/api/saved-videos/playlists`,
  createPlaylist: () => `${API_BASE}/api/saved-videos/playlist/create`,
  addToPlaylist: (playlistId, videoId) => `${API_BASE}/api/saved-videos/playlist/${playlistId}/add/${videoId}`,
};

function parseYouTubeId(url) {
  if (!url) return null;
  const raw = (url || "").trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const isYT = host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com";
    if (!isYT) return null;
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id || null;
    }
    const v = u.searchParams.get("v");
    if (v) return v;
    const m = u.pathname.match(/\/(shorts|embed|live)\/([^/?#]+)/i);
    if (m && m[2]) return m[2];
    return null;
  } catch {
    return null;
  }
}

function toYouTubeEmbed(url) {
  const id = parseYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

function normalizeDriveDirect(url) {
  try {
    const raw = (url || "").trim();
    if (!raw) return "";
    const u = new URL(raw);
    if (!u.hostname.includes("drive.google.com")) return raw;
    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (m && m[1]) {
      return `https://drive.google.com/uc?export=download&id=${m[1]}`;
    }
    return raw;
  } catch {
    return (url || "").trim();
  }
}

export default function VideoDetails() {       // Workout Details Page
  const { videoId } = useParams();
  const [data, setData] = useState(null);
  const [likeBusy, setLikeBusy] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingToPlaylist, setIsAddingToPlaylist] = useState(false);
  
  const viewKey = useMemo(() => `viewed:${(videoId || "").trim()}`, [videoId]);
  const likeKey = useMemo(() => `liked:${(videoId || "").trim()}`, [videoId]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await axios.get(endpoints.getOne((videoId || "").trim()));
        if (!mounted) return;
        setData(res.data || null);
      } catch {
        try {
          const all = await axios.get(`${API_BASE}/api/video`);
          const id = (videoId || "").trim();
          const found = (all.data || []).find(
            (v) => String(v.videoId).trim() === id
          );
          setData(found || null);
        } catch (err) {
          console.error(err);
          toast.error("Failed to load video");
          setData(null);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [videoId]);

  // Load user profile and check saved status
  useEffect(() => {
    async function loadUserData() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Load user profile
        const profileRes = await axios.get(endpoints.getUserProfile(), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserProfile(profileRes.data);

        // Check if video is saved
        const savedRes = await axios.get(endpoints.checkSaved(videoId), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsSaved(savedRes.data.isSaved);
        setSavedAt(savedRes.data.savedAt);

        // Load user playlists
        const playlistsRes = await axios.get(endpoints.getPlaylists(), {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Playlists response:", playlistsRes.data);
        setPlaylists(playlistsRes.data.playlists || []);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    }

    if (data) {
      loadUserData();
    }
  }, [data, videoId]);

  const rawUrl = (data?.videoUrl || "").trim();            // URL of the video
  const ytEmbed = useMemo(() => toYouTubeEmbed(rawUrl), [rawUrl]);    // YouTube embed URL if applicable
  const fileSrc = useMemo(() => {
    if (ytEmbed) return null;
    if (!rawUrl) return null;
    return normalizeDriveDirect(rawUrl);     
  }, [ytEmbed, rawUrl]);

  useEffect(() => {             // Increment view count on first load
    if (!data) return;
    if (sessionStorage.getItem(viewKey)) return;
    sessionStorage.setItem(viewKey, "1");
    setData((d) => (d ? { ...d, viewCount: (d.viewCount || 0) + 1 } : d));
    axios
      .post(endpoints.addView(videoId))
      .then((res) => {
        const { viewCount, likeCount } = res.data || {};
        setData((d) =>
          d
            ? {
                ...d,
                viewCount:
                  typeof viewCount === "number" ? viewCount : d.viewCount,
                likeCount:
                  typeof likeCount === "number" ? likeCount : d.likeCount,
              }
            : d
        );
      })
      .catch(() => {
        sessionStorage.removeItem(viewKey);
        console.warn("view bump failed");
      });
  }, [data, videoId, viewKey]);

  async function handleLike() {
    if (!data || likeBusy) return;
    const alreadyLocal = localStorage.getItem(likeKey) === "1";
    setLikeBusy(true);
    setData((d) =>
      d ? { ...d, likeCount: (d.likeCount || 0) + (alreadyLocal ? -1 : 1) } : d
    );
    try {
      const res = await axios.post(endpoints.toggleLike(videoId), {
        delta: alreadyLocal ? -1 : 1,
      });
      if (alreadyLocal) localStorage.removeItem(likeKey);
      else localStorage.setItem(likeKey, "1");
      const { likeCount } = res.data || {};
      if (typeof likeCount === "number") {
        setData((d) => (d ? { ...d, likeCount } : d));
      }
    } catch (e) {
      setData((d) =>
        d ? { ...d, likeCount: (d.likeCount || 0) + (alreadyLocal ? 1 : -1) } : d
      );
      const msg =
        e?.response?.data?.message || e?.message || "Failed to update like";
      toast.error(msg);
    } finally {
      setLikeBusy(false);
    }
  }

  // Handle save/unsave video
  async function handleSaveVideo() {
    if (!data || isSaving) return;
    
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to save videos");
      return;
    }

    setIsSaving(true);
    try {
      if (isSaved) {
        await axios.delete(endpoints.unsaveVideo(videoId), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsSaved(false);
        setSavedAt(null);
        toast.success("Video removed from saved list");
      } else {
        await axios.post(endpoints.saveVideo(videoId), {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsSaved(true);
        setSavedAt(new Date());
        toast.success("Video saved for later");
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || "Failed to save video";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  // Handle create playlist
  async function handleCreatePlaylist() {
    if (!newPlaylistName.trim() || isCreatingPlaylist) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to create playlists");
      return;
    }

    setIsCreatingPlaylist(true);
    try {
      const res = await axios.post(endpoints.createPlaylist(), {
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim(),
        isPublic: false
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Created playlist:", res.data.playlist);
      setPlaylists(prev => [...prev, res.data.playlist]);
      setNewPlaylistName("");
      setNewPlaylistDescription("");
      setShowCreatePlaylistModal(false);
      toast.success("Playlist created successfully");
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || "Failed to create playlist";
      toast.error(msg);
    } finally {
      setIsCreatingPlaylist(false);
    }
  }

  // Handle add video to playlist
  async function handleAddToPlaylist(playlistId) {
    if (!data || isAddingToPlaylist) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to add videos to playlists");
      return;
    }

    console.log("Adding video to playlist:", { playlistId, videoId });
    setIsAddingToPlaylist(true);
    try {
      const response = await axios.post(endpoints.addToPlaylist(playlistId, videoId), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Add to playlist response:", response.data);
      toast.success("Video added to playlist");
      setShowPlaylistModal(false);
    } catch (error) {
      console.error("Error adding to playlist:", error);
      const msg = error?.response?.data?.message || error?.message || "Failed to add video to playlist";
      toast.error(msg);
    } finally {
      setIsAddingToPlaylist(false);
    }
  }

  const hasPlayable = Boolean(ytEmbed || fileSrc);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/videos"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Videos</span>
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!data ? (
          <div className="animate-pulse">
            <div className="bg-gray-300 rounded-2xl h-96 mb-8"></div>
            <div className="bg-gray-300 rounded-lg h-8 mb-4"></div>
            <div className="bg-gray-300 rounded-lg h-4 mb-2"></div>
            <div className="bg-gray-300 rounded-lg h-4 w-3/4"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Video Player */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                <div className="relative bg-black">
                  {ytEmbed ? (
                    <iframe
                      className="aspect-video w-full min-h-[400px]"
                      src={ytEmbed}
                      title={data.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : fileSrc ? (
                    <video
                      className="aspect-video w-full min-h-[400px]"
                      controls
                      playsInline
                      preload="metadata"
                      crossOrigin="anonymous"
                      poster="/api/placeholder/800/450"
                    >
                      <source src={fileSrc} type="video/mp4" />
                      <source src={fileSrc} />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="aspect-video w-full min-h-[400px] flex items-center justify-center bg-gray-900">
                      <div className="text-center">
                        <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Video Not Available</h3>
                        <p className="text-gray-400">This video cannot be played at the moment.</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Video Overlay Actions */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button className="bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-3 text-white transition-all duration-200 hover:scale-105">
                      <Bookmark size={20} />
                    </button>
                    <button className="bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-3 text-white transition-all duration-200 hover:scale-105">
                      <Share2 size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Video Information */}
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                      {data.title}
                    </h1>
                    
                    {/* Video Stats */}
                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Eye size={18} />
                        <span className="font-medium">{data.viewCount ?? 0} views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={18} />
                        <span className="font-medium">
                          {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={18} />
                        <span className="font-medium">{formatDuration(data.duration)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleLike}
                      disabled={likeBusy}
                      className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-60"
                    >
                      <Heart className={`${likeBusy ? 'animate-pulse' : ''}`} size={20} />
                      <span>{data.likeCount ?? 0}</span>
                    </button>
                    <button className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105">
                      <Share2 size={20} />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                {/* Video Description */}
                {data.description && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">About This Workout</h3>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {data.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Workout Steps */}
              {Array.isArray(data.workOutStep) && data.workOutStep.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-red-100 p-3 rounded-xl">
                      <Play className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Workout Steps</h2>
                      <p className="text-gray-600">Follow along with these detailed instructions</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {data.workOutStep.filter(Boolean).map((step, idx) => (
                      <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 font-medium leading-relaxed">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Quick Stats */}
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Workout Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-red-600" />
                      <span className="text-gray-700 font-medium">Duration</span>
                    </div>
                    <span className="font-bold text-gray-900">{formatDuration(data.duration)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-700 font-medium">Category</span>
                    </div>
                    <span className="font-bold text-gray-900">{data.category || 'General'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ThumbsUp className="h-5 w-5 text-green-600" />
                      <span className="text-gray-700 font-medium">Views</span>
                    </div>
                    <span className="font-bold text-gray-900">{data.viewCount || 0}</span>
                  </div>
                  {data.tags && data.tags.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="h-5 w-5 text-purple-600" />
                        <span className="text-gray-700 font-medium">Tags</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {data.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {data.tags.length > 3 && (
                          <span className="text-gray-500 text-xs">+{data.tags.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Related Actions */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={handleSaveVideo}
                    disabled={isSaving}
                    className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors ${
                      isSaved 
                        ? 'bg-red-50 text-red-700 hover:bg-red-100' 
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Bookmark className={`h-5 w-5 ${isSaved ? 'text-red-600' : 'text-gray-600'}`} />
                    <span className="font-medium">
                      {isSaving ? 'Saving...' : isSaved ? 'Saved for Later' : 'Save for Later'}
                    </span>
                    {isSaved && savedAt && (
                      <span className="text-xs text-gray-500 ml-auto">
                        {new Date(savedAt).toLocaleDateString()}
                      </span>
                    )}
                  </button>
                  
                  <button 
                    onClick={async () => {
                      console.log("Opening playlist modal, current playlists:", playlists);
                      // Refresh playlists when opening modal
                      try {
                        const token = localStorage.getItem("token");
                        if (token) {
                          const playlistsRes = await axios.get(endpoints.getPlaylists(), {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          console.log("Refreshed playlists:", playlistsRes.data);
                          setPlaylists(playlistsRes.data.playlists || []);
                        }
                      } catch (error) {
                        console.error("Error refreshing playlists:", error);
                      }
                      setShowPlaylistModal(true);
                    }}
                    className="w-full flex items-center gap-3 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
                  >
                    <MessageCircle className="h-5 w-5 text-gray-600" />
                    <span className="font-medium">Add to Playlist</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
                    </span>
                  </button>
                  
                  <button 
                    onClick={() => window.open(data.videoUrl, '_blank')}
                    className="w-full flex items-center gap-3 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
                  >
                    <ExternalLink className="h-5 w-5 text-gray-600" />
                    <span className="font-medium">Watch on YouTube</span>
                  </button>
                </div>

                {/* User Profile Info */}
                {userProfile && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Your Profile</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {userProfile.firstName} {userProfile.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{userProfile.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                            {userProfile.role}
                          </span>
                          {userProfile.point > 0 && (
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                              {userProfile.point} pts
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Playlist Selection Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add to Playlist</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("token");
                      if (token) {
                        const playlistsRes = await axios.get(endpoints.getPlaylists(), {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        setPlaylists(playlistsRes.data.playlists || []);
                        toast.success("Playlists refreshed");
                      }
                    } catch (error) {
                      console.error("Error refreshing playlists:", error);
                      toast.error("Failed to refresh playlists");
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Refresh playlists"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowPlaylistModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Debug info */}
              <div className="text-xs text-gray-400 mb-2">
                Debug: {playlists.length} playlists loaded
              </div>
              {playlists.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No playlists yet</p>
                  <button
                    onClick={() => {
                      setShowPlaylistModal(false);
                      setShowCreatePlaylistModal(true);
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Create First Playlist
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => handleAddToPlaylist(playlist.playlistId)}
                      disabled={isAddingToPlaylist}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{playlist.name}</p>
                        <p className="text-sm text-gray-500">
                          {playlist.videoCount} video{playlist.videoCount !== 1 ? 's' : ''}
                        </p>
                        {playlist.description && (
                          <p className="text-xs text-gray-400 mt-1">{playlist.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-gray-400" />
                        {isAddingToPlaylist && (
                          <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </div>
                    </button>
                  ))}
                  
                  <button
                    onClick={() => {
                      setShowPlaylistModal(false);
                      setShowCreatePlaylistModal(true);
                    }}
                    className="w-full flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-red-300 hover:text-red-600 transition-colors"
                  >
                    <Plus size={20} />
                    <span>Create New Playlist</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreatePlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Playlist</h3>
              <button
                onClick={() => {
                  setShowCreatePlaylistModal(false);
                  setNewPlaylistName("");
                  setNewPlaylistDescription("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Playlist Name
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="My Workout Playlist"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="Describe your playlist..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreatePlaylistModal(false);
                    setNewPlaylistName("");
                    setNewPlaylistDescription("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistName.trim() || isCreatingPlaylist}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingPlaylist ? 'Creating...' : 'Create Playlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
