import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
    Pill,
    ArrowLeft,
    Hash,
    Tag,
    Store,
    Layers,
    FileText,
    User,
    Banknote
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

const types = [
    { value: "Protein", label: "Protein" },
    { value: "Vitamins", label: "Vitamins" },
    { value: "Minerals", label: "Minerals" },
    { value: "Amino Acids", label: "Amino Acids" },
    { value: "Pre-Workout", label: "Pre-Workout" },
    { value: "Post-Workout", label: "Post-Workout" },
    { value: "Performance Enhancer", label: "Performance Enhancer" }
];

export default function SupplementEditPage() {
    const STATUS = ["Available", "Out of stock", "Discontinued"];

    const { code } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [loadingSupp, setLoadingSupp] = useState(true);
    const [saving, setSaving] = useState(false);

    const [Sup_code, setCode] = useState(code || "");
    const [Sup_name, setName] = useState("");
    const [Sup_type, setType] = useState("");
    const [Sup_status, setStatus] = useState("Available");
    const [Sup_supplier, setSupplier] = useState("");
    const [Sup_price, setPrice] = useState("");
    const [Sup_quantity, setQuantity] = useState("");
    const [Sup_image_text, setImageText] = useState("");
    const [IM_ID, setIMID] = useState("");

    // fetch supplement
    useEffect(() => {
        let cancelled = false;

        async function fetchOne() {
            try {
                setLoadingSupp(true);
                const { data } = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/supplement/${encodeURIComponent(code)}`
                );
                const s = data?.supplement || {};
                if (cancelled) return;

                setCode(s.Sup_code || code || "");
                setName(s.Sup_name || "");
                setType(s.Sup_type || "");
                setStatus(s.Sup_status || "Available");
                setSupplier(s.Sup_supplier || "");
                setPrice(s.Sup_price || "");
                setQuantity(s.Sup_quantity || "");
                setImageText(
                    Array.isArray(s.Sup_image) ? s.Sup_image.join("\n") : s.Sup_image || ""
                );
                setIMID(s?.IM_ID?._id || s?.IM_ID || "");
            } catch (err) {
                toast.error(`Failed to load supplement: ${getAxiosError(err)}`);
                navigate("..", { replace: true });
            } finally {
                if (!cancelled) setLoadingSupp(false);
            }
        }

        const s = location.state;
        if (s && typeof s === "object") {
            setCode(s.Sup_code || code || "");
            setName(s.Sup_name || "");
            setType(s.Sup_type || "");
            setStatus(s.Sup_status || "Available");
            setSupplier(s.Sup_supplier || "");
            setPrice(s.Sup_price || "");
            setQuantity(s.Sup_quantity || "");
            setImageText(
                Array.isArray(s.Sup_image) ? s.Sup_image.join("\n") : s.Sup_image || ""
            );
            setIMID(s?.IM_ID?._id || s?.IM_ID || "");
            setLoadingSupp(false);
        } else {
            fetchOne();
        }

        return () => {
            cancelled = true;
        };
    }, [code, location.state, navigate]);

    async function handleSave() {
        if (!Sup_name.trim()) return toast.error("Name is required");
        if (!Sup_type.trim()) return toast.error("Type is required");
        if (!IM_ID.trim()) return toast.error("IM_ID is required");
        if (Sup_price === "" || Number.isNaN(Number(Sup_price)) || Number(Sup_price) <= 0) {
            return toast.error("Valid non-negative price is required");
        }
        if (Sup_quantity === "" || Number.isNaN(Number(Sup_quantity)) || Number(Sup_quantity) <= 0) {
            return toast.error("Valid non-negative quantity is required");
        }

        const imagesArr = Sup_image_text.split(/[\n,]/g).map((s) => s.trim()).filter(Boolean);

        try {
            setSaving(true);
            const payload = {
                Sup_name: Sup_name.trim(),
                Sup_type: Sup_type.trim(),
                Sup_status,
                Sup_supplier: Sup_supplier.trim() || undefined,
                Sup_price: Number(Sup_price) || 0,
                Sup_quantity: Number(Sup_quantity) || 0,
                Sup_image: imagesArr,
                IM_ID: IM_ID.trim(),
            };

            const token = localStorage.getItem("token") || localStorage.getItem("jwt");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/supplement/${encodeURIComponent(code)}`,
                payload,
                { headers }
            );
            toast.success("Supplement updated");
            navigate("/eq_manager/supplements", { replace: true });
        } catch (err) {
            toast.error(`Update failed: ${getAxiosError(err)}`);
        } finally {
            setSaving(false);
        }
    }

    if (loadingSupp) {
        return (
            <div className="w-full min-h-[60vh] flex items-center justify-center">
                <p className="text-sm text-neutral-500">Loading supplement…</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-white text-black flex items-center justify-center p-6">
            <div className="w-full max-w-5xl rounded-2xl border border-black/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden">
                {/* header */}
                <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e30613] text-white">
                            <Pill size={18} />
                        </div>
                        <div>
                            <h1 className="font-semibold">Edit Supplement</h1>
                            <p className="text-xs text-neutral-500">ID : {Sup_code}</p>
                        </div>
                    </div>
                    <Link
                        to="/eq_manager/supplements"
                        relative="path"
                        className="inline-flex items-center gap-1 text-sm text-[#e30613] hover:underline"
                    >
                        <ArrowLeft size={14} />
                        Back to list
                    </Link>
                </div>

                {/* form */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* left */}
                    <div className="space-y-4">
                        {/* id */}
                        <div>
                            <label className="block text-sm font-medium mb-1">ID</label>
                            <div className="relative">
                                <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                <input
                                    value={Sup_code}
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
                                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                <input
                                    value={Sup_name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Whey Protein"
                                    className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                                />
                            </div>
                        </div>

                        {/* type */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Type <span className="text-red-600">*</span>
                            </label>
                            <select
                                value={Sup_type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                            >
                                <option className="block text-sm font-medium mb-1" value="">Select a type...</option>
                                {types.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* supplier */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Supplier</label>
                            <div className="relative">
                                <Store size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                <input
                                    value={Sup_supplier}
                                    onChange={(e) => setSupplier(e.target.value)}
                                    placeholder="NutriCorp Ltd"
                                    className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                                />
                            </div>
                        </div>
                    </div>

                    {/* right */}
                    <div className="space-y-4">
                        {/* status */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <select
                                value={Sup_status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                            >
                                {STATUS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* price */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Price</label>
                            <div className="relative">
                                <Banknote size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                <input
                                    type="number"
                                    min="0"
                                    value={Sup_price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="2500"
                                    className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                                />
                            </div>
                        </div>

                        {/* qty */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Quantity</label>
                            <div className="relative">
                                <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                <input
                                    type="number"
                                    min="1"
                                    value={Sup_quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="100"
                                    className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                                />
                            </div>
                        </div>

                        {/* img url */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Image URLs</label>
                            <div className="relative">
                                <FileText size={14} className="absolute left-3 top-3 text-neutral-500" />
                                <textarea
                                    value={Sup_image_text}
                                    onChange={(e) => setImageText(e.target.value)}
                                    rows={3}
                                    placeholder="Enter one or more URLs, separated by commas or new lines"
                                    className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                                />
                            </div>
                        </div>

                        {/* IM_ID */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Equipment Manager ID<span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                <input
                                    value={IM_ID}
                                    onChange={(e) => setIMID(e.target.value)}
                                    placeholder="Mongo _id of equipmentManager"
                                    className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* footer */}
                <div className="flex items-center justify-between border-t border-black/10 px-6 py-4">
                    <Link
                        to="/eq_manager/supplements"
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
