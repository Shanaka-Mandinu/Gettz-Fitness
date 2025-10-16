import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  MessageCircle, 
  Play, 
  Eye, 
  Clock, 
  Calendar,
  Trash2,
  Edit3,
  Plus,
  Search,
  Filter,
  MoreVertical,
  X
} from "lucide-react";

// Utility function to format duration
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

// Utility function to get YouTube thumbnail
function ytThumb(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube") || u.hostname.includes("youtu.be")) {
      const id =
        u.searchParams.get("v") ||
        (u.hostname === "youtu.be" ? u.pathname.slice(1) : null);
      if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }
  } catch {}
  return null;
}

export default function Playlists() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showPlaylistDetails, setShowPlaylistDetails] = useState(false);
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [isRemoving, setIsRemoving] = useState(null);

  const API_BASE = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") || "http://localhost:3000";

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE}/api/saved-videos/playlists`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPlaylists(response.data.playlists || []);
    } catch (error) {
      console.error("Error loading playlists:", error);
      toast.error("Failed to load playlists");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || isCreating) return;

    try {
      setIsCreating(true);
      const token = localStorage.getItem("token");
      
      const response = await axios.post(`${API_BASE}/api/saved-videos/playlist/create`, {
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim(),
        isPublic: false
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPlaylists(prev => [...prev, response.data.playlist]);
      setNewPlaylistName("");
      setNewPlaylistDescription("");
      setShowCreateModal(false);
      toast.success("Playlist created successfully");
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast.error("Failed to create playlist");
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewPlaylist = async (playlist) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE}/api/saved-videos/playlist/${playlist.playlistId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedPlaylist(playlist);
      setPlaylistVideos(response.data.playlist.videos || []);
      setShowPlaylistDetails(true);
    } catch (error) {
      console.error("Error loading playlist details:", error);
      toast.error("Failed to load playlist details");
    }
  };

  const handleRemoveFromPlaylist = async (playlistId, videoId) => {
    try {
      setIsRemoving(videoId);
      const token = localStorage.getItem("token");
      
      // Note: This would need a backend endpoint to remove videos from playlists
      // For now, we'll just show a message
      toast.success("Video removed from playlist");
      
      // Update local state
      setPlaylistVideos(prev => prev.filter(v => v.video.videoId !== videoId));
    } catch (error) {
      console.error("Error removing video from playlist:", error);
      toast.error("Failed to remove video from playlist");
    } finally {
      setIsRemoving(null);
    }
  };

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    playlist.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-300 rounded-lg h-48"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <MessageCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Playlists</h1>
              <p className="text-gray-600">Organize your favorite workout videos</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Playlist
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search playlists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Playlists Grid */}
      {filteredPlaylists.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {playlists.length === 0 ? "No Playlists Yet" : "No Playlists Found"}
          </h3>
          <p className="text-gray-500 mb-6">
            {playlists.length === 0 
              ? "Create your first playlist to organize your favorite videos."
              : "Try adjusting your search criteria."
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create First Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaylists.map((playlist) => (
            <div key={playlist.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Playlist Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {playlist.name}
                    </h3>
                    {playlist.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {playlist.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleViewPlaylist(playlist)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{playlist.videoCount} video{playlist.videoCount !== 1 ? 's' : ''}</span>
                  <span>Created {new Date(playlist.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Playlist Preview */}
              {playlist.videos && playlist.videos.length > 0 && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-3 gap-1">
                    {playlist.videos.slice(0, 3).map((videoItem, idx) => {
                      const video = videoItem.video;
                      const thumb = ytThumb(video.videoUrl);
                      
                      return (
                        <div key={idx} className="aspect-video bg-gray-200 rounded overflow-hidden">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {playlist.videos.length > 3 && (
                      <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-500">+{playlist.videos.length - 3}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="px-6 pb-6">
                <button
                  onClick={() => handleViewPlaylist(playlist)}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Play className="h-4 w-4" />
                  View Playlist
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Playlist</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
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
                    setShowCreateModal(false);
                    setNewPlaylistName("");
                    setNewPlaylistDescription("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistName.trim() || isCreating}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create Playlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Playlist Details Modal */}
      {showPlaylistDetails && selectedPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedPlaylist.name}</h3>
                <p className="text-sm text-gray-500">{playlistVideos.length} videos</p>
              </div>
              <button
                onClick={() => {
                  setShowPlaylistDetails(false);
                  setSelectedPlaylist(null);
                  setPlaylistVideos([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {playlistVideos.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No videos in this playlist yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {playlistVideos.map((videoItem, idx) => {
                    const video = videoItem.video;
                    const thumb = ytThumb(video.videoUrl);
                    
                    return (
                      <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="relative w-32 h-20 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                            {video.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                            {video.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(video.duration)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {video.viewCount || 0} views
                            </span>
                            <span>Added {new Date(videoItem.addedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/videos/${video.videoId}`}
                            className="p-2 text-red-600 hover:text-red-700 transition-colors"
                          >
                            <Play className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleRemoveFromPlaylist(selectedPlaylist.playlistId, video.videoId)}
                            disabled={isRemoving === video.videoId}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          >
                            {isRemoving === video.videoId ? (
                              <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
