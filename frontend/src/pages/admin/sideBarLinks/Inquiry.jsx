import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


import axios from "axios";
import Loader from "../../../components/lorder-animate";
import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Link } from "react-router-dom";
import GymLogo from "../../../assets/GymLogo.jpg";

const TABS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
  { key: "recent", label: "Recently Added" },
];

function fmtDate(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "-";
  }
}

export default function InquiryPage() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // Report generation state
  const [reportFilters, setReportFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
    reportType: 'custom'
  });
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dateValidationErrors, setDateValidationErrors] = useState({});

  // PDF Download Handler - Enhanced Professional Version
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
        doc.text('Inquiry Report', 105, 35, { align: 'center' });
        
        // Continue with rest of the PDF generation...
        generatePDFContent(doc);
      };
      img.src = GymLogo;
    } catch (error) {
      console.error('Error loading logo:', error);
      // Fallback without logo
      generatePDFContent(doc);
    }
  };

  // Separate function for PDF content generation
  const generatePDFContent = (doc) => {
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
    doc.text(`TOTAL INQUIRIES: ${reportData.summary.totalInquiries}`, 110, boxY + 14);
    doc.text(`RESOLVED: ${reportData.summary.resolvedInquiries}`, 110, boxY + 18);
    doc.text(`RESOLUTION RATE: ${reportData.summary.resolutionRate}%`, 110, boxY + 22);
    
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
    doc.text(`STATUS: ${reportData.filters.status === 'all' ? 'All Statuses' : reportData.filters.status}`, 15, boxY + 53);
    
    // Status breakdown
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('STATUS BREAKDOWN', 110, boxY + 35);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`OPEN: ${reportData.summary.statusCounts.Open}`, 110, boxY + 41);
    doc.text(`IN PROGRESS: ${reportData.summary.statusCounts['In Progress']}`, 110, boxY + 45);
    doc.text(`RESOLVED: ${reportData.summary.statusCounts.Resolved}`, 110, boxY + 49);
    doc.text(`CLOSED: ${reportData.summary.statusCounts.Closed}`, 110, boxY + 53);
    
    // Type breakdown
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('TYPE BREAKDOWN', 15, boxY + 60);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`GENERAL: ${reportData.summary.typeCounts.General}`, 15, boxY + 66);
    doc.text(`TECHNICAL: ${reportData.summary.typeCounts.Technical}`, 15, boxY + 70);
    doc.text(`BILLING: ${reportData.summary.typeCounts.Billing}`, 15, boxY + 74);
    doc.text(`FEEDBACK: ${reportData.summary.typeCounts.Feedback}`, 15, boxY + 78);
    doc.text(`OTHER: ${reportData.summary.typeCounts.Other}`, 15, boxY + 82);
    
    // Average response time
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('PERFORMANCE METRICS', 110, boxY + 60);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`AVG RESPONSE TIME: ${reportData.summary.avgResponseTime}`, 110, boxY + 66);
    
    // Table - minimal styling
    const tableStartY = boxY + 90;
    
    autoTable(doc, {
      startY: tableStartY,
      head: [['No', 'Inquiry ID', 'Type', 'Status', 'Email', 'Date', 'Responses']],
      body: reportData.inquiries.map((inquiry, index) => [
        index + 1,
        inquiry.inquiry_id,
        inquiry.inquiry_type,
        inquiry.inquiry_status,
        inquiry.email,
        new Date(inquiry.inquiry_date).toLocaleDateString(),
        inquiry.response_count
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
    
    doc.save(`gettz_fitness_inquiry_report_${reportData.reportId}.pdf`);
    toast.success('Professional PDF report downloaded successfully');
  };

  // Generate professional report
  const generateReport = async () => {
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
      const token = localStorage.getItem("token") || localStorage.getItem("jwt");
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/inquiry/report`,
        {
          startDate: reportFilters.startDate,
          endDate: reportFilters.endDate,
          status: reportFilters.status,
          reportType: reportFilters.reportType,
          format: 'json'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setReportData(response.data.data);
        toast.success('Professional report generated successfully');
      } else {
        toast.error('Failed to generate report');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error('Error generating report: ' + (error?.response?.data?.message || error.message));
    } finally {
      setGeneratingReport(false);
    }
  };

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

  // Get minimum date (today)
  const getMinDate = () => {
    return getTodayDate();
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

  const resetReportFilters = () => {
    setReportFilters({
      startDate: '',
      endDate: '',
      status: 'all',
      reportType: 'custom'
    });
    setReportData(null);
    setDateValidationErrors({});
  };
  const [inquiries, setInquiries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  // View modal state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewRow, setViewRow] = useState(null); // full inquiry
  const [replyText, setReplyText] = useState("");

  // Function to fetch inquiries
  const fetchInquiries = async (showLoading = true) => {
    if (showLoading) {
      setLoaded(false);
    }
    
    try {
      console.log("Fetching inquiries from:", `${import.meta.env.VITE_BACKEND_URL}/api/inquiry/viewAll`);
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/inquiry/viewAll`);
      console.log("Inquiry API response:", res);
      const data = Array.isArray(res.data) ? res.data : [];
      
      // Check for new inquiries during auto-refresh
      if (!showLoading && inquiries.length > 0) {
        const newInquiries = data.filter(newInq => 
          !inquiries.some(existingInq => existingInq.inquiry_id === newInq.inquiry_id)
        );
        if (newInquiries.length > 0) {
          toast.success(`${newInquiries.length} new inquiry${newInquiries.length > 1 ? 'ies' : ''} received!`);
        }
      }
      
      setInquiries(data);
      setLastRefresh(new Date());
      if (showLoading) {
        setLoaded(true);
      }
    } catch (err) {
      console.error("Inquiry API error:", err);
      toast.error("Failed to load inquiries: " + (err?.message || "Unknown error"));
      if (showLoading) {
        setLoaded(true);
      }
    }
  };

  useEffect(() => {
    fetchInquiries();

    // Auto-refresh every 5 seconds
    const refreshInterval = setInterval(() => {
      setIsAutoRefreshing(true);
      fetchInquiries(false).finally(() => {
        setIsAutoRefreshing(false);
      });
    }, 5000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const totalCount = inquiries.length;
  const resolvedCount = useMemo(
    () => inquiries.filter((q) => q.inquiry_status === "Resolved").length,
    [inquiries]
  );
  const openCount = useMemo(
    () => inquiries.filter((q) => q.inquiry_status === "Open").length,
    [inquiries]
  );
  const progressCount = useMemo(
    () => inquiries.filter((q) => q.inquiry_status === "In Progress").length,
    [inquiries]
  );
  const closedCount = useMemo(
    () => inquiries.filter((q) => q.inquiry_status === "Closed").length,
    [inquiries]
  );

  const filtered = useMemo(() => {
    let rows = [...inquiries];

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        [
          String(r.inquiry_id ?? ""),
          r.email ?? "",
          r.inquiry_type ?? "",
          r.inquiry_message ?? "",
          r.inquiry_status ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    switch (activeTab) {
      case "open":
        rows = rows.filter((r) => r.inquiry_status === "Open");
        break;
      case "progress":
        rows = rows.filter((r) => r.inquiry_status === "In Progress");
        break;
      case "resolved":
        rows = rows.filter((r) => r.inquiry_status === "Resolved");
        break;
      case "closed":
        rows = rows.filter((r) => r.inquiry_status === "Closed");
        break;
      case "recent":
        rows = rows
          .sort(
            (a, b) =>
              new Date(b.inquiry_date || 0) - new Date(a.inquiry_date || 0)
          )
          .slice(0, 10);
        break;
      default:
        break;
    }

    return rows.sort(
      (a, b) => new Date(b.inquiry_date || 0) - new Date(a.inquiry_date || 0)
    );
  }, [inquiries, activeTab, search]);

  async function updateStatus(row, next) {
    const token = localStorage.getItem("token") || localStorage.getItem("jwt");
    if (!token) {
      toast.error("You must be logged in to update inquiries");
      return;
    }
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/inquiry/update/${row.inquiry_id}`,
        { ...row, inquiry_status: next },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Inquiry updated");
      fetchInquiries(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update inquiry");
    }
  }


  async function deleteInquiry(inquiry_id) {
    const token = localStorage.getItem("token") || localStorage.getItem("jwt");
    if (!token) {
      toast.error("You must be logged in to delete an inquiry");
      return;
    }
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/inquiry/delete/${inquiry_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Inquiry deleted");
      fetchInquiries(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete inquiry");
    }
  }

  // ===== View Modal Logic =====
  async function openView(inquiry_id) {
    const token = localStorage.getItem("token") || localStorage.getItem("jwt");
    if (!token) {
      toast.error("You must be logged in to view an inquiry");
      return;
    }
    setViewOpen(true);
    setViewLoading(true);
    setReplyText("");

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/inquiry/${inquiry_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // API returns { inquiry: {...} }
      const full = res?.data?.inquiry || null;
      setViewRow(full);
      setReplyText("");
    } catch (e) {
      console.error(e);
      toast.error("Failed to load inquiry");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  }

  async function saveReplyOnly() {
    if (!viewRow) return;
    const token = localStorage.getItem("token") || localStorage.getItem("jwt");
    if (!token) {
      toast.error("You must be logged in to save a reply");
      return;
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/inquiry/reply/${viewRow.inquiry_id}`,
        { message: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Reply saved");
      fetchInquiries(false); // refresh list
    } catch (e) {
      console.error(e);
      toast.error("Failed to save reply");
    }
  }

  async function resolveWithReply() {
    if (!viewRow) return;
    const token = localStorage.getItem("token") || localStorage.getItem("jwt");
    if (!token) {
      toast.error("You must be logged in to resolve");
      return;
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/inquiry/reply/${viewRow.inquiry_id}`,
        { message: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/inquiry/update/${viewRow.inquiry_id}`,
        { inquiry_status: "Resolved" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Inquiry resolved");
      fetchInquiries(false);
      setViewOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to resolve inquiry");
    }
  }

  return (
    <div className="relative w-full h-full rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Inquiries</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${isAutoRefreshing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
            <p className="text-xs text-neutral-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
            placeholder="Search by ID, email, text..."
          />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <KPI label="All Inquiries" value={totalCount} />
        <KPI label="Open" value={openCount} />
        <KPI label="In Progress" value={progressCount} />
        <KPI label="Resolved (Solved)" value={resolvedCount} />
        <KPI label="Closed" value={closedCount} />
      </div>

      {/* Professional Report Generation Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Professional Report</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                min={reportFilters.startDate || getMinDate()}
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

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Inquiry Status</label>
            <select
              value={reportFilters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={generateReport}
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
                <div className="text-2xl font-bold text-blue-600">{reportData.summary.totalInquiries}</div>
                <div className="text-sm text-gray-600">Total Inquiries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{reportData.summary.resolvedInquiries}</div>
                <div className="text-sm text-gray-600">Resolved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{reportData.summary.resolutionRate}%</div>
                <div className="text-sm text-gray-600">Resolution Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{reportData.summary.avgResponseTime}</div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-3 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              activeTab === t.key
                ? "bg-black text-white border-black"
                : "bg-white text-black border-black/10 hover:bg-black/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loaded ? (
        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-3 py-2 text-left">No</th>
                <th className="px-3 py-2 text-left">Inquiry ID</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Message</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Response</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-6 text-center text-neutral-500"
                    colSpan={9}
                  >
                    No inquiries found.
                  </td>
                </tr>
              )}

              {filtered.map((q, i) => (
                <tr key={q.inquiry_id ?? i} className="border-t border-black/10">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{q.inquiry_id}</td>
                  <td className="px-3 py-2">{q.inquiry_type}</td>
                  <td className="px-3 py-2 max-w-xl">
                    <span className="line-clamp-2">{q.inquiry_message}</span>
                  </td>
                  <td className="px-3 py-2">{fmtDate(q.inquiry_date)}</td>
                  <td className="px-3 py-2">{q.email}</td>
                  <td className="px-3 py-2">
                    <select
                      value={q.inquiry_status}
                      onChange={(e) => updateStatus(q, e.target.value)}
                      className="rounded border px-2 py-1 text-sm"
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                      <option>Closed</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    {Array.isArray(q.inquiry_response) && q.inquiry_response.length > 0 ? (
                      <ul className="space-y-1">
                        {q.inquiry_response.map((resp, idx) => (
                          <li key={idx} className="text-xs">
                            <span className="font-medium">{resp.responder === "admin" ? "Admin" : "User"}:</span> {resp.message}
                            <span className="ml-2 text-gray-400">{resp.date ? new Date(resp.date).toLocaleString() : ""}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-neutral-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openView(q.inquiry_id)}
                        className="rounded-md bg-black px-2 py-1 text-white hover:opacity-90"
                      >
                        View
                      </button>
                  
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {activeTab === "recent" && (
            <div className="px-4 py-3 text-xs text-neutral-500">
              Showing the 10 most recently created inquiries by date.
            </div>
          )}
        </div>
      ) : (
        <Loader />
      )}

      {/* ===== View Modal ===== */}
      {viewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h3 className="text-lg font-semibold">
                Inquiry #{viewRow?.inquiry_id ?? ""}
              </h3>
              <button
                onClick={() => setViewOpen(false)}
                className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            {viewLoading ? (
              <div className="p-6">
                <Loader />
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <Info label="Type" value={viewRow?.inquiry_type} />
                  <Info label="Status" value={viewRow?.inquiry_status} />
                  <Info label="Email" value={viewRow?.email} />
                  <Info label="Date" value={fmtDate(viewRow?.inquiry_date)} />
                </div>

                <div>
                  <div className="text-xs text-neutral-500 mb-1">Message</div>
                  <div className="rounded-lg border border-black/10 p-3 bg-neutral-50">
                    <p className="whitespace-pre-wrap">
                      {viewRow?.inquiry_message || "—"}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-neutral-500 mb-1">Responses</div>
                  <div className="rounded-lg border border-black/10 p-3 bg-neutral-50">
                    {Array.isArray(viewRow?.inquiry_response) && viewRow.inquiry_response.length > 0 ? (
                      <ul className="space-y-2">
                        {viewRow.inquiry_response.map((resp, idx) => (
                          <li key={idx} className="text-sm">
                            <span className="font-medium">{resp.responder === "admin" ? "Admin" : "User"}:</span> {resp.message}
                            <span className="ml-2 text-xs text-gray-400">{resp.date ? new Date(resp.date).toLocaleString() : ""}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-neutral-400 italic">No responses yet.</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Your Reply</label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={5}
                    className="mt-1 w-full rounded-lg border border-black/10 p-3 outline-none focus:ring-2 focus:ring-black/10"
                    placeholder="Type your reply to solve this inquiry…"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={saveReplyOnly}
                    className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Save reply
                  </button>
                  <button
                    onClick={resolveWithReply}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:opacity-95"
                  >
                    Resolve & Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="font-medium">{value || "—"}</div>
    </div>
  );
}
