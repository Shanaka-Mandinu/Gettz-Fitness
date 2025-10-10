import axios from "axios";
import { useState, useEffect } from "react";
import { Layers, FileText, Banknote } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    Package,
    Tag,
    Store,
    Hash,
    User,
    Image as ImageIcon,
    ArrowLeft,
} from "lucide-react";

const types = [
    { value: "Protein", label: "Protein" },
    { value: "Vitamins", label: "Vitamins" },
    { value: "Minerals", label: "Minerals" },
    { value: "Amino Acids", label: "Amino Acids" },
    { value: "Pre-Workout", label: "Pre-Workout" },
    { value: "Post-Workout", label: "Post-Workout" },
    { value: "Performance Enhancer", label: "Performance Enhancer" }
];

export default function SupplementAddForm() {
    const STATUS = ["In stock", "Out of stock"];

    //const [Sup_code, setCode] = useState("");
    const [Sup_name, setName] = useState("");
    const [Sup_type, setType] = useState("");
    const [Sup_price, setPrice] = useState("");
    const [Sup_quantity, setQuantity] = useState("");
    const [Sup_status, setStatus] = useState("In stock");
    const [Sup_supplier, setSupplier] = useState("");
    const [IM_ID, setIMID] = useState("");
    const [Sup_image_text, setImageText] = useState("");
    const imagesArr = Sup_image_text.split(/[\n,]/g).map((s) => s.trim()).filter(Boolean);

    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const guess = user?.IM_ID || user?._id || user?.id || user?.managerId || "";
        if (guess && !IM_ID) setIMID(guess);
    }, []);

    async function handleSubmit() {
        //alidations
        //if (!Sup_code.trim()) return toast.error("Code is required");
        if (!Sup_name.trim()) return toast.error("Name is required");
        if (!Sup_type.trim()) return toast.error("Type is required");
        if (!IM_ID.trim()) return toast.error("Equipment Manager ID (IM_ID) is required");
        if (Sup_price === "" || Number.isNaN(Number(Sup_price)) || Number(Sup_price) <= 0) {
            return toast.error("Valid non-negative price is required");
        }
        if (Sup_quantity === "" || Number.isNaN(Number(Sup_quantity)) || Number(Sup_quantity) <= 0) {
            return toast.error("Valid non-negative quantity is required");
        }

        try {
            setSaving(true);

            const payload = {
                //Sup_code: Sup_code.trim(),
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

            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/supplement`, payload, { headers });

            toast.success("Supplement added");
            navigate("/eq_manager/supplements", { replace: true });
        } catch (err) {
            console.error(err);
            if (err?.response?.status === 409) {
                toast.error("Sup_code already exists");
            } else {
                toast.error(err?.response?.data?.message || "Failed to add supplement");
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="w-full min-h-screen bg-white text-black flex items-center justify-center p-6">
            <div className="w-full max-w-4xl rounded-2xl border border-black/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e30613] text-white">
                            <Package size={18} />
                        </div>
                        <div>
                            <h1 className="font-semibold">Add Supplement</h1>
                            <p className="text-xs text-neutral-500">Create a new supplement entry.</p>
                        </div>
                    </div>
                    <Link to="/eq_manager/supplements" relative="path" className="text-sm text-[#e30613] hover:underline">
                        View all
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* {<div className="md:col-span-1">
                                <label className="block text-sm font-medium mb-1">
                                    Code <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                    <input
                                        value={Sup_code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="SUP-0001"
                                        className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                                    />
                                </div>
                            </div>} */}
                            <div className="md:col-span-2">
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
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Supplier
                                </label>
                                <div className="relative">
                                    <Store
                                        size={14}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                                    />
                                    <input
                                        value={Sup_supplier}
                                        onChange={(e) => setSupplier(e.target.value)}
                                        placeholder="XYZ Nutrition Ltd"
                                        className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Price <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <Banknote size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                    <input
                                        type="number"
                                        min="0"
                                        value={Sup_price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="50.00"
                                        className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Quantity <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <Layers
                                        size={14}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        value={Sup_quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="100"
                                        className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <select
                                value={Sup_status}
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
                                Default is <strong>In stock</strong>.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Image URL</label>
                            <div className="relative">
                                <ImageIcon
                                    size={14}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                                />
                                <input
                                    value={Sup_image_text}
                                    onChange={(e) => setImageText(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                                />
                            </div>
                            {/* <p className="mt-1 text-xs text-neutral-500">
                                You can add multiple images later by editing.
                            </p> */}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Inventory Manager ID <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <User
                                    size={14}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                                />
                                <input
                                    value={IM_ID}
                                    onChange={(e) => setIMID(e.target.value)}
                                    placeholder="Mongo _id of inventoryManager"
                                    className="w-full rounded-xl border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                                />
                            </div>
                            <p className="mt-1 text-xs text-neutral-500">
                                Paste the <code>_id</code> of the inventory manager account.
                            </p>
                        </div>
                        <div className="rounded-xl border border-black/10 p-3 bg-black/[0.02]">
                            <div className="flex items-center gap-2 mb-1">
                                <FileText size={14} className="text-neutral-600" />
                                <div className="text-sm font-medium">Tips</div>
                            </div>
                            <ul className="list-disc pl-5 text-xs text-neutral-600 space-y-1">
                                <li>Status can be changed later from the table.</li>
                                <li>Supplier is optional.</li>
                                <li>Image URL is optional, can be added later.</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between border-t border-black/10 px-6 py-4">
                    <Link
                        to="/eq_manager/supplements"
                        relative="path"
                        className="rounded-xl border border-black/10 px-4 py-2 text-sm hover:bg-black/5"
                    >
                        Cancel
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="rounded-xl bg-[#e30613] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? "Saving…" : "Save Supplement"}
                    </button>

                </div>
            </div>
        </div>
    )

}



