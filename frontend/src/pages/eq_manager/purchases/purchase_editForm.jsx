import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ClipboardList, ArrowLeft, Calendar, Layers, Tag, Hash, Banknote } from "lucide-react";

function getAxiosError(err) {
    const data = err?.response?.data;
    if (!data) return err?.message || "Unknown error";
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (Array.isArray(data?.errors)) {
        return data.errors.map((e) => e.msg || e.message || JSON.stringify(e)).join(", ");
    }
    try { return JSON.stringify(data); } catch { return String(data); }
}

function isoToInputDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function toISO(dateStr) {
    try { return new Date(dateStr).toISOString(); } catch { return dateStr; }
}

export default function PurchaseEditPage() {
    const ITEM_TYPES = ["Equipment", "Supplement", "Other"];
    const { code } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [P_code, setCode] = useState(code || "");
    const [P_date, setDate] = useState("");
    const [P_cost, setCost] = useState("");
    const [P_quantiy, setQty] = useState("");
    const [P_item, setItem] = useState("Other");
    const [P_note, setNote] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function fetchOne() {
            try {
                setLoading(true);
                const { data } = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/purchase/${encodeURIComponent(code)}`
                );
                const p = data?.purcahse || data?.purchase || data;
                if (cancelled) return;

                setCode(p?.P_code || code || "");
                setDate(isoToInputDate(p?.P_date));
                setCost(p?.P_cost ?? "");
                setQty(p?.P_quantiy ?? "");
                setItem(p?.P_item || "Other");
                setNote(p?.P_note || "");
            } catch (err) {
                toast.error(`Failed to load purchase: ${getAxiosError(err)}`);
                navigate("..", { replace: true });
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        const s = location.state;
        if (s && typeof s === "object") {
            setCode(s?.P_code || code || "");
            setDate(isoToInputDate(s?.P_date));
            setCost(s?.P_cost ?? "");
            setQty(s?.P_quantiy ?? "");
            setItem(s?.P_item || "Other");
            setNote(s?.P_note || "");
            setLoading(false);
        } else {
            fetchOne();
        }

        return () => { cancelled = true; };
    }, [code, location.state, navigate]);

    async function handleSave() {
        if (P_cost === "" || isNaN(Number(P_cost)) || Number(P_cost) <= 0) {
            return toast.error("Valid non-negative price is required");
        }
        if (P_quantiy === "" || isNaN(Number(P_quantiy)) || Number(P_quantiy) <= 0) {
            return toast.error("Valid non-negative quantity is required");
        }
        if (!P_date) return toast.error("Date is required");

        try {
            setSaving(true);
            const payload = {
                P_date: toISO(P_date),
                P_cost: Number(P_cost),
                P_quantiy: Number(P_quantiy),
                P_item,
                P_note: P_note.trim() || undefined,
            };

            const token = localStorage.getItem("token") || localStorage.getItem("jwt");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/purchase/${encodeURIComponent(code)}`,
                payload,
                { headers }
            );

            toast.success("Purchase updated");
            navigate("/eq_manager/purchases", { replace: true });
        } catch (err) {
            toast.error(`Update failed: ${getAxiosError(err)}`);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="w-full min-h-[60vh] flex items-center justify-center">
                <p className="text-sm text-neutral-500">Loading…</p>
            </div>
        );
    }

    //edit form start
    return (
        <div className="w-full min-h-screen bg-white text-black flex items-center justify-center p-6">
            <div className="w-full max-w-4xl rounded-2xl border border-black/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden">
                {/* header part */}
                <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e30613] text-white">
                            <ClipboardList size={18} />
                        </div>
                        <div>
                            <h1 className="font-semibold">Edit Purchase</h1>
                            <p className="text-xs text-neutral-500">Code: {P_code}</p>
                        </div>
                    </div>
                    <Link
                        to="/eq_manager/purchases"
                        relative="path"
                        className="inline-flex items-center gap-1 text-sm text-[#e30613] hover:underline"
                    >
                        <ArrowLeft size={14} />
                        Back to list
                    </Link>
                </div>

                {/* form part */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    <div className="space-y-4">
                        {/* id cant be changed*/}
                        <div>
                            <label className="block text-sm font-medium mb-1">Code</label>
                            <div className="relative">
                                <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                <input
                                    value={P_code}
                                    disabled
                                    className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm bg-gray-50 text-gray-600"
                                />
                            </div>
                        </div>

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
                    </div>

                    <div className="space-y-4">
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
                                    className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Quantity <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                <input
                                    type="number"
                                    min="0"
                                    value={P_quantiy}
                                    onChange={(e) => setQty(e.target.value)}
                                    className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                                />
                            </div>
                        </div>

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
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

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

                {/* footer part */}
                <div className="flex items-center justify-between border-t border-black/10 px-6 py-4">
                    <Link
                        to="/eq_manager/purchases"
                        relative="path"
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