import GymLogo from "../../../assets/GymLogo.jpg";
import axios from "axios";
import Loader from "../../../components/lorder-animate";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Search, X as Close } from "lucide-react";

export default function MaintenanceLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [search, setSearch] = useState(""); // for search
    const [dateRange, setDateRange] = useState({ from: "", to: "" });

    useEffect(() => {
        if (!loaded) {
            axios
                .get(`${import.meta.env.VITE_BACKEND_URL}/api/maintenanceLogs`)
                .then((res) => {
                    const arr = Array.isArray(res?.data) ? res.data : res?.data?.logs;
                    setLogs(Array.isArray(arr) ? arr : []);
                    setLoaded(true);
                })
                .catch((err) => {
                    console.error(err);
                    toast.error("Failed to load maintenance logs");
                });
        }
    }, [loaded]);


    // Inclusive date range check (treat 'to' as end of the day)
    function isWithinRange(dateStr, from, to) {
        if (!from && !to) return true;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return false;
        if (from) {
            const f = new Date(from);
            if (d < f) return false;
        }
        if (to) {
            const t = new Date(to);
            t.setHours(23, 59, 59, 999);
            if (d > t) return false;
        }
        return true;
    }

    //search + date filter part
    const visibleLogs = useMemo(() => {
        const q = (search || "").toLowerCase().trim();
        return (logs || [])
            .filter((log) => {
                // Search predicate
                const eqName = (log?.M_Eq_name || "").toLowerCase();
                const linkedEqName = (log?.Eq_ID?.Eq_name || "").toLowerCase();
                const linkedEqCode = (log?.Eq_ID?.Eq_code || log?.Eq_ID || "").toString().toLowerCase();
                const desc = (log?.M_description || "").toLowerCase();
                const type = (log?.M_logType || "").toLowerCase();
                const matchesSearch = !q || [eqName, linkedEqName, linkedEqCode, desc, type].some((v) => v.includes(q));

                // Date predicate
                const matchesDate = isWithinRange(log?.M_date, dateRange.from, dateRange.to);

                return matchesSearch && matchesDate;
            })
            .sort((a, b) => new Date(b.M_date) - new Date(a.M_date));
    }, [logs, search, dateRange]);

    //gen pdf
    const handleDownloadPDF = async () => {
        try {
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

            //header
            doc.setFontSize(18);
            doc.setTextColor(227, 6, 19);
            doc.text("Gettz Fitness — Maintenance Logs Report", left + 55, 35);

            doc.setFontSize(11);
            doc.setTextColor(51);
            const now = new Date();
            doc.text(`Generated: ${now.toLocaleString()}`, left + 55, 52);

            //filter
            const searchLabel = (search || "").trim() ? `"${search.trim()}"` : "—";
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

            // Table
            autoTable(doc, {
                startY: 100,
                head: [["No", "Equipment", "Type", "Date", "Description"]],
                body: (visibleLogs || []).map((log, idx) => {
                    const eqLabel =
                        log?.M_Eq_name ||
                        log?.Eq_ID?.Eq_name ||
                        `#${log?.Eq_ID?.Eq_code || log?.Eq_ID || "-"}`;
                    const dateStr = log?.M_date ? new Date(log.M_date).toLocaleDateString() : "-";
                    const desc = (log?.M_description || "No description").slice(0, 160);
                    return [idx + 1, eqLabel, log?.M_logType || "-", dateStr, desc];
                }),
                theme: "grid",
                styles: { fontSize: 9, cellPadding: 4, valign: "top" },
                headStyles: { fillColor: [227, 6, 19], textColor: 255 },
                columnStyles: {
                    0: { cellWidth: 40 },   // No
                    1: { cellWidth: 220 },  // Equipment
                    2: { cellWidth: 130 },  // Type
                    3: { cellWidth: 100 },  // Date
                    4: { cellWidth: 400 },  // Description
                },
                didDrawPage: () => {
                    const str = `Page ${doc.internal.getNumberOfPages()}`;
                    doc.setFontSize(9);
                    doc.setTextColor(120);
                    doc.text(str, pageW - left, pageH - 20, { align: "right" });
                },
            });

            //save
            const total = (visibleLogs || []).length;
            doc.save(`gettz_fitness_maintenance_report_${total}logs.pdf`);
            toast.success("PDF downloaded");
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate PDF");
        }
    };


    //view part
    return (
        <div className="relative w-full h-full rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold">Maintenance Logs</h2>

                {/* Search + Date filter */}
                <div className="flex flex-col sm:flex-row gap-2 flex-1 sm:max-w-2xl">
                    <div className="relative flex-1">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                        />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by equipment name, type, or description…"
                            className="w-full rounded-xl border border-black/10 pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
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
                            onChange={(e) => setDateRange((r) => ({ ...r, from: e.target.value }))}
                            className="rounded border border-black/10 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                            max={dateRange.to || undefined}
                        />
                        <span className="mx-1 text-xs text-neutral-500">to</span>
                        <input
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))}
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
                    <button onClick={handleDownloadPDF}
                        className="inline-flex rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:opacity-95 transition">
                        Generate Report
                    </button>
                </div>
                <div className="flex gap-2">
                    <Link
                        to="add"
                        className="inline-flex items-center rounded-lg bg-[#e30613] px-4 py-2 text-sm font-medium text-white hover:opacity-95 transition"
                    >
                        + Add Log
                    </Link>
                </div>
            </div>


            <div className="mb-2 text-xs text-neutral-600">
                Showing <b>{visibleLogs.length}</b> of <b>{logs.length}</b> logs
            </div>

            {loaded ? (
                <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-black text-white">
                            <tr>
                                <th className="px-3 py-2 text-left">No</th>
                                <th className="px-3 py-2 text-left">Equipment</th>
                                <th className="px-3 py-2 text-left">Type</th>
                                <th className="px-3 py-2 text-left">Date</th>
                                <th className="px-3 py-2 text-left">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleLogs.length === 0 ? (
                                <tr>
                                    <td className="px-3 py-4 text-center text-neutral-500" colSpan={5}>
                                        {logs.length === 0 ? "No maintenance logs found." : "No logs match your search."}
                                    </td>
                                </tr>
                            ) : (
                                visibleLogs.map((log, index) => {
                                    const eqLabel =
                                        log?.M_Eq_name ||
                                        log?.Eq_ID?.Eq_name ||
                                        `#${log?.Eq_ID?.Eq_code || log?.Eq_ID || "-"}`;
                                    const dateStr = log?.M_date
                                        ? new Date(log.M_date).toLocaleDateString()
                                        : "-";

                                    return (
                                        <tr key={log?._id || index} className="border-t border-black/10">
                                            <td className="px-3 py-2">{index + 1}</td>
                                            <td className="px-3 py-2">{eqLabel}</td>
                                            <td className="px-3 py-2">{log?.M_logType || "-"}</td>
                                            <td className="px-3 py-2">{dateStr}</td>
                                            <td className="px-3 py-2">
                                                <span title={log?.M_description}>
                                                    {(log?.M_description || "").slice(0, 60)}
                                                    {(log?.M_description || "").length > 60 ? "…" : ""}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>

                    </table>
                </div>
            ) : (
                <Loader />
            )}
        </div>

    );
}