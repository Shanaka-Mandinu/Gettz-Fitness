import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Calendar, ClipboardList, Layers, Banknote } from "lucide-react";

//date into ISO 
function toISO(dateStr) {
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return dateStr;
  }
}

function todayInputDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function PurchaseAddPage() {
  const ITEM_TYPES = ["Equipment", "Supplement", "Other"];

  //const [P_code, setCode] = useState("");
  const [P_date, setDate] = useState(todayInputDate());
  const [P_cost, setCost] = useState("");
  const [P_quantiy, setQty] = useState("");
  const [P_item, setItem] = useState("Other");
  const [P_note, setNote] = useState("");

  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleSave() {
    //if (!P_code.trim()) return toast.error("Code is required");
    if (!P_date) return toast.error("Date is required");
    if (P_cost === "" || isNaN(Number(P_cost)) || Number(P_cost) <= 0) {
      return toast.error("Valid non-negative price is required");
    }
    if (P_quantiy === "" || isNaN(Number(P_quantiy)) || Number(P_quantiy) <= 0) {
      return toast.error("Valid non-negative quantity is required");
    }

    try {
      setSaving(true);
      const payload = {
        //P_code: P_code.trim(),
        P_date: toISO(P_date),
        P_cost: Number(P_cost),
        P_quantiy: Number(P_quantiy),
        P_item,
        P_note: P_note.trim() || undefined,
      };

      const token = localStorage.getItem("token") || localStorage.getItem("jwt");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase`,
        payload,
        { headers }
      );

      toast.success("Purchase added");
      navigate("/eq_manager/purchases");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to add purchase");
    } finally {
      setSaving(false);
    }
  }


  //form start
  return (
    <div className="w-full min-h-screen bg-white text-black flex items-center justify-center p-6">
      <div className="w-full max-w-4xl rounded-2xl border border-black/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e30613] text-white">
              <ClipboardList size={18} />
            </div>
            <div>
              <h1 className="font-semibold">Add Purchase</h1>
              <p className="text-xs text-neutral-500">Create a new purchase record.</p>
            </div>
          </div>
          <Link to="/eq_manager/purchases" className="text-sm text-[#e30613] hover:underline">
            View all
          </Link>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          <div className="space-y-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Date <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="date"
                  value={P_date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                />
              </div>
            </div>

            {/* Item */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Item <span className="text-red-600">*</span>
              </label>
              <select
                value={P_item}
                onChange={(e) => setItem(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
              >
                {ITEM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {/* Cost */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Cost LKR<span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Banknote size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={P_cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                />
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Quantity <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="number"
                  min="1"
                  value={P_quantiy}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="1"
                  className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium mb-1">Note</label>
              <input
                value={P_note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note…"
                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-black/10 px-6 py-4">
          <Link
            to="/eq_manager/purchases"
            className="rounded-xl border border-black/10 px-4 py-2 text-sm hover:bg-black/5"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-[#e30613] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Purchase"}
          </button>
        </div>
      </div>
    </div>
  );
}