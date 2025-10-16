import { useEffect, useState } from "react";
import axios from "axios";
import VideoCard from "../../components/VideoCard";
import toast from "react-hot-toast";
import Header from "../../components/header";
import HomeFooter from "../../components/homeFooter";
import ChatBot from "../../components/ChatBot/chatBot";
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  SortAsc, 
  SortDesc,
  Play,
  Clock,
  Eye,
  Heart,
  TrendingUp,
  Star,
  Calendar,
  Users,
  Zap
} from "lucide-react";

const RAW_BASE = import.meta.env.VITE_BACKEND_URL;
const API_BASE = RAW_BASE.replace(/\/+$/, "");

export default function VideoPortal() {
  const [videos, setVideos] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/video`)
      .then((res) => {
        setVideos(res.data || []);

        const cats = Array.from(
          new Set((res.data || []).map((v) => v.category).filter(Boolean))
        );
        setCategories(cats);
      })
      .catch((e) => {
        console.error(e);
        toast.error("Failed to load videos");
        setVideos([]);
        setCategories([]);
      });
  }, []);

  const filteredVideos = (videos || [])
    .filter((v) => v.isPublished !== false)
    .filter((v) => selectedCategory === "all" || v.category === selectedCategory)
    .filter((v) => {
      if (!search.trim()) return true;
      const s = search.trim().toLowerCase();
      return (
        (v.title && v.title.toLowerCase().includes(s)) ||
        (v.description && v.description.toLowerCase().includes(s))
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "oldest":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case "views":
          return (b.viewCount || 0) - (a.viewCount || 0);
        case "likes":
          return (b.likeCount || 0) - (a.likeCount || 0);
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        default:
          return 0;
      }
    });

  const totalVideos = filteredVideos.length;
  const totalViews = filteredVideos.reduce((sum, v) => sum + (v.viewCount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Video Training Portal
            </h1>
            <p className="text-xl text-red-100 mb-8 max-w-3xl mx-auto">
              Discover expert-led fitness videos, workout routines, and training sessions 
              designed to help you achieve your fitness goals.
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold">{totalVideos}</div>
                <div className="text-red-200 text-sm">Videos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
                <div className="text-red-200 text-sm">Total Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{categories.length}</div>
                <div className="text-red-200 text-sm">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-red-200 text-sm">Access</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
              {/* Search */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Search className="h-5 w-5 text-red-600" />
                  Search Videos
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title or description..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Filter className="h-5 w-5 text-red-600" />
                  Categories
                </h3>
                <div className="space-y-2">
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-left transition-all duration-200 ${
                      selectedCategory === "all"
                        ? "bg-red-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                    }`}
                    onClick={() => setSelectedCategory("all")}
                  >
                    <Play className="h-4 w-4" />
                    All Videos
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-left transition-all duration-200 ${
                        selectedCategory === cat
                          ? "bg-red-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                      }`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      <Zap className="h-4 w-4" />
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <SortAsc className="h-5 w-5 text-red-600" />
                  Sort By
                </h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="views">Most Viewed</option>
                  <option value="likes">Most Liked</option>
                  <option value="title">Alphabetical</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Controls Bar */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedCategory === "all" ? "All Videos" : selectedCategory}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {totalVideos} video{totalVideos !== 1 ? 's' : ''} found
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        viewMode === "grid" 
                          ? "bg-white text-red-600 shadow-md" 
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Grid3X3 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        viewMode === "list" 
                          ? "bg-white text-red-600 shadow-md" 
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Videos Grid/List */}
            {!videos ? (
              <div className={`grid gap-6 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-300 rounded-2xl h-48 mb-4"></div>
                    <div className="bg-gray-300 rounded-lg h-4 mb-2"></div>
                    <div className="bg-gray-300 rounded-lg h-4 w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Videos Found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search terms or category filters.
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("all");
                  }}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={`grid gap-6 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {filteredVideos.map((v) => (
                  <VideoCard key={v.videoId} v={v} viewMode={viewMode} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <ChatBot />
      <HomeFooter />
    </div>
  );
}
