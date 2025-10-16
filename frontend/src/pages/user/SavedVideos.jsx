import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  Bookmark, 
  Play, 
  Eye, 
  Heart, 
  Clock, 
  Calendar,
  Trash2,
  ExternalLink,
  Search,
  Filter
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

export default function SavedVideos() {
  const [savedVideos, setSavedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRemoving, setIsRemoving] = useState(null);

  const API_BASE = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") || "http://localhost:3000";

  useEffect(() => {
    loadSavedVideos();
  }, [currentPage]);

  const loadSavedVideos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE}/api/saved-videos/saved?page=${currentPage}&limit=12`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSavedVideos(response.data.savedVideos || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.savedVideos?.map(sv => sv.video?.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error loading saved videos:", error);
      toast.error("Failed to load saved videos");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVideo = async (videoId) => {
    try {
      setIsRemoving(videoId);
      const token = localStorage.getItem("token");
      
      await axios.delete(`${API_BASE}/api/saved-videos/unsave/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSavedVideos(prev => prev.filter(sv => sv.video.videoId !== videoId));
      toast.success("Video removed from saved list");
    } catch (error) {
      console.error("Error removing video:", error);
      toast.error("Failed to remove video");
    } finally {
      setIsRemoving(null);
    }
  };

  const filteredVideos = savedVideos.filter(sv => {
    const video = sv.video;
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || video.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-300 rounded-lg h-64"></div>
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
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-100 rounded-xl">
            <Bookmark className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Saved Videos</h1>
            <p className="text-gray-600">Your collection of saved workout videos</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search saved videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-12">
          <Bookmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {savedVideos.length === 0 ? "No Saved Videos" : "No Videos Found"}
          </h3>
          <p className="text-gray-500 mb-6">
            {savedVideos.length === 0 
              ? "Start saving videos from the video portal to see them here."
              : "Try adjusting your search or filter criteria."
            }
          </p>
          <Link
            to="/videos"
            className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Play className="h-4 w-4" />
            Browse Videos
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredVideos.map((savedVideo) => {
              const video = savedVideo.video;
              const thumb = ytThumb(video.videoUrl);
              
              return (
                <div key={savedVideo.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gray-200">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Link
                        to={`/videos/${video.videoId}`}
                        className="bg-red-600 text-white rounded-full p-3 shadow-lg hover:bg-red-700 transition-colors"
                      >
                        <Play className="h-6 w-6" />
                      </Link>
                    </div>

                    {/* Category Badge */}
                    {video.category && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-medium">
                          {video.category}
                        </span>
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveVideo(video.videoId)}
                      disabled={isRemoving === video.videoId}
                      className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-2 text-white transition-colors disabled:opacity-50"
                    >
                      {isRemoving === video.videoId ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    
                    {video.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {video.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(video.duration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{video.viewCount || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>Saved {new Date(savedVideo.savedAt).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={() => window.open(video.videoUrl, '_blank')}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === i + 1
                      ? 'bg-red-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
