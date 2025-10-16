import axios from "axios";
import Loader from "../../../components/lorder-animate";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import GymLogo from "../../../assets/GymLogo.jpg";
import { Plus, Search } from "lucide-react";
import Swal from "sweetalert2";

export default function ChallengeDetailsPage() {

  const [challenges, setChallenges] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!loaded) {
      axios
        .get(`${import.meta.env.VITE_BACKEND_URL}/api/challenge`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        .then((res) => {
          setChallenges(res.data || []);
          setLoaded(true);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Failed to load challenges");
        });
    }
  }, [loaded]);


  function confirmDelete(id) {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteChallenge(id);
      }
    });
  }



  async function deleteChallenge(id) {
    const token = localStorage.getItem("token") || localStorage.getItem("jwt");
    if (!token) {
      toast.error("You must be logged in as admin to delete a challenge");
      return;
    }
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/challenge/delete/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Challenge deleted successfully");
      setLoaded(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete challenge");
    }
  }

  // Filtered challenges by search term
  const filteredChallenges = challenges.filter(
    (ch) =>
      ch.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ch.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ch.challengeID?.toString().includes(searchTerm)
  );

  // PDF Download (styled like Video.jsx)
  const handleDownloadPDF = async () => {
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
        'No', 'Competition ID', 'Title', 'Points', 'Start Date', 'End Date'
      ]],
      body: filteredChallenges.map((ch, idx) => [
        idx + 1,
        ch.challengeID,
        ch.title,
        ch.points,
        new Date(ch.startDate).toLocaleDateString(),
        new Date(ch.endDate).toLocaleDateString(),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [227, 6, 19] },
      styles: { fontSize: 9 },
    });

    // Optionally, add a summary or highlight top competitions by points
    const sorted = [...filteredChallenges].sort((a, b) => b.points - a.points);
    const top = sorted.slice(0, 5);
    let y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor('#e30613');
    doc.text('Top Competitions (by Points)', 10, y);
    y += 2;
    autoTable(doc, {
      startY: y + 3,
      head: [[ 'Title', 'Points', 'Start Date', 'End Date' ]],
      body: top.map(c => [c.title, c.points, new Date(c.startDate).toLocaleDateString(), new Date(c.endDate).toLocaleDateString()]),
      theme: 'striped',
      headStyles: { fillColor: [227, 6, 19] },
      styles: { fontSize: 9 },
    });

    doc.save('gettz_fitness_competitions.pdf');
  };

  return (
    <div className="p-6">
      {loaded && (
        <div className="mx-auto max-w-6xl">
          {/* header */}
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-semibold text-black">Manage Competitions</h1>
            <div className="relative ml-auto">
                <input
                  type="text"
                  placeholder="Search by title or ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-75 rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-red-500"
                  style={{ paddingRight: '2.5rem' }}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-800"
              >
                Download PDF
              </button>
              <Link to="/admin/competition/add">
                <button className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-700">
                  <Plus className="h-4 w-4" />
                  Add Competition
                </button>
              </Link>
            </div>
          </div>
          

          <div className="rounded-2xl border border-gray-200 bg-white overflow-x-auto">
            <table className="min-w-full table-fixed text-sm text-left text-gray-700">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="w-20 px-4 py-3">No</th>
                  <th className="w-28 px-4 py-3">Image</th>
                  <th className="w-40 px-4 py-3">Competition ID</th>
                  <th className="w-40 px-4 py-3">Title</th>
                  <th className="w-28 px-4 py-3">Points</th>
                  <th className="w-28 px-4 py-3">Start Date</th>
                  <th className="w-28 px-4 py-3">End Date</th>
                  <th className="w-32 px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-500">
                {filteredChallenges.length === 0 && (
                  <tr>
                    <td
                      className="px-3 py-4 text-center text-neutral-500"
                      colSpan={8}
                    >
                      No competitions found.
                    </td>
                  </tr>
                )}

                {filteredChallenges.map((ch, index) => (
                  <tr key={ch.challengeID || index} className="align-top">
                    <td className="w-20 px-4 py-3">{index + 1}</td>
                    <td className="w-28 px-4 py-3">
                      {ch.imageUrl ? (
                        <img
                          src={ch.imageUrl}
                          alt={ch.title}
                          className="h-12 w-20 object-cover rounded-md border"
                        />
                      ) : (
                        <span className="text-xs text-neutral-400">No Image</span>
                      )}
                    </td>
                    <td className="w-40 px-4 py-3">{ch.challengeID}</td>
                    <td className="w-40 px-4 py-3 font-medium text-gray-900">{ch.title}</td>
                    <td className="w-28 px-4 py-3">{ch.points}</td>
                    <td className="w-28 px-4 py-3">{new Date(ch.startDate).toLocaleDateString()}</td>
                    <td className="w-28 px-4 py-3">{new Date(ch.endDate).toLocaleDateString()}</td>
                    <td className="w-32 px-4 py-3">
                      <div className="flex justify-evenly">
                        <button
                          className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 mr-[5px]"
                          onClick={() =>
                            navigate(
                              `/admin/competition/update/${encodeURIComponent(ch.challengeID)}`,
                              { state: ch }
                            )
                          }
                        >
                          Update
                        </button>
                        <button
                          className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                          onClick={() => confirmDelete(ch.challengeID)}
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
        </div>
      )}

      {!loaded && (
        <div className="h-[500px]">
          <Loader />
        </div>
      )}
    </div>
  );
}