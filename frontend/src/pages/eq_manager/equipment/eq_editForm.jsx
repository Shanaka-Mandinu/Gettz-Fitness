import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Dumbbell, ArrowLeft, Hash, Tag, Store, Wrench, User } from "lucide-react";

function getAxiosError(err) {
  const data = err?.response?.data;
  if (!data) return err?.message || "Unknown error";
  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (Array.isArray(data?.errors)) {
    return data.errors.map((e) => e.msg || e.message || JSON.stringify(e)).join(", ");
  }
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

export default function EquipmentEditPage(){
    const STATUS = ["Available", "In use", "Under Maintenance"];

    const { code } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [loadingEquipment, setLoadingEquipment] = useState(true);
    const [saving, setSaving] = useState(false);

    const [Eq_code, setCode] = useState(code || "");
    const [Eq_name, setName] = useState("");
    const [Eq_type, setType] = useState("");
    const [Eq_status, setStatus] = useState("Available");
    const [Eq_repairNote, setRepairNote] = useState("");
    const [Eq_supplier, setSupplier] = useState("");
    const [IM_ID, setIMID] = useState("");
    const [managerName, setManagerName] = useState("");

    //fetch from api , if not from state loc
    useEffect(() => {
    let cancelled = false;

    async function fetchOne() {
      try {
        setLoadingEquipment(true);
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/equipment/${encodeURIComponent(code)}`
        );
        const eq = data?.equipment || {};
        if (cancelled) return;

        setCode(eq.Eq_code || code || "");
        setName(eq.Eq_name || "");
        setType(eq.Eq_type || "");
        setStatus(eq.Eq_status || "Available");
        setRepairNote(eq.Eq_repairNote || "");
        setSupplier(eq.Eq_supplier || "");
        setIMID(eq?.IM_ID?._id || eq?.IM_ID || "");
        setManagerName(eq?.IM_ID?.name || "Unknown manager");
      } catch (err) {
        toast.error(`Failed to load equipment: ${getAxiosError(err)}`);
        navigate("..", { replace: true });
      } finally {
        if (!cancelled) setLoadingEquipment(false);
      }
    }

    const s = location.state;
    if (s && typeof s === "object") {
      setCode(s.Eq_code || code || "");
      setName(s.Eq_name || "");
      setType(s.Eq_type || "");
      setStatus(s.Eq_status || "Available");
      setRepairNote(s.Eq_repairNote || "");
      setSupplier(s.Eq_supplier || "");
      setIMID(s?.IM_ID?._id || s?.IM_ID || "");
      setManagerName(s?.IM_ID?.name || "Unknown manager");
      setLoadingEquipment(false);
    } else {
      fetchOne();
    }

    return () => {
      cancelled = true;
    };
  }, [code, location.state, navigate]);

  useEffect(() => {
    if (!managerName) {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user?.name) setManagerName(user.name);
      } catch {}
    }
  }, [managerName]);

  async function handleSave() {
    if (!Eq_name.trim()) return toast.error("Name is required");
    if (!Eq_type.trim()) return toast.error("Type is required");
    if (!IM_ID.trim()) return toast.error("Equipment Manager is required");

    try{
        setSaving(true);
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

      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/equipment/${encodeURIComponent(code)}`,
        payload,
        { headers }
      );
      toast.success("Equipment updated");
      navigate("/eq_manager/equipment", { replace: true });

    }catch(err){
        toast.error(`Update failed: ${getAxiosError(err)}`);
    }finally{
        setSaving(false);
    }
  }

  if (loadingEquipment) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-neutral-500">Loading equipment…</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white text-black flex items-center justify-center p-6">
      <div className="w-full max-w-5xl rounded-2xl border border-black/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* header part of the form */}
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e30613] text-white">
              <Dumbbell size={18} />
            </div>
            <div>
              <h1 className="font-semibold">Edit Equipment</h1>
              <p className="text-xs text-neutral-500">ID : {Eq_code}</p>
            </div>
          </div>
          <Link
            to="/eq_manager/equipment"
            relative="path"//previous place
            className="inline-flex items-center gap-1 text-sm text-[#e30613] hover:underline"
          >
            <ArrowLeft size={14} />
            Back to list
          </Link>
        </div>

        {/* start of form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* left part */}
          <div className="space-y-4">
            {/* id cant be changed */}
            <div>
              <label className="block text-sm font-medium mb-1">ID</label>
              <div className="relative">
                <Hash
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  value={Eq_code}
                  disabled
                  className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm bg-gray-50 text-gray-600"
                />
              </div>
              <p className="mt-1 text-[11px] text-neutral-500">ID cannot be changed.</p>
            </div>

            {/* name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Name <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Tag
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  value={Eq_name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Centrifuge 3000"
                  className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                />
              </div>
            </div>

            {/* type */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Type <span className="text-red-600">*</span>
              </label>
              <input
                value={Eq_type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Treadmill / Rack / Centrifuge ..."
                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
              />
            </div>

            {/* supplier */}
            <div>
              <label className="block text-sm font-medium mb-1">Supplier</label>
              <div className="relative">
                <Store
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  value={Eq_supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="BioSupplies Ltd"
                  className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                />
              </div>
            </div>
          </div>

          {/* right part */}
          <div className="space-y-4">
            {/* status */}
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
            </div>

            {/* repair Note */}
            <div>
              <label className="block text-sm font-medium mb-1">Repair Note</label>
              <div className="relative">
                <Wrench size={14} className="absolute left-3 top-3 text-neutral-500" />
                <textarea
                  value={Eq_repairNote}
                  onChange={(e) => setRepairNote(e.target.value)}
                  rows={4}
                  placeholder="e.g., Replace belt next service; bearing noise detected."
                  className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                />
              </div>
            </div>

            {/* IM_ID */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Equipment Manager  <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <User
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  value={managerName || "Unknown manager"}
                  disabled
                  className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm bg-gray-50 text-gray-600"
                />
              </div>
              <input type="hidden" value={IM_ID} readOnly />
            </div>
          </div>
        </div>

        {/* footer aprt of the form */}
        <div className="flex items-center justify-between border-t border-black/10 px-6 py-4">
          <Link
            to="/eq_manager/equipment"
            relative="path"//to previous view
            className="inline-flex items-center gap-1 rounded-xl border border-black/10 px-4 py-2 text-sm hover:bg-black/5"
          >
            <ArrowLeft size={14} />
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-[#e30613] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
    
}