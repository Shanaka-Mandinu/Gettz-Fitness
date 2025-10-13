import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Swal from "sweetalert2";


// Small inline user avatar icon
function IconUser() {
  return (
    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
// Small inline calendar icon used in meta strip
function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M7 3v3M17 3v3M3.5 9.5h17M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Colored pill badge; tone selects Tailwind classes
function Pill({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-200",
    green: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100",
    red: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

// A single request card displaying key fields with Update/Delete actions
function RequestCard({ row, onUpdate, onDelete }) {
  const id = row.request_id ?? "-";
  const status = row.status ?? "normal";
  
  const mealType = row.mealType ?? "-";
  const weight = row.weight ?? "-";
  const height = row.height ?? "-";
  const description = row.description || "-";

  const tone =
    String(mealType).toLowerCase() === "vegan"
      ? "green"
      : String(mealType).toLowerCase() === "non-vegan"
      ? "red"
      : "gray";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm">
      {/* Header */}
      <div className="relative flex items-start gap-4 p-6">
        {/* Enhanced Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 ring-1 ring-blue-200/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <IconUser />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {/* Title and Status */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h3 className="text-lg text-gray-900">
              Meal Request #{id}
            </h3>
            <Pill tone={tone}>{mealType}</Pill>
          </div>
          
          {/* Description */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 leading-relaxed break-words line-clamp-2">
              {description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex gap-2">
          <button
            type="button"
            onClick={() => onUpdate(row)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Update
          </button>
          <button
            type="button"
            onClick={() => onDelete(row)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Meta Strip */}
      <div className="relative border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-white px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm border border-gray-200/50">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-600">
              <IconCalendar />
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className={`text-sm font-semibold ${
                status === 'urgent' ? 'text-red-600' : 'text-green-600'
              }`}>
                {status === 'urgent' ? 'Urgent' : 'Normal'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm border border-gray-200/50">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-100 text-orange-600">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">Weight</p>
              <p className="text-sm font-semibold text-gray-800">{weight} kg</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm border border-gray-200/50">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-green-100 text-green-600">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">Height</p>
              <p className="text-sm font-semibold text-gray-800">{height} cm</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page: lists current user's meal requests with filters
export default function RequestMeals() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [busy, setBusy] = useState(false);
  const [mealTypeFilter, setMealTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [editForm, setEditForm] = useState({
    request_id: "",
    user_id: "",
    user_name: "",
    last_name: "",
    status: "normal",
    description: "",
    mealType: "Non-Vegan",
    weight: "",
    height: "",
  });

  // Load current user's requests
  async function fetchRequests() {
    const token = localStorage.getItem("token");
    try {
      setBusy(true);
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/mealRequest/getOneMeal`,
        { headers: { Authorization: "Bearer " + token } }
      );
      const items = Array.isArray(data?.response) ? data.response : [];
      setRequests(items);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load requests";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  // Initial fetch on mount
  useEffect(() => {
    fetchRequests();
  }, []);

  // Filter requests based on meal type and status
  const filteredRequests = requests.filter(request => {
    const mealTypeMatch = mealTypeFilter === "all" || request.mealType === mealTypeFilter;
    const statusMatch = statusFilter === "all" || request.status === statusFilter;
    return mealTypeMatch && statusMatch;
  });

  // Simple numeric validation helper
  const isPositive = (v) => Number.isFinite(Number(v)) && Number(v) > 0;
  const inRange = (num, min, max) => Number.isFinite(num) && num >= min && num <= max;

  // Validate edit form values (used if in-page update is used)
  const validate = (v) => {
    const e = {};
    if (!String(v.user_name || "").trim())
      e.user_name = "First name is required.";
    if (!String(v.last_name || "").trim())
      e.last_name = "Last name is required.";
    if (!v.status || (v.status !== 'urgent' && v.status !== 'normal'))
      e.status = "Status is required.";
    if (!String(v.description || "").trim())
      e.description = "Description is required.";
    if (!String(v.mealType || "").trim()) e.mealType = "Meal type is required.";
    else if (!["Vegan", "Non-Vegan"].includes(v.mealType))
      e.mealType = "Choose Vegan or Non-Vegan.";
    // Height
    if (!String(v.height).trim()) e.height = "Height is required.";
    else {
      const h = Number(v.height);
      if (!isPositive(h)) e.height = "Height must be a positive number.";
      else if (!inRange(h, 100, 250)) e.height = "Height should be between 100 and 250 cm.";
    }
    // Weight
    if (!String(v.weight).trim()) e.weight = "Weight is required.";
    else {
      const w = Number(v.weight);
      if (!isPositive(w)) e.weight = "Weight must be a positive number.";
      else if (!inRange(w, 20, 300)) e.weight = "Weight should be between 20 and 300 kg.";
    }
    return e;
  };

  // Navigate to a dedicated edit page, passing data via localStorage
  const handleOpenUpdate = (row) => {
    // Store the request data in localStorage for the edit page
    localStorage.setItem('editRequestData', JSON.stringify({
      request_id: row.request_id ?? "",
      user_id: row.user_id ?? "",
      user_name: row.user_name ?? "",
      last_name: row.last_name ?? "",
      status: row.status ?? "normal",
      description: row.description ?? "",
      mealType: row.mealType ?? "Non-Vegan",
      weight: row.weight ?? "",
      height: row.height ?? "",
    }));
    
    // Navigate to the edit page
    navigate('/userDashboard/edit-meal-request');
  };

  // Optional in-place update handler (kept for reuse); not used by this page UI
  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.request_id) {
      toast.error("Missing request ID");
      return;
    }
    const v = validate(editForm);
    if (Object.keys(v).length > 0) {
      setErrors(v);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    const payload = {
      user_id: editForm.user_id,
      user_name: editForm.user_name,
      last_name: editForm.last_name,
      status: editForm.status,
      description: editForm.description,
      mealType: editForm.mealType,
      weight: editForm.weight,
      height: editForm.height,
    };
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      await axios.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/mealRequest/${encodeURIComponent(editForm.request_id)}`,
        payload,
        { headers: { Authorization: "Bearer " + token } }
      );
      Swal.fire({
        position: "center",
        icon: "success",
        title: "Your request has been updated",
        showConfirmButton: false,
        timer: 1500,
      });
      setOpen(false);
      fetchRequests();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update request";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };


  // Delete a request after confirmation; requires auth token
  async function handleDelete(row) {
    if (!row.request_id) {
      toast.error("Missing request ID");
      return;
    }
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      await axios.delete(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/mealRequest/${encodeURIComponent(row.request_id)}`,
        { headers: { Authorization: "Bearer " + token } }
      );
      toast.success("The record has been deleted.");
      fetchRequests();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Failed to delete request";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  // Removed unused style constants to avoid linter warnings

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Manage Your Meal Requests
          </h1>
          <p className="text-sm text-gray-600">
            View and manage your meal plan requests for Gettz Fitness.
          </p>
        </div>

        {/* Filter Section */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Meal Type Filter */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 self-center">Meal Type:</span>
              <button
                onClick={() => setMealTypeFilter("all")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  mealTypeFilter === "all"
                    ? "bg-red-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setMealTypeFilter("Vegan")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  mealTypeFilter === "Vegan"
                    ? "bg-red-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
                }`}
              >
                Vegan
              </button>
              <button
                onClick={() => setMealTypeFilter("Non-Vegan")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  mealTypeFilter === "Non-Vegan"
                    ? "bg-red-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
                }`}
              >
                Non-Vegan
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 self-center">Status:</span>
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === "all"
                    ? "bg-red-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("urgent")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === "urgent"
                    ? "bg-red-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
                }`}
              >
                Urgent
              </button>
              <button
                onClick={() => setStatusFilter("normal")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === "normal"
                    ? "bg-red-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
                }`}
              >
                Normal
              </button>
            </div>
          </div>
        </div>

        {/* Cards List */}
        <div className="space-y-6">
          {busy && (
            <div className="max-w-4xl">
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <svg className="h-6 w-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading...</h3>
                  <p className="text-gray-500">Please wait while we fetch your requests.</p>
                </div>
              </div>
            </div>
          )}

          {!busy && filteredRequests.length === 0 && (
            <div className="max-w-4xl">
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {requests.length === 0 ? "No Requests Found" : "No Matching Requests"}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {requests.length === 0 
                      ? "You haven't made any meal requests yet. Create your first request to get started."
                      : "No requests match your current filter criteria. Try adjusting your filters."
                    }
                  </p>
                  {requests.length === 0 && (
                    <button 
                      onClick={() => navigate('/mealPlan')}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Request
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {!busy &&
            filteredRequests.map((r) => (
              <div key={r._id ?? r.request_id} className="max-w-4xl">
                <RequestCard
                  row={r}
                  onUpdate={handleOpenUpdate}
                  onDelete={handleDelete}
                />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
