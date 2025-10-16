import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import {
  Dumbbell,
  Tag,
  Wrench,
  User,
  FileText,
  Store,
} from "lucide-react";

export default function EquipmentAddPage() {
  const STATUS = ["Available", "In use", "Under Maintenance"];

  const [Eq_name, setName] = useState("");
  const [Eq_type, setType] = useState("");
  const [Eq_status, setStatus] = useState("Available");
  const [Eq_repairNote, setRepairNote] = useState("");
  const [Eq_supplier, setSupplier] = useState("");
  const [IM_ID, setIMID] = useState("");
  const [managerName, setManagerName] = useState("");

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    // Prefer to show the manager's name; IM_ID is used for submission
    const idGuess = user?.IM_ID || user?._id || user?.id || user?.managerId || "";
    const nameGuess = user?.name || user?.managerName || "";
    if (idGuess && !IM_ID) setIMID(idGuess);
    if (nameGuess && !managerName) setManagerName(nameGuess);
  }, []);

  async function handleSubmit() {
    //validations 
    if (!Eq_name.trim()) return toast.error("Equipment name is required");
    if (!Eq_type.trim()) return toast.error("Equipment type is required");
    if (!IM_ID.trim()) return toast.error("Equipment Manager is required");

    try {
      setLoading(true);

      const payload = {
        Eq_name: Eq_name.trim(),
        Eq_type: Eq_type.trim(),
        Eq_status,
        Eq_repairNote: Eq_repairNote.trim() || undefined,
        Eq_supplier: Eq_supplier.trim() || undefined,
        IM_ID: IM_ID.trim(),
      };

      const token = localStorage.getItem("token") || localStorage.getItem("jwt");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/equipment`, payload, { headers }
      );

      toast.success("Equipment added successfully");
      navigate("/eq_manager/equipment", { replace: true });
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 409) {
        toast.error("Eq_code already exists");
      } else {
        toast.error(err?.response?.data?.message || "Failed to add equipment");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen bg-white text-black flex items-center justify-center p-6">
      <div className="w-full max-w-4xl rounded-2xl border border-black/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e30613] text-white">
              <Dumbbell size={18} />
            </div>
            <div>
              <h1 className="font-semibold">Add Equipment</h1>
              <p className="text-xs text-neutral-500">Create a new equipment entry.</p>
            </div>
          </div>
          <Link to=".." relative="path" className="text-sm text-[#e30613] hover:underline">
            View all
          </Link>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Left (main fields) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Code & Name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Name <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    value={Eq_name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Centrifuge 3000"
                    className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                  />
                </div>
              </div>
            </div>

            {/* Type & Supplier */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Type <span className="text-red-600">*</span>
                </label>
                <input
                  value={Eq_type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="Centrifuge / Treadmill / Rack ..."
                  className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Supplier</label>
                <div className="relative">
                  <Store size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    value={Eq_supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="BioSupplies Ltd"
                    className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={Eq_status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-neutral-500">
                Default is <strong>Available</strong>.
              </p>
            </div>

            {/* Repair note */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Repair Note
              </label>
              <div className="relative">
                <Wrench size={14} className="absolute left-3 top-3 text-neutral-500" />
                <textarea
                  value={Eq_repairNote}
                  onChange={(e) => setRepairNote(e.target.value)}
                  rows={3}
                  placeholder="e.g., Replace belt next service; bearing noise detected."
                  className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500">Leave blank if there are no issues.</p>
            </div>
          </div>

          {/* right: equipment Manager */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Equipment Manager <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  value={managerName || "Unknown manager"}
                  disabled
                  className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm bg-gray-50 text-gray-600"
                />
              </div>
              <input type="hidden" value={IM_ID} readOnly />
              
            </div>
            {/* {tips part} */}
            <div className="rounded-xl border border-black/10 p-3 bg-black/[0.02]">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={14} className="text-neutral-600" />
                <div className="text-sm font-medium">Tips</div>
              </div>
              <ul className="list-disc pl-5 text-xs text-neutral-600 space-y-1">
                <li>Status can be changed later from the table.</li>
                <li>Repair note is optional.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-black/10 px-6 py-4">
          <Link
            Link to="/eq_manager/equipment" relative="path"
            className="rounded-xl border border-black/10 px-4 py-2 text-sm hover:bg-black/5"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl bg-[#e30613] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save Equipment"}
          </button>
        </div>
      </div>
    </div>
  );
}
