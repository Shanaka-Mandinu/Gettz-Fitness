import GymLogo from "../../../assets/GymLogo.jpg";
import axios from "axios";
import Loader from "../../../components/lorder-animate";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Search, X as Close } from "lucide-react";

export default function EquipmentDetailsPage() {
  const [equipment, setEquipment] = useState([]);
  const [loaded, setLoaded] = useState(false);

  //need for search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const navigate = useNavigate();

  useEffect(() => {
    if (!loaded) {
      axios
        .get(`${import.meta.env.VITE_BACKEND_URL}/api/equipment`)
        .then((res) => {
          setEquipment(Array.isArray(res?.data?.equipment) ? res.data.equipment : []);
          setLoaded(true);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Failed to load equipment");
        });
    }
  }, [loaded]);

  //delete equipment ui
  async function confirmDelete(id) {
    toast.custom((t) => (
      <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-4 flex flex-col gap-3 w-72">
        <p className="text-sm text-gray-800">Are you sure you want to delete this entry <span className="font-semibold">{id}</span>?</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 rounded-md border text-sm hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              deleteEquipment(id);
            }}
            className="px-3 py-1 rounded-md bg-red-600 text-white text-sm hover:bg-red-700">
            Yes, Delete
          </button>
        </div>
      </div>
    ));
  }

  //delete euipment
  async function deleteEquipment(id) {
    const token = localStorage.getItem("token") || localStorage.getItem("jwt");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    if (!token) {
      toast.error("You must be logged in to delete an equipement");
      return;
    }
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/equipment/${encodeURIComponent(id)}`,
        { headers }
      );
      toast.success("Equipment deleted succssfully");
      setLoaded(false);
    } catch (error) {
      console.error(error);
      toast.error("Faled to delete entry");
    }
  }

  //search part
  const typeOptions = useMemo(() => {
    const set = new Set((equipment || []).map((e) => (e?.Eq_type || "").trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [equipment]);

  const visibleEquipment = useMemo(() => {
    const q = (search || "").toLowerCase().trim();

    return (equipment || [])
      .filter((e) => {
        const matchesText = !q ||
          [e?.Eq_code, e?.Eq_name, e?.Eq_type, e?.Eq_supplier]
            .map((v) => (v || "").toString().toLowerCase())
            .some((v) => v.includes(q));

        const matchesStatus = statusFilter === "all" || e?.Eq_status === statusFilter;

        const matchesType = typeFilter === "all" ||
          (e?.Eq_type || "").toString().toLowerCase() === typeFilter.toLowerCase();

        return matchesText && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        const ac = Number(a?.Eq_code) || 0;
        const bc = Number(b?.Eq_code) || 0;
        return ac - bc;
      });
  }, [equipment, search, statusFilter, typeFilter]);

  //generate pdf
  const handleDownloadPDF = async () => {
    try {
      //landscape
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });

      const img = new Image();
      img.src = GymLogo;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const pageW = doc.internal.pageSize.getWidth();
      const left = 40;

      doc.addImage(img, "JPEG", left, 20, 40, 40);

      doc.setFontSize(18);
      doc.setTextColor(227, 6, 19);
      doc.text("Gettz Fitness — Equipment Report", left + 55, 35);

      doc.setFontSize(11);
      doc.setTextColor(51);
      const now = new Date();
      doc.text(`Generated: ${now.toLocaleString()}`, left + 55, 52);

      //filters
      const statusLabel = statusFilter === "all" ? "All statuses" : statusFilter;
      const typeLabel = typeFilter === "all" ? "All types" : typeFilter;
      const searchLabel = search ? `"${search}"` : "—";
      doc.setFontSize(10);
      doc.text(
        `Filters • Status: ${statusLabel}  |  Type: ${typeLabel}  |  Search: ${searchLabel}`,
        left,
        78,
        { maxWidth: pageW - 2 * left }
      );

      doc.setDrawColor(227, 6, 19);
      doc.line(left, 86, pageW - left, 86);

      //table part
      autoTable(doc, {
        startY: 100,
        head: [[
          "No", "Code", "Name", "Type", "Supplier", "Status", "Repair Note"
        ]],
        body: (visibleEquipment || []).map((e, idx) => [
          idx + 1,
          e?.Eq_code || "-",
          e?.Eq_name || "-",
          e?.Eq_type || "-",
          e?.Eq_supplier || "-",
          e?.Eq_status || "-",
          e?.Eq_repairNote || "No issues",
        ]),
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 4, valign: "top" },
        headStyles: { fillColor: [227, 6, 19], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 40 },   // No
          1: { cellWidth: 90 },   // Code
          2: { cellWidth: 150 },  // Name
          3: { cellWidth: 110 },  // Type
          4: { cellWidth: 130 },  // Supplier
          5: { cellWidth: 120 },  // Status
          6: { cellWidth: 240 },  // Repair Note (wider)
        },

        didDrawPage: () => {
          //footer numbers
          const str = `Page ${doc.internal.getNumberOfPages()}`;
          doc.setFontSize(9);
          doc.setTextColor(120);
          doc.text(
            str,
            pageW - left,
            doc.internal.pageSize.getHeight() - 20,
            { align: "right" }
          );
        },
      });

      //save part
      const total = visibleEquipment.length;
      doc.save(`gettz_fitness_equipment_report_${total}items.pdf`);
      toast.success("PDF downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  //view part
  return (
    <div className="relative w-full h-full rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Equipment Details
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:opacity-95 transition">
            Generate Report
          </button>
          <Link
            //path is corrected
            to="/eq_manager/equipment/add"
            className="inline-flex items-center rounded-lg bg-[#e30613] px-4 py-2 text-sm font-medium text-white hover:opacity-95 transition">
            + Add Equipment
          </Link>
        </div>
      </div>

      {/* {search part} */}
      <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, type, or supplier…"
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

        {/* filter parts */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
        >
          <option value="all">All statuses</option>
          <option value="Available">Available</option>
          <option value="In use">In use</option>
          <option value="Under Maintenance">Under Maintenance</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
        >
          <option value="all">All types</option>
          {typeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-2 text-xs text-neutral-600">
        Showing <b>{visibleEquipment.length}</b> of <b>{equipment.length}</b> items
      </div>

      {/* table start */}
      {loaded ? (
        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-3 py-2 text-left">Code</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Supplier</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Repair Note</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleEquipment.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-center text-neutral-500" colSpan={7}>
                    No equipment found with current filters.
                  </td>
                </tr>
              )}

              {visibleEquipment.map((eq, index) => (
                <tr key={eq.Eq_code || index} className="border-t border-black/10">
                  <td className="px-3 py-2">EQ-{eq.Eq_code}</td>
                  <td className="px-3 py-2">{eq.Eq_name}</td>
                  <td className="px-3 py-2">{eq.Eq_type}</td>
                  <td className="px-3 py-2">{eq.Eq_supplier || "-"}</td>
                  <td className="px-3 py-2">
                    <select
                      value={eq.Eq_status || "Available"}
                      //change status part
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        try {
                          const payload = {
                            Eq_name: eq.Eq_name,
                            Eq_type: eq.Eq_type,
                            Eq_status: newStatus,
                            Eq_repairNote: eq.Eq_repairNote,
                            Eq_supplier: eq.Eq_supplier,
                            IM_ID: eq?.IM_ID?._id || eq?.IM_ID,
                          };
                          await axios.put(
                            `${import.meta.env.VITE_BACKEND_URL}/api/equipment/${encodeURIComponent(eq.Eq_code)}`,
                            payload
                          );
                          toast.success(`Status set to ${newStatus}`);
                          setLoaded(false);
                        } catch (err) {
                          console.error(err);
                          toast.error("Failed to update status");
                        }
                      }}
                      className="rounded border px-2 py-1 text-sm"
                    >
                      <option value="Available">Available</option>
                      <option value="In use">In use</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">{eq.Eq_repairNote || "No issues"}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`edit/${encodeURIComponent(eq.Eq_code)}`, { state: eq })}
                        className="rounded-md bg-black px-2 py-1 text-white hover:opacity-90"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(eq.Eq_code)}
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