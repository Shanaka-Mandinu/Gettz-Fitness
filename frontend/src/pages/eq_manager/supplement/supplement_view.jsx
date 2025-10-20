import GymLogo from "../../../assets/GymLogo.jpg";
import axios from "axios";
import Loader from "../../../components/lorder-animate";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Search,
  X as Close,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";

export default function SupplementsViewPage() {
  const [supplements, setSupplements] = useState([]);
  const [loaded, setLoaded] = useState(false);
  // remember last known non-zero quantities keyed by Sup_code
  const [lastQtyMap, setLastQtyMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("gettz_lastSuppQtyMap") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("gettz_lastSuppQtyMap", JSON.stringify(lastQtyMap));
    } catch {}
  }, [lastQtyMap]);

  //need for search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  //need for image preview
  const [preview, setPreview] = useState({
    open: false,
    index: 0,
    images: [],
    name: "",
    code: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (!loaded) {
      axios
        .get(`${import.meta.env.VITE_BACKEND_URL}/api/supplement`)
        .then((res) => {
          const arr = Array.isArray(res?.data?.supplement)
            ? res.data.supplement
            : Array.isArray(res?.data)
            ? res.data
            : [];
          setSupplements(arr);
          setLoaded(true);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Failed to load supplements");
        });
    }
  }, [loaded]);

  //image preview paer
  function getImages(s) {
    const raw = s?.Sup_image;
    if (!raw) return [];
    if (typeof raw === "string") return raw ? [raw] : [];
    if (Array.isArray(raw)) {
      return raw
        .map((it) =>
          typeof it === "string"
            ? it
            : it?.url || it?.secure_url || it?.src || ""
        )
        .filter(Boolean);
    }
    return [];
  }

  function openPreview(s, startIndex = 0) {
    const imgs = getImages(s);
    if (imgs.length === 0) return;
    setPreview({
      open: true,
      index: Math.max(0, Math.min(startIndex, imgs.length - 1)),
      images: imgs,
      name: s?.Sup_name || "",
      code: s?.Sup_code || "",
    });
  }
  function closePreview() {
    setPreview((p) => ({ ...p, open: false }));
  }
  function prevImage() {
    setPreview((p) => ({ ...p, index: Math.max(0, p.index - 1) }));
  }
  function nextImage() {
    setPreview((p) => ({
      ...p,
      index: Math.min(p.images.length - 1, p.index + 1),
    }));
  }

  // delete ui prt
  async function confirmDelete(id) {
    toast.custom((t) => (
      <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-4 flex flex-col gap-3 w-72">
        <p className="text-sm text-gray-800">
          Are you sure you want to delete this entry{" "}
          <span className="font-semibold">{id}</span>?
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
              deleteSupplement(id);
            }}
            className="px-3 py-1 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    ));
  }

  //delete func
  async function deleteSupplement(id) {
    const token = localStorage.getItem("token") || localStorage.getItem("jwt");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    if (!token) {
      toast.error("You must be logged in to delete a supplement");
      return;
    }
    try {
      await axios.delete(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/supplement/${encodeURIComponent(id)}`,
        { headers }
      );
      toast.success("Supplement deleted successfully");
      setLoaded(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete supplement");
    }
  }

  //filter part
  const typeOptions = useMemo(() => {
    const set = new Set(
      (supplements || []).map((s) => (s?.Sup_type || "").trim()).filter(Boolean)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [supplements]);

  const visibleSupplements = useMemo(() => {
    const q = (search || "").toLowerCase().trim();

    return (supplements || [])
      .filter((s) => {
        const matchesText =
          !q ||
          [s?.Sup_code, s?.Sup_name, s?.Sup_type, s?.Sup_supplier]
            .map((v) => (v || "").toString().toLowerCase())
            .some((v) => v.includes(q));

        const status = (s?.Sup_status || "").toLowerCase();
        const matchesStatus =
          statusFilter === "all" || status === statusFilter.toLowerCase();

        const matchesType =
          typeFilter === "all" ||
          (s?.Sup_type || "").toString().toLowerCase() ===
            typeFilter.toLowerCase();

        return matchesText && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        const ac = Number(a?.Sup_code) || 0;
        const bc = Number(b?.Sup_code) || 0;
        return ac - bc;
      });
  }, [supplements, search, statusFilter, typeFilter]);

  //change status part
  async function updateStatus(s, newStatus) {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("jwt");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let nextQuantity = s.Sup_quantity;
      if (newStatus === "Out of stock") {
        const current = Number(s.Sup_quantity) || 0;
        // save the current qty
        if (current > 0 && s?.Sup_code != null) {
          setLastQtyMap((prev) => ({ ...prev, [s.Sup_code]: current }));
        }
        nextQuantity = 0;
      } else if (newStatus === "In stock") {
        const stored = Number(lastQtyMap?.[s.Sup_code]) || 0;
        nextQuantity = stored > 0 ? stored : 1;
      }

      const payload = {
        Sup_name: s.Sup_name,
        Sup_type: s.Sup_type,
        Sup_price: s.Sup_price,
        Sup_status: newStatus,
        Sup_quantity: nextQuantity,
        Sup_supplier: s.Sup_supplier,
        IM_ID: s?.IM_ID?._id || s?.IM_ID,
        Sup_image: s.Sup_image,
      };

      await axios.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/supplement/${encodeURIComponent(s.Sup_code)}`,
        payload,
        { headers }
      );
      toast.success(`Status set to ${newStatus}`);
      setLoaded(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
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

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "A4",
      });

      const img = new Image();
      img.src = GymLogo;
      await new Promise((resolve) => (img.onload = resolve));

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const left = 40;

      if (img.width) {
        doc.addImage(img, "JPEG", left, 20, 40, 40);
      }

      //getzz and pdf info
      doc.setFontSize(18);
      doc.setTextColor(227, 6, 19);
      doc.text("Gettz Fitness — Supplements Report", left + 55, 35);

      doc.setFontSize(11);
      doc.setTextColor(51);
      const now = new Date();
      doc.text(`Generated: ${now.toLocaleString()}`, left + 55, 52);

      const statusLabel =
        statusFilter === "all" ? "All statuses" : statusFilter;
      const typeLabel = typeFilter === "all" ? "All types" : typeFilter;
      const searchLabel = (search || "").trim() ? `"${search.trim()}"` : "—";
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
        //headers
        startY: 100,
        head: [
          [
            "No",
            "Code",
            "Name",
            "Type",
            "Supplier",
            "Price",
            "Quantity",
            "Status",
          ],
        ],
        body: (visibleSupplements || []).map((s, idx) => [
          idx + 1,
          s?.Sup_code || "-",
          s?.Sup_name || "-",
          s?.Sup_type || "-",
          s?.Sup_supplier || "-",
          money(s?.Sup_price),
          (Number(s?.Sup_quantity) || 0).toLocaleString(),
          s?.Sup_status || "-",
        ]),
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 4, valign: "top" },
        headStyles: { fillColor: [227, 6, 19], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 40 }, // no
          1: { cellWidth: 100 }, // code
          2: { cellWidth: 150 }, // name
          3: { cellWidth: 120 }, // type
          4: { cellWidth: 140 }, // supplier
          5: { cellWidth: 90, halign: "right" }, // price
          6: { cellWidth: 90, halign: "right" }, // quantity
          7: { cellWidth: 110 }, // status
        },
        //footer number
        didDrawPage: () => {
          const str = `Page ${doc.internal.getNumberOfPages()}`;
          doc.setFontSize(9);
          doc.setTextColor(120);
          doc.text(str, pageW - left, pageH - 20, { align: "right" });
        },
      });

      const total = visibleSupplements.length;
      doc.save(`gettz_fitness_supplements_report_${total}items.pdf`);
      toast.success("PDF downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="relative w-full h-full rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Supplements</h2>
        <div className="flex gap-2">
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
            + Add Supplement
          </Link>
        </div>
      </div>

      {/* search */}
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

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
        >
          <option value="all">All statuses</option>
          <option value="In stock">In stock</option>
          <option value="Out of stock">Out of stock</option>
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
        Showing <b>{visibleSupplements.length}</b> of{" "}
        <b>{supplements.length}</b> items
      </div>

      {/* table strt */}
      {loaded ? (
        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-3 py-2 text-left">Image</th>
                <th className="px-3 py-2 text-left">Code</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Supplier</th>
                <th className="px-3 py-2 text-left">Price</th>
                <th className="px-3 py-2 text-left">Quantity</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleSupplements.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-4 text-center text-neutral-500"
                    colSpan={10}
                  >
                    No supplements found with current filters.
                  </td>
                </tr>
              )}

              {visibleSupplements.map((s, index) => {
                const imgs = getImages(s);
                return (
                  <tr
                    key={s.Sup_code || index}
                    className="border-t border-black/10"
                  >

                    {/* img preview prt */}
                    <td className="px-3 py-2">
                      {imgs.length > 0 ? (
                        <button
                          onClick={() => openPreview(s, 0)}
                          className="relative group rounded-md overflow-hidden border border-black/10"
                          title="Click to preview"
                        >
                          <img
                            src={imgs[0]}
                            alt={s?.Sup_name || "Supplement"}
                            className="h-12 w-12 object-cover"
                          />
                          {imgs.length > 1 && (
                            <span className="absolute bottom-0 right-0 text-[10px] px-1.5 py-0.5 rounded-tl bg-black/70 text-white">
                              +{imgs.length - 1}
                            </span>
                          )}
                        </button>
                      ) : (
                        <div className="h-12 w-12 rounded-md border border-dashed border-black/20 flex items-center justify-center text-neutral-400">
                          <ImageIcon size={16} />
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-2">Sup-{s.Sup_code}</td>
                    <td className="px-3 py-2">{s.Sup_name}</td>
                    <td className="px-3 py-2">{s.Sup_type}</td>
                    <td className="px-3 py-2">{s.Sup_supplier || "-"}</td>
                    <td className="px-3 py-2">
                      {(Number(s.Sup_price) || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-3 py-2">{Number(s.Sup_quantity) || 0}</td>
                    <td className="px-3 py-2">
                      <select
                        value={s.Sup_status || "In stock"}
                        onChange={(e) => updateStatus(s, e.target.value)}
                        className="rounded border px-2 py-1 text-sm"
                      >
                        <option value="In stock">In stock</option>
                        <option value="Out of stock">Out of stock</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            navigate(`edit/${encodeURIComponent(s.Sup_code)}`, {
                              state: s,
                            })
                          }
                          className="rounded-md bg-black px-2 py-1 text-white hover:opacity-90"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(s.Sup_code)}
                          className="rounded-md bg-[#e30613] px-2 py-1 text-white hover:opacity-90"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Loader />
      )}

      {/* img loading prt */}
      {preview.open && (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center">
          <div className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">
                  {preview.name || "Supplement"}{" "}
                  {preview.code ? (
                    <span className="text-neutral-500">({preview.code})</span>
                  ) : null}
                </h3>
                <p className="text-xs text-neutral-500">
                  {preview.index + 1} / {preview.images.length}
                </p>
              </div>
              <button
                onClick={closePreview}
                className="rounded-md p-1 hover:bg-black/5"
                aria-label="Close preview"
                title="Close"
              >
                <Close />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3 items-center">
              <div className="flex items-center gap-3 w-full justify-center">
                <button
                  onClick={prevImage}
                  disabled={preview.index === 0}
                  className="rounded-md p-2 hover:bg-black/5 disabled:opacity-30"
                  title="Previous"
                >
                  <ChevronLeft />
                </button>

                <img
                  src={preview.images[preview.index]}
                  alt={preview.name || "Supplement"}
                  className="max-h-[70vh] w-auto object-contain rounded-lg border border-black/10"
                />

                <button
                  onClick={nextImage}
                  disabled={preview.index >= preview.images.length - 1}
                  className="rounded-md p-2 hover:bg-black/5 disabled:opacity-30"
                  title="Next"
                >
                  <ChevronRight />
                </button>
              </div>

              <div className="w-full max-h-28 overflow-y-auto">
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {preview.images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setPreview((p) => ({ ...p, index: i }))}
                      className={`rounded-md overflow-hidden border ${
                        i === preview.index
                          ? "ring-2 ring-[#e30613]"
                          : "border-black/10"
                      }`}
                      title={`Image ${i + 1}`}
                    >
                      <img
                        src={src}
                        alt=""
                        className="h-12 w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
