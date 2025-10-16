// src/utils/Testing/Video.jsx

import axios from "axios";
import Loader from "../../../components/lorder-animate";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import GymLogo from "../../../assets/GymLogo.jpg";
import { Eye, Play, Calendar, Clock, Users, ThumbsUp, Download, Edit, Trash2, Search, Filter, X, FileText, BarChart3 } from "lucide-react";

export default function VideoDetailsPage() {
  const [video, setVideo] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("monthly");
  
  // Video report generation state
  const [reportFilters, setReportFilters] = useState({
    startDate: '',
    endDate: '',
    category: 'all',
    status: 'all',
    reportType: 'custom'
  });
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dateValidationErrors, setDateValidationErrors] = useState({});
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!loaded) {
      axios
        .get(`${import.meta.env.VITE_BACKEND_URL}/api/video`)
        .then((res) => {
          setVideo(res.data || []);
          setLoaded(true);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Failed to load videos");
        });
    }
  }, [loaded]);

  async function confirmDelete(id) {
    toast.custom((t) => (
      <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-4 flex flex-col gap-3 w-72">
        <p className="text-sm text-gray-800">Are you sure you want to delete this video?</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 rounded-md border text-sm hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              deleteVideo(id);
            }}
            className="px-3 py-1 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    ));
  }

  async function deleteVideo(id) {
    const token = localStorage.getItem("token") || localStorage.getItem("jwt");
    if (!token) {
      toast.error("You must be logged in to delete a video");
      return;
    }
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/video/delete/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Video deleted successfully");
      setLoaded(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete video");
    }
  }

  // View video details function
  const handleViewVideo = (videoData) => {
    setSelectedVideo(videoData);
    setShowVideoModal(true);
  };

  // Close video modal
  const closeVideoModal = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  // Get unique categories for filter dropdown
  const uniqueCategories = [...new Set(video.map(v => v.category))].filter(Boolean);

  // Filter videos based on search and filters
  const filteredVideos = video.filter(vid => {
    const matchesSearch = !searchTerm || 
      vid.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vid.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vid.videoId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !categoryFilter || vid.category === categoryFilter;
    const matchesStatus = !statusFilter || 
      (statusFilter === 'published' && vid.isPublished) ||
      (statusFilter === 'unlisted' && !vid.isPublished);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setStatusFilter("");
  };

  // Video report generation functions
  const handleFilterChange = (field, value) => {
    setReportFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      
      // Clear validation errors when user changes the field
      setDateValidationErrors(prevErrors => ({
        ...prevErrors,
        [field]: null
      }));
      
      // Auto-set end date when start date is selected
      if (field === 'startDate' && value) {
        const startDate = new Date(value);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7); // Default to 7 days later
        
        // Format the end date for input
        const formattedEndDate = endDate.toISOString().split('T')[0];
        newFilters.endDate = formattedEndDate;
        
        // Clear end date validation error when start date changes
        setDateValidationErrors(prevErrors => ({
          ...prevErrors,
          endDate: null
        }));
      }
      
      return newFilters;
    });
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get maximum date for start date (today)
  const getMaxStartDate = () => {
    return getTodayDate();
  };

  // Get maximum date for end date (today)
  const getMaxEndDate = () => {
    return getTodayDate();
  };

  // Validate date range
  const validateDateRange = () => {
    const errors = {};
    let isValid = true;
    
    if (reportFilters.startDate && reportFilters.endDate) {
      const startDate = new Date(reportFilters.startDate);
      const endDate = new Date(reportFilters.endDate);
      const today = new Date();
      
      // Check if start date is not in the future
      if (startDate > today) {
        errors.startDate = 'Start date cannot be in the future';
        isValid = false;
      }
      
      // Check if end date is not in the future
      if (endDate > today) {
        errors.endDate = 'End date cannot be in the future';
        isValid = false;
      }
      
      // Check if end date is not before start date
      if (endDate < startDate) {
        errors.endDate = 'End date cannot be before start date';
        isValid = false;
      }
      
      // Check if date range is not too long (max 1 year)
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 365) {
        errors.endDate = 'Date range cannot exceed 1 year';
        isValid = false;
      }
    }
    
    setDateValidationErrors(errors);
    return isValid;
  };

  // Generate video report
  const generateVideoReport = async () => {
    if (reportFilters.reportType === 'custom' && (!reportFilters.startDate || !reportFilters.endDate)) {
      toast.error('Please select start and end dates for custom report');
      return;
    }

    // Validate date range for custom reports
    if (reportFilters.reportType === 'custom' && !validateDateRange()) {
      return;
    }

    setGeneratingReport(true);
    try {
      // Calculate date range based on report type
      let startDate, endDate, periodLabel;
      const now = new Date();
      
      if (reportFilters.reportType === 'weekly') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart;
        endDate = new Date(weekStart);
        endDate.setDate(weekStart.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        periodLabel = 'Last 7 days';
      } else if (reportFilters.reportType === 'monthly') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = monthStart;
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        periodLabel = 'Last 30 days';
      } else {
        startDate = new Date(reportFilters.startDate);
        endDate = new Date(reportFilters.endDate);
        periodLabel = 'Custom range';
      }

      // Filter videos by date range and other filters
      let filteredVideos = video.filter(vid => {
        // Date filter
        if (vid.createdAt) {
          const videoDate = new Date(vid.createdAt);
          if (videoDate < startDate || videoDate > endDate) return false;
        }
        
        // Category filter
        if (reportFilters.category !== 'all' && vid.category !== reportFilters.category) {
          return false;
        }
        
        // Status filter
        if (reportFilters.status !== 'all') {
          if (reportFilters.status === 'published' && !vid.isPublished) return false;
          if (reportFilters.status === 'unlisted' && vid.isPublished) return false;
        }
        
        return true;
      });

      // Calculate statistics
      const totalVideos = filteredVideos.length;
      const totalViews = filteredVideos.reduce((sum, vid) => sum + (vid.viewCount || 0), 0);
      const totalLikes = filteredVideos.reduce((sum, vid) => sum + (vid.likeCount || 0), 0);
      const publishedVideos = filteredVideos.filter(vid => vid.isPublished).length;
      const unlistedVideos = filteredVideos.filter(vid => !vid.isPublished).length;

      // Category breakdown
      const categoryStats = {};
      filteredVideos.forEach(vid => {
        const category = vid.category || 'Uncategorized';
        if (!categoryStats[category]) {
          categoryStats[category] = {
            count: 0,
            totalViews: 0,
            totalLikes: 0,
            published: 0,
            unlisted: 0
          };
        }
        categoryStats[category].count++;
        categoryStats[category].totalViews += vid.viewCount || 0;
        categoryStats[category].totalLikes += vid.likeCount || 0;
        if (vid.isPublished) {
          categoryStats[category].published++;
        } else {
          categoryStats[category].unlisted++;
        }
      });

      // Generate report ID
      const reportId = `VR-${Date.now()}`;
      const generatedAt = new Date();

      const reportData = {
        reportId,
        generatedAt,
        reportType: reportFilters.reportType,
        filters: {
          startDate: reportFilters.reportType === 'custom' ? reportFilters.startDate : null,
          endDate: reportFilters.reportType === 'custom' ? reportFilters.endDate : null,
          category: reportFilters.category,
          status: reportFilters.status,
          dateRange: periodLabel
        },
        summary: {
          totalVideos,
          totalViews,
          totalLikes,
          publishedVideos,
          unlistedVideos,
          categoryStats
        },
        videos: filteredVideos.map(video => ({
          videoId: video.videoId,
          title: video.title,
          category: video.category,
          duration: video.duration,
          viewCount: video.viewCount || 0,
          likeCount: video.likeCount || 0,
          isPublished: video.isPublished,
          createdAt: video.createdAt
        }))
      };

      setReportData(reportData);
      toast.success('Video report generated successfully');
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error('Error generating report: ' + (error?.response?.data?.message || error.message));
    } finally {
      setGeneratingReport(false);
    }
  };

  const resetReportFilters = () => {
    setReportFilters({
      startDate: '',
      endDate: '',
      category: 'all',
      status: 'all',
      reportType: 'custom'
    });
    setReportData(null);
    setDateValidationErrors({});
  };

  // Professional PDF Download Handler
  const handleDownloadPDF = async () => {
    if (!reportData) {
      toast.error('Please generate a report first');
      return;
    }

    const doc = new jsPDF();
    
    // Minimal Header - Clean white background
    doc.setFillColor(255, 255, 255); // White background
    doc.rect(0, 0, 210, 25, 'F');
    
    // Add logo image
    try {
      // Convert image to base64 for PDF
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Add logo to PDF
        doc.addImage(imgData, 'JPEG', 10, 5, 15, 15);
        
        // Company name - minimal styling
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Gettz Fitness', 30, 12);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('48 Udyana Mawatha, Matara', 30, 17);
        
        // Minimal separator line
        doc.setDrawColor(200, 200, 200); // Light gray line
        doc.setLineWidth(0.5);
        doc.line(10, 22, 200, 22);
        
        // Report title - minimal
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Video Report', 105, 35, { align: 'center' });
        
        // Continue with rest of the PDF generation...
        generateVideoPDFContent(doc);
      };
      img.src = GymLogo;
    } catch (error) {
      console.error('Error loading logo:', error);
      // Fallback without logo
      generateVideoPDFContent(doc);
    }
  };

  // Separate function for PDF content generation
  const generateVideoPDFContent = (doc) => {
    // Report details box - minimal styling
    const boxY = 45;
    const boxHeight = 25;
    
    // Draw minimal box border
    doc.setDrawColor(220, 220, 220); // Light gray border
    doc.setLineWidth(0.3);
    doc.roundedRect(10, boxY, 190, boxHeight, 2, 2);
    
    // Vertical line
    doc.line(105, boxY, 105, boxY + boxHeight);
    
    // Left side - Report Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('REPORT DETAILS', 15, boxY + 8);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`REPORT ID: ${reportData.reportId}`, 15, boxY + 14);
    doc.text(`GENERATED: ${new Date(reportData.generatedAt).toLocaleString()}`, 15, boxY + 20);
    
    // Right side - Summary
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('SUMMARY', 110, boxY + 8);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`TOTAL VIDEOS: ${reportData.summary.totalVideos}`, 110, boxY + 14);
    doc.text(`TOTAL VIEWS: ${reportData.summary.totalViews}`, 110, boxY + 18);
    doc.text(`PUBLISHED: ${reportData.summary.publishedVideos}`, 110, boxY + 22);
    
    // Filters section
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('FILTERS APPLIED', 15, boxY + 35);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`DATE RANGE: ${reportData.filters.dateRange}`, 15, boxY + 41);
    if (reportData.filters.startDate && reportData.filters.endDate) {
      doc.text(`FROM: ${new Date(reportData.filters.startDate).toLocaleDateString()}`, 15, boxY + 45);
      doc.text(`TO: ${new Date(reportData.filters.endDate).toLocaleDateString()}`, 15, boxY + 49);
    }
    doc.text(`CATEGORY: ${reportData.filters.category === 'all' ? 'All Categories' : reportData.filters.category}`, 15, boxY + 53);
    doc.text(`STATUS: ${reportData.filters.status === 'all' ? 'All Statuses' : reportData.filters.status}`, 15, boxY + 57);
    
    // Category breakdown
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('CATEGORY BREAKDOWN', 110, boxY + 35);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    let yOffset = 41;
    Object.entries(reportData.summary.categoryStats).forEach(([category, stats]) => {
      doc.text(`${category}: ${stats.count} videos`, 110, boxY + yOffset);
      yOffset += 4;
    });
    
    // Table - minimal styling
    const tableStartY = boxY + 70;
    
    autoTable(doc, {
      startY: tableStartY,
      head: [['No', 'Video ID', 'Title', 'Category', 'Views', 'Likes', 'Status']],
      body: reportData.videos.map((video, index) => [
        index + 1,
        video.videoId,
        video.title,
        video.category,
        video.viewCount,
        video.likeCount,
        video.isPublished ? 'Published' : 'Unlisted'
      ]),
      theme: 'grid',
      headStyles: { 
        fillColor: [240, 240, 240], // Light gray header
        textColor: [0, 0, 0], // Black text
        fontSize: 9
      },
      bodyStyles: { fontSize: 8 },
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 }
    });
    
    // Minimal footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Minimal footer line
      doc.setDrawColor(200, 200, 200);
      doc.line(10, 285, 200, 285);
      
      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('Generated by Gettz Fitness Management System', 15, 290);
      doc.text(`Page ${i} of ${pageCount}`, 180, 290, { align: 'right' });
    }
    
    doc.save(`gettz_fitness_video_report_${reportData.reportId}.pdf`);
    toast.success('Professional PDF report downloaded successfully');
  };

  // Generate video analytics report (legacy function)
  const generateVideoAnalyticsReport = () => {
    const now = new Date();
    const reportDate = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const reportTime = now.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Calculate date range based on report type
    let startDate, endDate, periodLabel;
    if (reportType === "weekly") {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      startDate = weekStart;
      endDate = new Date(weekStart);
      endDate.setDate(weekStart.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      periodLabel = "Weekly Report";
    } else {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = monthStart;
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      periodLabel = "Monthly Report";
    }

    // Filter videos by date range (assuming videos have createdAt field)
    const periodVideos = video.filter(vid => {
      if (!vid.createdAt) return true; // Include videos without date
      const videoDate = new Date(vid.createdAt);
      return videoDate >= startDate && videoDate <= endDate;
    });

    // Calculate category statistics
    const categoryStats = {};
    periodVideos.forEach(vid => {
      const category = vid.category || 'Uncategorized';
      if (!categoryStats[category]) {
        categoryStats[category] = {
          count: 0,
          totalViews: 0,
          totalLikes: 0,
          published: 0,
          unlisted: 0
        };
      }
      categoryStats[category].count++;
      categoryStats[category].totalViews += vid.viewCount || 0;
      categoryStats[category].totalLikes += vid.likeCount || 0;
      if (vid.isPublished) {
        categoryStats[category].published++;
      } else {
        categoryStats[category].unlisted++;
      }
    });

    // Calculate overall statistics
    const totalVideos = periodVideos.length;
    const totalViews = periodVideos.reduce((sum, vid) => sum + (vid.viewCount || 0), 0);
    const totalLikes = periodVideos.reduce((sum, vid) => sum + (vid.likeCount || 0), 0);
    const publishedVideos = periodVideos.filter(vid => vid.isPublished).length;
    const unlistedVideos = periodVideos.filter(vid => !vid.isPublished).length;

    return {
      reportDate,
      reportTime,
      periodLabel,
      startDate: startDate.toLocaleDateString(),
      endDate: endDate.toLocaleDateString(),
      totalVideos,
      totalViews,
      totalLikes,
      publishedVideos,
      unlistedVideos,
      categoryStats,
      periodVideos
    };
  };



  return (
    <div className="relative w-full h-full rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Video Management</h2>
          <p className="text-gray-600 mt-1">Manage and view all your fitness videos</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin/video/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-[#e30613] px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            <Play className="h-4 w-4" />
            Add Video
          </Link>
        </div>
      </div>

      {/* Search and Filter Panel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search videos by title, description, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Toggle Button */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters || categoryFilter || statusFilter
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {(categoryFilter || statusFilter) && (
                <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {(categoryFilter ? 1 : 0) + (statusFilter ? 1 : 0)}
                </span>
              )}
            </button>

            {(searchTerm || categoryFilter || statusFilter) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {uniqueCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="published">Published</option>
                  <option value="unlisted">Unlisted</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {filteredVideos.length} of {video.length} videos
            {(searchTerm || categoryFilter || statusFilter) && (
              <span className="ml-2">
                (filtered)
              </span>
            )}
          </div>
          {(searchTerm || categoryFilter || statusFilter) && (
            <div className="flex items-center gap-2">
              <span>Active filters:</span>
              {searchTerm && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  Search: "{searchTerm}"
                </span>
              )}
              {categoryFilter && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                  Category: {categoryFilter}
                </span>
              )}
              {statusFilter && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  Status: {statusFilter}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Professional Video Report Generation Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Professional Video Report</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportFilters.reportType}
              onChange={(e) => handleFilterChange('reportType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="custom">Custom Date Range</option>
              <option value="weekly">Weekly Report</option>
              <option value="monthly">Monthly Report</option>
            </select>
          </div>

          {/* Start Date */}
          {reportFilters.reportType === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={reportFilters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                max={getMaxStartDate()}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  dateValidationErrors.startDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                title="Select a date from the past up to today"
              />
              {dateValidationErrors.startDate ? (
                <p className="text-xs text-red-500 mt-1">{dateValidationErrors.startDate}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Cannot select future dates</p>
              )}
            </div>
          )}

          {/* End Date */}
          {reportFilters.reportType === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={reportFilters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                min={reportFilters.startDate || getTodayDate()}
                max={getMaxEndDate()}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  dateValidationErrors.endDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                title="Select a date from start date up to today"
              />
              {dateValidationErrors.endDate ? (
                <p className="text-xs text-red-500 mt-1">{dateValidationErrors.endDate}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  {reportFilters.startDate ? `Must be after ${new Date(reportFilters.startDate).toLocaleDateString()}` : 'Cannot select future dates'}
                </p>
              )}
            </div>
          )}

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={reportFilters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video Status</label>
            <select
              value={reportFilters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="unlisted">Unlisted</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={generateVideoReport}
            disabled={generatingReport}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generatingReport ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Generate Report
              </>
            )}
          </button>

          <button
            onClick={resetReportFilters}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Reset Filters
          </button>

          {reportData && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
          )}
        </div>

        {/* Report Summary */}
        {reportData && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Report Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{reportData.summary.totalVideos}</div>
                <div className="text-sm text-gray-600">Total Videos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{reportData.summary.totalViews}</div>
                <div className="text-sm text-gray-600">Total Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{reportData.summary.totalLikes}</div>
                <div className="text-sm text-gray-600">Total Likes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{reportData.summary.publishedVideos}</div>
                <div className="text-sm text-gray-600">Published</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {loaded ? (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {filteredVideos.length === video.length ? `All Videos (${video.length})` : `Filtered Videos (${filteredVideos.length})`}
              </h3>
              <div className="text-sm text-gray-600">
                {filteredVideos.length === video.length ? (
                  `Total: ${video.length} videos`
                ) : (
                  `Showing ${filteredVideos.length} of ${video.length} videos`
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-4 text-left">No</th>
                  <th className="px-6 py-4 text-left">Video ID</th>
                  <th className="px-6 py-4 text-left">Title</th>
                  <th className="px-6 py-4 text-left">Duration</th>
                  <th className="px-6 py-4 text-left">Description</th>
                  <th className="px-6 py-4 text-left">Views</th>
                  <th className="px-6 py-4 text-left">Category</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVideos.length === 0 && (
                  <tr>
                    <td className="px-6 py-8 text-center text-gray-500" colSpan={9}>
                      <div className="flex flex-col items-center">
                        <Search className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-lg font-medium">
                          {video.length === 0 ? "No videos found" : "No videos match your search"}
                        </p>
                        <p className="text-sm text-gray-400">
                          {video.length === 0 
                            ? "Start by adding your first video" 
                            : "Try adjusting your search or filters"
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {filteredVideos
                  .map((vid, index) => (
                    <tr key={vid.videoId || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-sm">{vid.videoId}</td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="font-medium text-gray-900 truncate">{vid.title}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{vid.duration} sec</td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-gray-600 truncate">{vid.description || 'No description'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{vid.viewCount || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {vid.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={vid.isPublished ? "published" : "unlisted"}
                          onChange={async (e) => {
                            const newStatus = e.target.value === "published";
                            try {
                              await axios.put(
                                `${import.meta.env.VITE_BACKEND_URL}/api/video/update/${vid.videoId}`,
                                { ...vid, isPublished: newStatus }
                              );
                              toast.success(`Video set to ${newStatus ? "Published" : "Unlisted"}`);
                              setLoaded(false);
                            } catch (err) {
                              toast.error("Failed to update status");
                            }
                          }}
                          className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="published">Published</option>
                          <option value="unlisted">Unlisted</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewVideo(vid)}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>

                          <button
                            onClick={() =>
                              navigate(
                                `/admin/video/edit/${encodeURIComponent(vid.videoId)}`,
                                { state: vid }
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-md bg-gray-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            onClick={() => confirmDelete(vid.videoId)}
                            className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <Loader />
      )}

      {/* Video Details Modal */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Video Details</h2>
                <p className="text-sm text-gray-600">ID: {selectedVideo.videoId}</p>
              </div>
              <button
                onClick={closeVideoModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Video Preview */}
              {selectedVideo.videoUrl && (
                <div className="bg-gray-100 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Video Preview</h3>
                  <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                    {selectedVideo.videoUrl.includes('youtube.com') || selectedVideo.videoUrl.includes('youtu.be') ? (
                      <iframe
                        src={selectedVideo.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                        title={selectedVideo.title}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        controls
                        className="w-full h-full object-cover"
                        src={selectedVideo.videoUrl}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <p className="text-gray-900 font-medium">{selectedVideo.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {selectedVideo.category}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedVideo.isPublished 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedVideo.isPublished ? 'Published' : 'Unlisted'}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <p className="text-gray-900">{selectedVideo.duration || 0} seconds</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Views</label>
                  <p className="text-gray-900">{selectedVideo.viewCount || 0}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-md text-sm">
                    {selectedVideo.description || 'No description available'}
                  </p>
                </div>

                {selectedVideo.videoUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                    <p className="text-gray-600 text-sm break-all bg-gray-50 p-2 rounded-md">
                      {selectedVideo.videoUrl}
                    </p>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="flex items-center justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={closeVideoModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Generation Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Video Analytics Report</h2>
                  <p className="text-sm text-gray-600">Generate detailed video performance report</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Report Type Selection */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Period</h3>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="weekly"
                      checked={reportType === "weekly"}
                      onChange={(e) => setReportType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-gray-700">Weekly Report</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="monthly"
                      checked={reportType === "monthly"}
                      onChange={(e) => setReportType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-gray-700">Monthly Report</span>
                  </label>
                </div>
              </div>

              {/* Report Preview */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Gettz Fitness</h3>
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">
                    {reportType === "weekly" ? "Weekly" : "Monthly"} Video Analytics Report
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Generated on: {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                    <p>Generated at: {new Date().toLocaleTimeString('en-US', { 
                      hour12: true, 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</p>
                  </div>
                </div>

                {/* Report Statistics */}
                {(() => {
                  const report = generateVideoReport();
                  return (
                    <div className="space-y-6">
                      {/* Period Information */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Report Period</h4>
                        <p className="text-blue-800">
                          {report.startDate} to {report.endDate}
                        </p>
                      </div>

                      {/* Overall Statistics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-gray-900">{report.totalVideos}</div>
                          <div className="text-sm text-gray-600">Total Videos</div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-900">{report.totalViews}</div>
                          <div className="text-sm text-blue-600">Total Views</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-900">{report.totalLikes}</div>
                          <div className="text-sm text-green-600">Total Likes</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-purple-900">{report.publishedVideos}</div>
                          <div className="text-sm text-purple-600">Published</div>
                        </div>
                      </div>

                      {/* Category Breakdown */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Category Breakdown</h4>
                        <div className="space-y-3">
                          {Object.entries(report.categoryStats).map(([category, stats]) => (
                            <div key={category} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-gray-900">{category}</h5>
                                <span className="text-sm text-gray-600">{stats.count} videos</span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Views: </span>
                                  <span className="font-medium">{stats.totalViews}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Likes: </span>
                                  <span className="font-medium">{stats.totalLikes}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Published: </span>
                                  <span className="font-medium">{stats.published}/{stats.count}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    const report = generateVideoReport();
                    // Generate PDF report
                    const doc = new jsPDF();
                    
                    // Header
                    const img = new window.Image();
                    img.src = GymLogo;
                    await new Promise((resolve) => { img.onload = resolve; });
                    doc.addImage(img, 'JPEG', 10, 8, 18, 18);
                    
                    doc.setFontSize(18);
                    doc.setTextColor('#e30613');
                    doc.text('Gettz Fitness', 32, 18);
                    doc.setFontSize(14);
                    doc.setTextColor('#333');
                    doc.text(`${report.periodLabel}`, 32, 28);
                    doc.setFontSize(10);
                    doc.text(`Generated: ${report.reportDate} at ${report.reportTime}`, 32, 35);
                    doc.setDrawColor('#e30613');
                    doc.line(10, 40, 200, 40);
                    
                    // Statistics
                    let y = 50;
                    doc.setFontSize(12);
                    doc.setTextColor('#333');
                    doc.text('Report Period:', 10, y);
                    doc.text(`${report.startDate} to ${report.endDate}`, 10, y + 8);
                    y += 20;
                    
                    // Overall stats
                    doc.text('Overall Statistics:', 10, y);
                    y += 8;
                    doc.text(`Total Videos: ${report.totalVideos}`, 10, y);
                    doc.text(`Total Views: ${report.totalViews}`, 60, y);
                    doc.text(`Total Likes: ${report.totalLikes}`, 110, y);
                    doc.text(`Published: ${report.publishedVideos}`, 160, y);
                    y += 15;
                    
                    // Category breakdown
                    doc.text('Category Breakdown:', 10, y);
                    y += 8;
                    
                    const categoryData = Object.entries(report.categoryStats).map(([category, stats]) => [
                      category,
                      stats.count.toString(),
                      stats.totalViews.toString(),
                      stats.totalLikes.toString(),
                      `${stats.published}/${stats.count}`
                    ]);
                    
                    autoTable(doc, {
                      startY: y,
                      head: [['Category', 'Videos', 'Views', 'Likes', 'Published']],
                      body: categoryData,
                      theme: 'grid',
                      headStyles: { fillColor: [227, 6, 19] },
                      styles: { fontSize: 9 },
                    });
                    
                    doc.save(`gettz_fitness_${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`);
                    setShowReportModal(false);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
