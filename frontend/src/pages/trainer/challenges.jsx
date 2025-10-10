import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import GymLogo from "../../assets/GymLogo.jpg";
import axios from "axios";
import toast from "react-hot-toast";
import Loader from "../../components/lorder-animate";

export default function TrainerChallenges() {
  const [participations, setParticipations] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return participations;
    return participations.filter((p) => {
      const challengeId = String(p.challengeID ?? "").toLowerCase();
      const title = String(p.title ?? "").toLowerCase();
      const points = String(p.points ?? "").toLowerCase();
      const userId = String(p.userID ?? "").toLowerCase();
      const userName = String(p.userName ?? "").toLowerCase();
      const status = p.completed ? "approved" : "pending";
      return (
        challengeId.includes(q) ||
        title.includes(q) ||
        points.includes(q) ||
        userId.includes(q) ||
        userName.includes(q) ||
        status.includes(q)
      );
    });
  }, [query, participations]);

  const handleDownloadPDF = async () => {
    const list = filtered;
    const doc = new jsPDF();

    // Add logo
    const img = new window.Image();
    img.src = GymLogo;
    await new Promise((resolve) => { img.onload = resolve; });
    doc.addImage(img, 'JPEG', 10, 8, 18, 18);

    doc.setFontSize(18);
    doc.setTextColor('#e30613');
    doc.text('Gettz Fitness', 32, 18);
    doc.setFontSize(11);
    doc.setTextColor('#333');
    doc.text('Address: GettzFitness Matara', 32, 25);

    doc.setFontSize(10);
    doc.setTextColor('#333');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 150, 18, { align: 'right' });
    doc.setDrawColor('#e30613');
    doc.line(10, 30, 200, 30);

    autoTable(doc, {
      startY: 35,
      head: [[
        'No', 'Challenge ID', 'Title', 'Points', 'Member Name', 'Status'
      ]],
      body: list.map((p, i) => [
        i + 1,
        p.challengeID ?? '-',
        p.title ?? '-',
        p.points ?? '-',
        p.userName ?? '-',
        p.completed ? 'Approved' : 'Pending',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [227, 6, 19] },
      styles: { fontSize: 9 },
    });

    // Add summary: Top 5 approved challenges by points
    const approved = list.filter(p => p.completed);
    const sorted = [...approved].sort((a, b) => (b.points || 0) - (a.points || 0));
    const top = sorted.slice(0, 5);
    let y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor('#e30613');
    doc.text('Top Approved Challenges (by Points)', 10, y);
    y += 2;
    autoTable(doc, {
      startY: y + 3,
      head: [[ 'Title', 'Points', 'Member Name' ]],
      body: top.map(c => [c.title, c.points, c.userName]),
      theme: 'striped',
      headStyles: { fillColor: [227, 6, 19] },
      styles: { fontSize: 9 },
    });

    doc.save('challenge_approvals.pdf');
  };

  async function fetchParticipations() {
    setLoaded(false);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("jwt");
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/challenge/userchallenges`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setParticipations(data || []);
    } catch (err) {
      toast.error("Failed to load challenge participations");
    } finally {
      setLoaded(true);
    }
  }

  async function approveParticipation(userChallengeId) {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("jwt");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/challenge/complete/${userChallengeId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Challenge approved and points awarded!");
      fetchParticipations();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to approve challenge"
      );
    }
  }

  useEffect(() => {
    fetchParticipations();
  }, []);

  return (
    <div className="p-6">
      {loaded ? (
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-semibold text-black">Challenge Approvals</h1>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by challenge, user, name…"
                  className="w-80 rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-red-500"
                />
              </div>
              {/* Download PDF (green) */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-700"
              >
                Download PDF
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white overflow-x-auto">
            <table className="min-w-full table-fixed text-sm text-left text-gray-700">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="w-10 px-4 py-3">No</th>
                  <th className="w-20 px-4 py-3">Challenge ID</th>
                  <th className="w-40 px-4 py-3">Title</th>
                  <th className="w-20 px-4 py-3">Points</th>
                  <th className="w-40 px-4 py-3">Member Name</th>
                  <th className="w-20 px-4 py-3">Status</th>
                  <th className="w-32 px-4 py-3 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-center" colSpan={7}>
                      No participations found
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, idx) => (
                    <tr key={p._id} className="align-top">
                      <td className="w-10 px-4 py-3">{idx + 1}</td>
                      <td className="w-20 px-4 py-3">{p.challengeID}</td>
                      <td className="w-40 px-4 py-3 font-medium text-gray-900">
                        {p.title}
                      </td>
                      <td className="w-20 px-4 py-3">{p.points}</td>
                      <td className="w-40 px-4 py-3">{p.userName}</td>
                      <td className="w-20 px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${p.completed ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {p.completed ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td className="w-32 px-4 py-3">
                        <div className="flex justify-center">
                          <select
                            value={p.completed ? "approved" : "pending"}
                            disabled={p.completed}
                            onChange={e => {
                              if (e.target.value === "approved" && !p.completed) {
                                approveParticipation(p.userChallengeId);
                              }
                            }}
                            className="rounded-xl border border-gray-300 px-3 py-1 text-sm outline-none focus:border-red-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approve</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="h-[500px] border-2">
          <Loader />
        </div>
      )}
    </div>
  );
}