import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

export default function EditMealRequest() {
  const navigate = useNavigate();
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

  useEffect(() => {
    // Get the request data from localStorage
    const requestData = localStorage.getItem('editRequestData');
    if (requestData) {
      const parsedData = JSON.parse(requestData);
      setEditForm(parsedData);
    } else {
      // If no data, redirect back to requests page
      navigate('/userDashboard/requestMeal');
    }
  }, [navigate]);

  const isValidDate = (str) => {
    if (!str) return false;
    const d = new Date(str);
    return !Number.isNaN(d.getTime());
  };
  const isPositive = (v) => Number.isFinite(Number(v)) && Number(v) > 0;

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
    if (!String(v.height).trim()) e.height = "Height is required.";
    else if (!isPositive(v.height))
      e.height = "Height must be a number greater than 0.";
    if (!String(v.weight).trim()) e.weight = "Weight is required.";
    else if (!isPositive(v.weight))
      e.weight = "Weight must be a number greater than 0.";
    return e;
  };

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
      await axios.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/mealRequest/${encodeURIComponent(editForm.request_id)}`,
        payload
      );
      Swal.fire({
        position: "center",
        icon: "success",
        title: "Your request has been updated",
        showConfirmButton: false,
        timer: 1500,
      });
      // Clear localStorage and navigate back
      localStorage.removeItem('editRequestData');
      navigate('/userDashboard/requestMeal');
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

  const label = "block mb-1 text-sm font-medium text-black";
  const sub = "text-xs text-gray-500 mb-2";
  const input =
    "w-full border border-black/20 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => {
                localStorage.removeItem('editRequestData');
                navigate('/userDashboard/requestMeal');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Meal Requests
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edit Meal Request
          </h1>
          <p className="text-sm text-gray-600">
            Update your meal plan request details.
          </p>
        </div>

        {/* Form */}
        <div className="max-w-4xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmitUpdate} className="space-y-6" noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={label}>Request Status</label>
                  <p className={sub}>Whether this request is urgent or normal.</p>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    className={`${input} ${
                      errors.status ? "border-red-500" : ""
                    }`}
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.status}
                    </p>
                  )}
                </div>
                <div>
                  <label className={label}>Height</label>
                  <p className={sub}>Your height in centimeters (cm).</p>
                  <input
                    type="text"
                    value={editForm.height}
                    onChange={(e) =>
                      setEditForm({ ...editForm, height: e.target.value })
                    }
                    className={`${input} ${
                      errors.height ? "border-red-500" : ""
                    }`}
                  />
                  {errors.height && (
                    <p className="mt-1 text-sm text-red-600">{errors.height}</p>
                  )}
                </div>
                <div>
                  <label className={label}>Weight</label>
                  <p className={sub}>Your weight in kilograms (kg).</p>
                  <input
                    type="text"
                    value={editForm.weight}
                    onChange={(e) =>
                      setEditForm({ ...editForm, weight: e.target.value })
                    }
                    className={`${input} ${
                      errors.weight ? "border-red-500" : ""
                    }`}
                  />
                  {errors.weight && (
                    <p className="mt-1 text-sm text-red-600">{errors.weight}</p>
                  )}
                </div>
              </div>

              <div>
                <label className={label}>Description</label>
                <p className={sub}>Add any notes or special requirements.</p>
                <textarea
                  rows="3"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className={`${input} ${
                    errors.description ? "border-red-500" : ""
                  }`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className={label}>Meal Type</label>
                <p className={sub}>Choose the type of meal preference.</p>
                <div className="mt-1 flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="mealType"
                      value="Vegan"
                      checked={editForm.mealType === "Vegan"}
                      onChange={(e) =>
                        setEditForm({ ...editForm, mealType: e.target.value })
                      }
                    />
                    Vegan
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="mealType"
                      value="Non-Vegan"
                      checked={editForm.mealType === "Non-Vegan"}
                      onChange={(e) =>
                        setEditForm({ ...editForm, mealType: e.target.value })
                      }
                    />
                    Non-Vegan
                  </label>
                </div>
                {errors.mealType && (
                  <p className="mt-1 text-sm text-red-600">{errors.mealType}</p>
                )}
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {saving ? "Updating..." : "Update Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
