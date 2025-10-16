// src/pages/admin/members/MemberList.jsx
import axios from "axios";
import Loader from "../../../components/lorder-animate";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

export default function MemberList() {
  const [members, setMembers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  function fetchMembers() {
    setLoaded(false);
    const token = localStorage.getItem("token") || localStorage.getItem("jwt");
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/user`, { headers })
      .then((res) => {
       
        const raw = Array.isArray(res.data) ? res.data : res.data?.users || [];
        const onlyMembers = raw.filter(
          (u) => String(u.role || "").toLowerCase() === "user" || String(u.role || "").toLowerCase() === "member"
        );
        setMembers(onlyMembers);
        setLoaded(true);
      })
      .catch((err) => {
        console.error(err);
        toast.error(
          err?.response?.status === 401
            ? "Unauthorized — please sign in again"
            : "Failed to load members"
        );
        setLoaded(true);
      });
  }

  useEffect(() => {
    fetchMembers();
  }, []);
  async function toggleStatus(member) {
    const token = localStorage.getItem("token") || localStorage.getItem("jwt");
    if (!token) {
      toast.error("You must be logged in to update");
      return;
    }
    const newVal = !member.isDisabled;
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/${encodeURIComponent(
          member._id
        )}`,
        { isDisabled: newVal },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Member ${newVal ? "disabled" : "activated"}`);
      setMembers((prev) =>
        prev.map((m) => (m._id === member._id ? { ...m, isDisabled: newVal } : m))
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const name = `${m.firstName || ""} ${m.lastName || ""}`
        .trim()
        .toLowerCase();
      const email = (m.email || "").toLowerCase();
      const phone = (m.phone || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [search, members]);

  return (
    <div className="relative w-full h-full rounded-lg">
      {/* Top bar */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Members</h2>
        <div className="flex items-center gap-3">
          <div className="relative w-64 sm:w-80">
            <svg
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone…"
              className="h-9 w-full rounded-full border border-black/10 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            {search && (
              <button
                aria-label="Clear"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded-full hover:bg-black/5 text-neutral-500"
              >
                ✕
              </button>
            )}
          </div>
          <Link
            to="/admin/members/register"
            className="inline-flex h-9 items-center gap-2 rounded-full bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700 transition"
          >
            + Add Member
          </Link>
        </div>
      </div>

      {loaded ? (
        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-3 py-2 text-left">No</th>
                <th className="px-3 py-2 text-left">Member ID</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Phone</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-center text-neutral-500" colSpan={10}>
                    No members found.
                  </td>
                </tr>
              )}
              {filtered
                .map((m, idx) => (
                  <tr key={m._id || idx} className="border-t border-black/10">
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-3 py-2">{m._id}</td>
                    <td className="px-3 py-2 font-medium">
                      {m.firstName} {m.lastName}
                    </td>
                    <td className="px-3 py-2">{m.email}</td>
                    <td className="px-3 py-2">{m.phone || "-"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.isDisabled
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {m.isDisabled ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleStatus(m)}
                          className="rounded-md bg-blue-600 px-2 py-1 text-white hover:opacity-90"
                        >
                          {m.isDisabled ? "Activate" : "Disable"}
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
