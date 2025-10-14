import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function RequestedMeals() {
  const navigate = useNavigate();
  
  // Data
  const [requests, setRequests] = useState([]);
  const [busy, setBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");


  // -------- FETCH ----------
  async function fetchRequests() {
    try {
      setBusy(true);
      // Guard: backend URL must be configured
      if (!import.meta.env.VITE_BACKEND_URL) {
        toast.error("Backend URL not configured. Set VITE_BACKEND_URL.");
        return;
      }
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: "Bearer " + token } : undefined;

      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/mealRequest`,
        { headers }
      );
      const items = Array.isArray(data?.response) ? data.response : [];
      setRequests(items);
    } catch (err) {
      // Prefer role-specific message on 401, else surface server message
      const status = err?.response?.status;
      if (status === 401) {
        toast.error("You need admin or trainer authorization");
      } else {
        const msg = err?.response?.data?.message || err?.message || "Failed to load requests";
        toast.error(String(msg));
      }
    } finally {
      setBusy(false);
    }
  }


  // Initial load
  useEffect(() => {
    fetchRequests();
  }, []);

  // Filter requests based on status
  const filteredRequests = requests.filter(request => {
    if (statusFilter === "all") return true;
    return request.status === statusFilter;
  });

  // -------- PDF ----------
  const handleDownloadPDF = () => {
    // Build a report PDF with brand header, two tables, and footer
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(220, 38, 38); // Red color
    doc.text("Gettz Fitness", 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Black color
    doc.text("Address: Matara", 20, 30);
    
    // Red line
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Title
    doc.setFontSize(16);
    doc.setTextColor(220, 38, 38);
    doc.text("User Meal Requests Report", 20, 45);
    
    // First Table - Basic Info
    autoTable(doc, {
      startY: 55,
      head: [
        [
          "No",
          "Request ID",
          "First Name",
          "Last Name",
          "Status",
          "Meal Type"
        ]
      ],
      body: filteredRequests.map((request, index) => [
        index + 1,
        String(request.request_id ?? "-"),
        request.user_name ?? "-",
        request.last_name ?? "-",
        request.status === 'urgent' ? 'Urgent' : 'Normal',
        request.mealType ?? "-"
      ]),
      theme: "grid",
      headStyles: { 
        fillColor: [220, 38, 38], // Red background
        textColor: [255, 255, 255], // White text
        fontSize: 10,
        halign: 'left'
      },
      styles: { 
        fontSize: 8,
        cellPadding: 3,
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'left' }, // No
        1: { cellWidth: 25, halign: 'left' }, // Request ID
        2: { cellWidth: 35, halign: 'left' }, // First Name
        3: { cellWidth: 35, halign: 'left' }, // Last Name
        4: { cellWidth: 30, halign: 'left' }, // Status
        5: { cellWidth: 30, halign: 'left' }  // Meal Type
      },
      margin: { top: 55, left: 20, right: 20 },
      tableWidth: 'auto',
      showHead: 'everyPage'
    });

    // Second Table - Additional Details
    autoTable(doc, {
      // Start after first table ends; if undefined, fall back to a default
      startY: (doc.lastAutoTable?.finalY || 55) + 20,
      head: [
        [
          "No",
          "Request ID",
          "Description",
          "Weight",
          "Height"
        ]
      ],
      body: filteredRequests.map((request, index) => [
        index + 1,
        String(request.request_id ?? "-"),
        request.description ?? "-",
        request.weight ?? "-",
        request.height ?? "-"
      ]),
      theme: "grid",
      headStyles: { 
        fillColor: [220, 38, 38], // Red background
        textColor: [255, 255, 255], // White text
        fontSize: 10,
        halign: 'left'
      },
      styles: { 
        fontSize: 8,
        cellPadding: 3,
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'left' }, // No
        1: { cellWidth: 25, halign: 'left' }, // Request ID
        2: { cellWidth: 80, halign: 'left' }, // Description
        3: { cellWidth: 25, halign: 'left' }, // Weight
        4: { cellWidth: 25, halign: 'left' }  // Height
      },
      margin: { top: 20, left: 20, right: 20 },
      tableWidth: 'auto',
      showHead: 'everyPage'
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${pageCount}`, 20, doc.internal.pageSize.height - 10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, doc.internal.pageSize.height - 5);
    }

    doc.save("user_meal_requests_report.pdf");
  };

  // ---- Assign helper ----
  function openAssign(row) {
    // Store selected request data in localStorage for the assign page.
    localStorage.setItem('assignRequestData', JSON.stringify({
      request_id: row.request_id ?? "",
      user_name: row.user_name ?? "",
      last_name: row.last_name ?? "",
      status: row.status ?? "normal",
      description: row.description ?? "",
      mealType: row.mealType ?? "Non-Vegan",
      weight: row.weight ?? "",
      height: row.height ?? "",
      user_id: row.user_id ?? "",
    }));
    
    // Navigate to the plan assignment page
    navigate('/trainerDashboard/assign-meal-plan');
  }

  return (
    <div className="p-6">
      <div className="mx-auto w-full max-w-screen-2xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold text-black">User Requests</h1>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>

  {/* Filter Section: quick chips to filter by urgency */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
              }`}
            >
              All Requests
            </button>
            <button
              onClick={() => setStatusFilter("urgent")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === "urgent"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
              }`}
            >
              Urgent Only
            </button>
            <button
              onClick={() => setStatusFilter("normal")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === "normal"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
              }`}
            >
              Normal Only
            </button>
          </div>
        </div>

  {/* Table: requests list with loading/empty states and Assign action */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-x-auto">
          <table className="min-w-full table-fixed text-sm text-left text-gray-700">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 w-28">Request ID</th>
                <th className="px-4 py-3 w-40">First Name</th>
                <th className="px-4 py-3 w-40">Last Name</th>
                <th className="px-4 py-3 w-36">Status</th>
                <th className="px-4 py-3 w-[360px]">Description</th>
                <th className="px-4 py-3 w-32">Meal Type</th>
                <th className="px-4 py-3 w-24">Weight</th>
                <th className="px-4 py-3 w-24">Height</th>
                <th className="px-4 py-3 w-40 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {busy && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-3 text-center text-neutral-500"
                  >
                    Loading…
                  </td>
                </tr>
              )}

              {!busy && filteredRequests.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-3 text-center text-neutral-500"
                  >
                    {requests.length === 0 ? "No requests found" : `No ${statusFilter === "all" ? "" : statusFilter} requests found`}
                  </td>
                </tr>
              )}

              {!busy &&
                filteredRequests.map((r) => {
                  const key = r._id ?? r.request_id;

                  return (
                    <tr key={key} className="align-top">
                      <td className="px-4 py-3 font-mono">
                        {String(r.request_id ?? "-")}
                      </td>
                      <td className="px-4 py-3">{r.user_name ?? "-"}</td>
                      <td className="px-4 py-3">{r.last_name ?? "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          r.status === 'urgent' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {r.status === 'urgent' ? 'Urgent' : 'Normal'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-pre-line break-words">
                        {r.description ?? "-"}
                      </td>
                      <td className="px-4 py-3">{r.mealType ?? "-"}</td>
                      <td className="px-4 py-3">{r.weight ?? "-"}</td>
                      <td className="px-4 py-3">{r.height ?? "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => openAssign(r)}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
                          >
                            Assign
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
