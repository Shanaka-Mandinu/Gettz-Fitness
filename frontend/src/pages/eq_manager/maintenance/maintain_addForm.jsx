import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    ClipboardList,
    Calendar,
    FileText,
    Tag,
    Database,
} from "lucide-react";

function getAxiosError(err) {
    const data = err?.response?.data;
    if (!data) return err?.message || "Unknown error";
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (Array.isArray(data?.errors)) {
        return data.errors
            .map((e) => e.msg || e.message || JSON.stringify(e))
            .join(", ");
    }
    try {
        return JSON.stringify(data);
    } catch {
        return String(data);
    }
}

function todayInputDate() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export default function MaintenanceLogAddPage() {
    const TYPES = ["Inspection", "Repair", "Service"];

    // Form state
    const [M_Eq_name, setEqName] = useState("");
    const [M_description, setDesc] = useState("");
    const [M_logType, setLogType] = useState("Inspection");
    const [M_date, setDate] = useState(todayInputDate());
    const [Eq_ID, setEqId] = useState("");

    // Equipment list (to help pick Eq_ID easily)
    const [equipment, setEquipment] = useState([]);
    const [eqLoaded, setEqLoaded] = useState(false);
    const [saving, setSaving] = useState(false);

    const navigate = useNavigate();

    // Load equipment for dropdown (optional helper)
    useEffect(() => {
        if (eqLoaded) return;
        axios
            .get(`${import.meta.env.VITE_BACKEND_URL}/api/equipment`)
            .then((res) => {
                const arr = Array.isArray(res?.data?.equipment)
                    ? res.data.equipment
                    : Array.isArray(res?.data)
                        ? res.data
                        : [];
                setEquipment(arr);
                setEqLoaded(true);
            })
            .catch(() => {
                // Not fatal if equipment list fails; user can still type Eq_ID manually
                setEqLoaded(true);
            });
    }, [eqLoaded]);

    // When choosing from the dropdown, auto-fill Eq_ID and name
    function handlePickEquipment(e) {
        const code = e.target.value;
        setEqId(String(code));
        const found = equipment.find((x) => String(x?.Eq_code) === String(code));
        if (found?.Eq_name && !M_Eq_name) {
            setEqName(found.Eq_name);
        }
    }

    async function handleSave() {
        // Model requires both Eq_ID and M_Eq_name (per your schema), plus description & date
        if (!Eq_ID.trim()) return toast.error("Equipment (Eq_ID) is required");
        if (!M_Eq_name.trim()) return toast.error("Equipment name is required");
        if (!M_description.trim()) return toast.error("Description is required");
        if (!M_date) return toast.error("Date is required");

        try {
            setSaving(true);

            const isoDate = new Date(M_date).toISOString();

            const payload = {
                M_Eq_name: M_Eq_name.trim(),
                M_description: M_description.trim(),
                M_logType,
                M_date: isoDate,
                Eq_ID: Eq_ID.trim(),
            };

            const token = localStorage.getItem("token") || localStorage.getItem("jwt");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/maintenanceLogs`,
                payload,
                { headers }
            );

            toast.success("Maintenance log added");
            navigate("/eq_manager/maintenance");
        } catch (err) {
            toast.error(`Failed to add: ${getAxiosError(err)}`);
        } finally {
            setSaving(false);
        }
    }

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
                            <h1 className="font-semibold">Add Maintenance Log</h1>
                            <p className="text-xs text-neutral-500">
                                Record an inspection, repair, or service.
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/eq_manager/maintenance"
                        className="text-sm text-[#e30613] hover:underline"
                    >
                        View all
                    </Link>
                </div>

                {/* Form */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Left column */}
                    <div className="space-y-4">
                        {/* Equipment Picker (helps fill Eq_ID) */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Pick Equipment
                            </label>
                            <div className="relative">
                                <Database
                                    size={14}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                                />
                                <select
                                    onChange={handlePickEquipment}
                                    defaultValue=""
                                    className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                                >
                                    <option value="" disabled>
                                        {eqLoaded ? "Select from equipment…" : "Loading equipment…"}
                                    </option>
                                    {equipment.map((eq) => (
                                        <option key={eq?._id} value={eq?.Eq_code}>
                                            {eq?.Eq_code ? `${eq.Eq_code} — ` : ""}
                                            {eq?.Eq_name || "-"}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Eq_ID (required) */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Eq_ID <span className="text-red-600">*</span>
                            </label>
                            <input
                                value={Eq_ID}
                                onChange={(e) => setEqId(e.target.value)}
                                placeholder="Equipment code (Eq_code)"
                                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                            />
                        </div>

                        {/* Equipment Name (required) */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Equipment Name <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <Tag
                                    size={14}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                                />
                                <input
                                    value={M_Eq_name}
                                    onChange={(e) => setEqName(e.target.value)}
                                    placeholder="e.g., Treadmill #3"
                                    className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                                />
                            </div>
                        </div>

                        {/* Description (required) */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Description <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 text-neutral-500" size={14} />
                                <textarea
                                    value={M_description}
                                    onChange={(e) => setDesc(e.target.value)}
                                    rows={5}
                                    placeholder="Describe the inspection, repair, or service performed…"
                                    className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-4">
                        {/* Log Type */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Log Type</label>
                            <select
                                value={M_logType}
                                onChange={(e) => setLogType(e.target.value)}
                                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                            >
                                {TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Date <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <Calendar
                                    size={14}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                                />
                                <input
                                    type="date"
                                    value={M_date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                                />
                            </div>
                            <p className="mt-1 text-[11px] text-neutral-500">
                                Defaults to today. You can change it if needed.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-black/10 px-6 py-4">
                    <Link
                        to="/eq_manager/maintenance"
                        className="rounded-xl border border-black/10 px-4 py-2 text-sm hover:bg-black/5"
                    >
                        Cancel
                    </Link>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-xl bg-[#e30613] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? "Saving…" : "Save Log"}
                    </button>
                </div>
            </div>
        </div>
    );
}
