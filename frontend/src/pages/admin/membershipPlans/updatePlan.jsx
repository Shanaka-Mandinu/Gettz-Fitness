import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Plus, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function UpdatePlanForm() {
  const locationData = useLocation();
  const [plan_id, setPlanId] = useState(locationData.state.plan_id);
  const [plan_name, setPlanName] = useState(locationData.state.plan_name);
  const [price, setPrice] = useState(locationData.state.price);
  const [duration, setDuration] = useState(locationData.state.duration);
  const [description, setDescription] = useState(
    locationData.state.description
  );
  const [features, setFeatures] = useState(locationData.state.features);
  const [errors, setErrors] = useState({}); // ✅ CHANGED: hold per-field errors

  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  function updateFeature(index, value) {
    setFeatures((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function addFeature() {
    setFeatures((prev) => [...prev, ""]);
  }
  function removeFeature(index) {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  }

  function validate() {
    const nextErrors = {};

    if (!plan_name.trim()) nextErrors.plan_name = "Plan name is required.";
    if (price === "" || Number(price) < 0)
      nextErrors.price = "Price must be 0 or greater.";
    if (duration === "" || Number(duration) < 1)
      nextErrors.duration = "Duration must be at least 1 day.";
    if (!description.trim())
      nextErrors.description = "Description is required.";

    // If you want features to be required:
    if (features.length === 0 || features.every((f) => !String(f).trim())) {
      nextErrors.features = "Add at least one feature.";
    }

    setErrors(nextErrors); //  set per-field errors
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return; 

    const planData = {
      plan_name: plan_name.trim(),
      price: Number(price),
      duration: Number(duration),
      description: description.trim(),
      features: features.map((f) => f.trim()).filter(Boolean),
    };

    const token = localStorage.getItem("token");

    setSubmitting(true);
    try {
      await axios.put(
        import.meta.env.VITE_BACKEND_URL + "/api/plan/updatePlan/" + plan_id,
        planData,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      Swal.fire({ icon: "success", title: "Plan Updated!" });
      navigate("/admin/membership");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create plan.";
      Swal.fire({ icon: "error", title: "Error", text: msg });
      console.error("Create plan error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 pt-0">
      <div className="border-b border-gray-100 px-6 py-4">
        <h1 className="text-xl font-semibold text-black">
          Update Membership Plan
        </h1>
        <p className="text-sm text-gray-500">
          Update a plan for your gym members.
        </p>
      </div>

      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <form className="px-6 py-6 space-y-6" onSubmit={handleSubmit}>
            {/* Basic details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="plan_id"
                  className="block text-sm font-medium text-gray-700"
                >
                  Plan ID
                </label>
                <input
                  id="plan_id"
                  name="plan_id"
                  type="text"
                  value={plan_id} 
                  onChange={(e) => setPlanId(e.target.value)}
                  disabled 
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-100 cursor-not-allowed px-3 py-2 text-sm outline-none"
                  placeholder="Auto-generated"
                />
              </div>

              <div>
                <label
                  htmlFor="plan_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Plan Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="plan_name"
                  name="plan_name"
                  type="text"
                  value={plan_name} 
                  onChange={(e) => setPlanName(e.target.value)}
                  className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-red-500
                    ${
                      errors.plan_name
                        ? "border-red-500"
                        : "border-gray-300 bg-white"
                    }`}
                  placeholder="e.g., Beginner, Pro, Elite"
                />
                {errors.plan_name && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.plan_name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700"
                >
                  Price <span className="text-red-600">*</span>
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)}
                  className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-red-500
                    ${
                      errors.price
                        ? "border-red-500"
                        : "border-gray-300 bg-white"
                    }`}
                  placeholder="e.g., 49.99"
                />
                {errors.price && (
                  <p className="mt-1 text-xs text-red-600">{errors.price}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="duration"
                  className="block text-sm font-medium text-gray-700"
                >
                  Duration (days) <span className="text-red-600">*</span>
                </label>
                <input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  step="1"
                  value={duration} 
                  onChange={(e) => setDuration(e.target.value)}
                  className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-red-500
                    ${
                      errors.duration
                        ? "border-red-500"
                        : "border-gray-300 bg-white"
                    }`}
                  placeholder="30"
                />
                {errors.duration && (
                  <p className="mt-1 text-xs text-red-600">{errors.duration}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description <span className="text-red-600">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-red-500
                  ${
                    errors.description
                      ? "border-red-500"
                      : "border-gray-300 bg-white"
                  }`}
                placeholder="Brief details about the plan, who it's for, and benefits…"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Features list */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Features
                </label>
                <button
                  type="button"
                  onClick={addFeature}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Feature
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={f}
                      onChange={(e) => updateFeature(i, e.target.value)}
                      placeholder={`Feature ${i + 1}`}
                      className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(i)}
                      className="rounded-xl border border-gray-300 px-3 py-2 hover:bg-gray-50"
                      aria-label={`Remove feature ${i + 1}`}
                    >
                      <Trash2 className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>

              {errors.features && (
                <p className="mt-2 text-xs text-red-600">{errors.features}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPlanName("");
                  setPrice("");
                  setDuration("");
                  setDescription("");
                  setFeatures([]);
                  setErrors({});
                }}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-700 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {submitting ? "Updating..." : "Update Plan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
