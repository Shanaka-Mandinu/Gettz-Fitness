import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileDown, RotateCcw, Search, Filter, List, AlertTriangle, CheckCircle, Leaf, Utensils } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { generateMealRequestsPDF } from "../../utils/mealRequestsReport";

export default function RequestedMeals() {
  const navigate = useNavigate();
  
  // Data
  const [requests, setRequests] = useState([]);
  const [busy, setBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [mealTypeFilter, setMealTypeFilter] = useState("all"); // all | vegan | non-vegan


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

  // Normalize meal type to consistent categories
  const normalizeMealType = (s) => {
    const v = (s || "").toString().toLowerCase().replace(/\s|_/g, "");
    if (v.includes("non") && v.includes("vegan")) return "non-vegan";
    if (v.includes("vegan")) return "vegan";
    return v || "";
  };

  // Filtering : search, status, meal type, date range
  const filteredRequests = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(dateFrom).setHours(0,0,0,0) : null;
    const toTime = dateTo ? new Date(dateTo).setHours(23,59,59,999) : null;
    return requests.filter((r) => {
      const matchesStatus = statusFilter === "all" || String(r.status || "").toLowerCase() === statusFilter;
      const mt = normalizeMealType(r.mealType);
      const matchesMealType = mealTypeFilter === "all" || mt === mealTypeFilter;
      const matchesQ = !qLower || [
        r.request_id,
        r.user_name,
        r.last_name,
        r.mealType,
        r.description,
      ]
        .map((v) => (v ? String(v).toLowerCase() : ""))
        .some((s) => s.includes(qLower));
      const t = r.createdAt ? new Date(r.createdAt).getTime() : null;
      const matchesFrom = !fromTime || (t && t >= fromTime);
      const matchesTo = !toTime || (t && t <= toTime);
      return matchesStatus && matchesMealType && matchesQ && matchesFrom && matchesTo;
    });
  }, [requests, statusFilter, mealTypeFilter, q, dateFrom, dateTo]);

  // Totals
  const totals = useMemo(() => {
    const count = filteredRequests.length;
    let urgent = 0, normal = 0, vegan = 0, nonVegan = 0;
    for (const r of filteredRequests) {
      if (String(r.status || "").toLowerCase() === "urgent") urgent++;
      else normal++;
      const mt = normalizeMealType(r.mealType);
      if (mt === "vegan") vegan++;
      else if (mt === "non-vegan") nonVegan++;
    }
    return { count, urgent, normal, vegan, nonVegan };
  }, [filteredRequests]);

  // Report download (PDF)
  const downloadPDF = () => {
    const filters = {
      status: statusFilter,
      mealType: mealTypeFilter,
      dateFrom,
      dateTo,
      q,
    };
    generateMealRequestsPDF(filteredRequests, totals, {
      title: "Meal Requests Report",
      filters,
    });
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
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-black">User Requests</h1>
          <p className="text-gray-600">Manage and export user meal requests</p>
        </div>

        {/* Filters + Actions (modeled after AdminPaymentPage) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
            {/* Search */}
            <div className="relative lg:max-w-sm w-full">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400"
                placeholder="Search by name, id, type..."
              />
            </div>

            {/* Status quick chips retained below */}

            {/* Date range */}
            <div className="w-full lg:w-48">
              <div className="mb-1 text-xs font-semibold text-gray-600 uppercase">From</div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="w-full lg:w-48">
              <div className="mb-1 text-xs font-semibold text-gray-600 uppercase">To</div>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => { setQ(""); setDateFrom(""); setDateTo(""); setStatusFilter("all"); setMealTypeFilter("all"); }}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm hover:bg-gray-50 transition"
                title="Reset filters"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
              <button
                onClick={downloadPDF}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2.5 text-sm text-white shadow-sm hover:shadow transition hover:bg-green-700 cursor-pointer"
                title="Download PDF report"
              >
                <FileDown className="h-4 w-4" />
                Download Report
              </button>
            </div>
          </div>

          {/* Totals bar */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="rounded-md border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4 text-gray-500" />
                <div className="text-xs text-gray-500">Filtered Count</div>
              </div>
              <div className="mt-1 text-base font-semibold text-gray-900">{totals.count}</div>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div className="text-xs text-gray-500">Urgent</div>
              </div>
              <div className="mt-1 text-base font-semibold text-gray-900">{totals.urgent}</div>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="text-xs text-gray-500">Normal</div>
              </div>
              <div className="mt-1 text-base font-semibold text-gray-900">{totals.normal}</div>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-600" />
                <div className="text-xs text-gray-500">Vegan</div>
              </div>
              <div className="mt-1 text-base font-semibold text-gray-900">{totals.vegan}</div>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-gray-600" />
                <div className="text-xs text-gray-500">Non-Vegan</div>
              </div>
              <div className="mt-1 text-base font-semibold text-gray-900">{totals.nonVegan}</div>
            </div>
          </div>
        </div>

  {/* Filter Section: one-row chips for meal type and status */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-1">Meal Type:</span>
            <button
              onClick={() => setMealTypeFilter("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                mealTypeFilter === "all"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setMealTypeFilter("vegan")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                mealTypeFilter === "vegan"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
              }`}
            >
              Vegan
            </button>
            <button
              onClick={() => setMealTypeFilter("non-vegan")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                mealTypeFilter === "non-vegan"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
              }`}
            >
              Non-Vegan
            </button>

            <span className="text-sm font-medium text-gray-700 ml-4 mr-1">Status:</span>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("urgent")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === "urgent"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
              }`}
            >
              Urgent
            </button>
            <button
              onClick={() => setStatusFilter("normal")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === "normal"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
              }`}
            >
              Normal
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
