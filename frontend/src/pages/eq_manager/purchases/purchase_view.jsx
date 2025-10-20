import axios from "axios";
import Loader from "../../../components/lorder-animate";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Search, X as Close } from "lucide-react";
import GymLogo from "../../../assets/GymLogo.jpg";

export default function PurchaseListPage() {
    const [purchases, setPurchases] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [query, setQuery] = useState(""); // for search
    const [dateRange, setDateRange] = useState({ from: "", to: "" });
    const navigate = useNavigate();

    useEffect(() => {
        if (!loaded) {
            axios
                .get(`${import.meta.env.VITE_BACKEND_URL}/api/purchase`)
                .then((res) => {
                    const arr = Array.isArray(res?.data?.purchase) ? res.data.purchase : Array.isArray(res?.data) ? res.data : [];
                    setPurchases(arr);
                    setLoaded(true);
                })
                .catch((err) => {
                    console.error(err);
                    toast.error("Failed to load purchases");
                });
        }
    }, [loaded]);

    // Helper to check if a date is within range
    function isWithinDateRange(dateStr, from, to) {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (from && d < new Date(from)) return false;
        if (to && d > new Date(to)) return false;
        return true;
    }

    //filter function
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return purchases.filter((p) => {
            // Search filter
            const code = String(p?.P_code ?? "").toLowerCase();
            const item = String(p?.P_item ?? "").toLowerCase();
            const matchesQuery = !q || code.includes(q) || item.includes(q);
            // Date filter
            const matchesDate = (!dateRange.from && !dateRange.to) || isWithinDateRange(p?.P_date, dateRange.from, dateRange.to);
            return matchesQuery && matchesDate;
        });
    }, [purchases, query, dateRange]);

    //delete ui
    function confirmDelete(code) {
        toast.custom((t) => (
            <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-4 flex flex-col gap-3 w-72">
                <p className="text-sm text-gray-800">
                    Are you sure you want to delete purchase{" "}
                    <span className="font-semibold">{code}</span>?
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1 rounded-md border text-sm hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            deletePurchase(code);
                        }}
                        className="px-3 py-1 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        ));
    }

    //delete function
    async function deletePurchase(code) {
        const token = localStorage.getItem("token") || localStorage.getItem("jwt");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        if (!token) {
            toast.error("You must be logged in to delete a purchase");
            return;
        }
        try {
            await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/api/purchase/${encodeURIComponent(
                    code
                )}`,
                { headers }
            );
            toast.success("Purchase deleted");
            setLoaded(false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete purchase");
        }
    }

    //gen pdf
    const handleDownloadPDF = async () => {
        try {
            const money = (n) =>
                (Number(n) || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });

            const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });

            const img = new Image();
            img.src = GymLogo;
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const left = 40;

            if (img.width) {
                doc.addImage(img, "JPEG", left, 20, 40, 40);
            }

            doc.setFontSize(18);
            doc.setTextColor(227, 6, 19);
            doc.text("Gettz Fitness — Purchases Report", left + 55, 35);

            doc.setFontSize(11);
            doc.setTextColor(51);
            const now = new Date();
            doc.text(`Generated: ${now.toLocaleString()}`, left + 55, 52);

            // PDF filter summary
            const searchLabel = (query || "").trim() ? `"${query.trim()}"` : "—";
            let dateLabel = "—";
            if (dateRange.from && dateRange.to) {
                dateLabel = `${new Date(dateRange.from).toLocaleDateString()} to ${new Date(dateRange.to).toLocaleDateString()}`;
            } else if (dateRange.from) {
                dateLabel = `From ${new Date(dateRange.from).toLocaleDateString()}`;
            } else if (dateRange.to) {
                dateLabel = `Up to ${new Date(dateRange.to).toLocaleDateString()}`;
            }
            doc.setFontSize(10);
            doc.text(`Filters • Search: ${searchLabel}   Date: ${dateLabel}`, left, 78, {
                maxWidth: pageW - 2 * left,
            });

            doc.setDrawColor(227, 6, 19);
            doc.line(left, 86, pageW - left, 86);

            // table
            autoTable(doc, {
                startY: 100,
                head: [["No", "Code", "Date", "Item", "Qty", "Cost", "Total", "Note"]],
                body: (filtered || []).map((p, idx) => {
                    const qty = Number(p?.P_quantiy ?? p?.P_quantity ?? 0) || 0; // model uses P_quantiy
                    const cost = Number(p?.P_cost ?? 0) || 0;
                    const total = qty * cost;
                    return [
                        idx + 1,
                        p?.P_code || "-",
                        p?.P_date ? new Date(p.P_date).toLocaleDateString() : "-",
                        p?.P_item || "-",
                        qty.toLocaleString(),
                        money(cost),
                        money(total),
                        (p?.P_note || "No notes").slice(0, 80),
                    ];
                }),
                theme: "grid",
                styles: { fontSize: 9, cellPadding: 4, valign: "top" },
                headStyles: { fillColor: [227, 6, 19], textColor: 255 },
                columnStyles: {
                    0: { cellWidth: 40 },                 // No
                    1: { cellWidth: 110 },                // Code
                    2: { cellWidth: 90 },                 // Date
                    3: { cellWidth: 130 },                // Item
                    4: { cellWidth: 60, halign: "right" }, // Qty
                    5: { cellWidth: 110, halign: "right" }, // Cost
                    6: { cellWidth: 110, halign: "right" }, // Total
                    7: { cellWidth: 260 },                // Note
                },
                didDrawPage: () => {
                    const str = `Page ${doc.internal.getNumberOfPages()}`;
                    doc.setFontSize(9);
                    doc.setTextColor(120);
                    doc.text(str, pageW - left, pageH - 20, { align: "right" });
                },
            });

            // Save
            const total = (filtered || []).length;
            doc.save(`gettz_fitness_purchases_report_${total}items.pdf`);
            toast.success("PDF downloaded");
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate PDF");
        }
    };


    //view start
    return (
        <div className="relative w-full h-full rounded-lg">
            {/* Title + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold">Purchases</h2>

                {/* Search and Date Filter */}
                <div className="flex flex-col sm:flex-row gap-2 flex-1 sm:max-w-2xl">
                    {/* Search bar */}
                    <div className="relative flex-1">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                        />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by code, item"
                            className="w-full rounded-xl border border-black/10 pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-black/5"
                                aria-label="Clear search"
                                title="Clear"
                            >
                                <Close size={14} className="text-neutral-500" />
                            </button>
                        )}
                    </div>
                    {/* Date range filter */}
                    <div className="flex items-center gap-1">
                        <label className="text-xs text-neutral-600 mr-1">Date:</label>
                        <input
                            type="date"
                            value={dateRange.from}
                            onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))}
                            className="rounded border border-black/10 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                            max={dateRange.to || undefined}
                        />
                        <span className="mx-1 text-xs text-neutral-500">to</span>
                        <input
                            type="date"
                            value={dateRange.to}
                            onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))}
                            className="rounded border border-black/10 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                            min={dateRange.from || undefined}
                        />
                        {(dateRange.from || dateRange.to) && (
                            <button
                                onClick={() => setDateRange({ from: "", to: "" })}
                                className="ml-1 rounded p-1 hover:bg-black/5"
                                title="Clear date filter"
                            >
                                <Close size={13} className="text-neutral-500" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="ml-auto flex gap-2">
                    <button
                        onClick={handleDownloadPDF}
                        className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:opacity-95 transition"
                    >
                        Generate Report
                    </button>
                    <Link
                        to="add"
                        className="inline-flex items-center rounded-lg bg-[#e30613] px-4 py-2 text-sm font-medium text-white hover:opacity-95 transition"
                    >
                        + Add Purchase
                    </Link>
                </div>
            </div>

            <div className="mb-2 text-xs text-neutral-600">
                Showing <b>{filtered.length}</b> of <b>{purchases.length}</b> purchases
            </div>


            {loaded ? (
                <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-black text-white">
                            <tr>
                                
                                <th className="px-3 py-2 text-left">Code</th>
                                <th className="px-3 py-2 text-left">Date</th>
                                <th className="px-3 py-2 text-left">Cost</th>
                                <th className="px-3 py-2 text-left">Quantity</th>
                                <th className="px-3 py-2 text-left">Item</th>
                                <th className="px-3 py-2 text-left">Note</th>
                                <th className="px-3 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td
                                        className="px-3 py-4 text-center text-neutral-500"
                                        colSpan={8}
                                    >
                                        {query ? "No purchases match your search." : "No purchases found."}
                                    </td>
                                </tr>
                            )}

                            {[...filtered]
                                .sort((a, b) => {
                                    // Sort by P_code ascending 
                                    const codeA = String(a.P_code || "").toLowerCase();
                                    const codeB = String(b.P_code || "").toLowerCase();
                                    if (codeA < codeB) return -1;
                                    if (codeA > codeB) return 1;
                                    return 0;
                                })
                                .map((p, index) => (
                                    <tr key={p.P_code || index} className="border-t border-black/10">
                                        <td className="px-3 py-2">PU-{p.P_code}</td>
                                        <td className="px-3 py-2">
                                            {p?.P_date ? new Date(p.P_date).toLocaleDateString() : "-"}
                                        </td>
                                        <td className="px-3 py-2">{p.P_cost}</td>
                                        <td className="px-3 py-2">{p.P_quantiy}</td>
                                        <td className="px-3 py-2">{p.P_item}</td>
                                        <td className="px-3 py-2">
                                            <span title={p?.P_note}>
                                                {(p?.P_note || "").slice(0, 60)}
                                                {(p?.P_note || "").length > 60 ? "…" : ""}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        navigate(`edit/${encodeURIComponent(p.P_code)}`, {
                                                            state: p,
                                                        })
                                                    }
                                                    className="rounded-md bg-black px-2 py-1 text-white hover:opacity-90"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(p.P_code)}
                                                    className="rounded-md bg-[#e30613] px-2 py-1 text-white hover:opacity-90"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <Loader />
            )}
        </div>
    );
}