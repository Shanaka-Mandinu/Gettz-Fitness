import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


import axios from "axios";
import Loader from "../../../components/lorder-animate";
import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Link } from "react-router-dom";

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

  // PDF Download Handler
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor('#e30613');
    doc.text('Gettz Fitness - Inquiries', 14, 18);
    doc.setFontSize(11);
    doc.setTextColor('#333');
    doc.text('All Inquiries Report', 14, 26);
    doc.setDrawColor('#e30613');
    doc.line(10, 30, 200, 30);

    autoTable(doc, {
      startY: 35,
      head: [[
        'No', 'Inquiry ID', 'Type', 'Message', 'Date', 'Email', 'Status', 'Response'
      ]],
      body: filtered.map((inq, idx) => [
        idx + 1,
        inq.inquiry_id,
        inq.inquiry_type,
        inq.inquiry_message,
        fmtDate(inq.inquiry_date),
        inq.email,
        inq.inquiry_status,
        inq.inquiry_response || ''
      ]),
      theme: 'grid',
      headStyles: { fillColor: [227, 6, 19] },
      styles: { fontSize: 9 },
    });

    doc.save('gettz_fitness_inquiries.pdf');
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
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:opacity-95 transition"
          >
            Download PDF
          </button>
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
