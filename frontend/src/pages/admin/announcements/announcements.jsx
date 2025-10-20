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

export default function AnnouncementDetailsPage() {
  const [announcement, setAnnouncement] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  //for filtering part
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [filterLoading, setFilterLoading] = useState(false)

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoaded(false);
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/notification`);
        setAnnouncement(response.data || []);
        setLoaded(true);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        toast.error("Failed to load announcements");
        setLoaded(true);
      }
    };
    
    fetchInitialData();
  }, []); // Empty dependency array - only runs once

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
        deleteAnnouncement(id);
      }
    });
  }

  async function deleteAnnouncement(id) {
    const token = localStorage.getItem("token") || localStorage.getItem("jwt");
    if (!token) {
      toast.error("You must be logged in to delete an announcement");
      return;
    }
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/notification/delete/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Announcement deleted successfully");
      setLoaded(false);
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/notification`);
      setAnnouncement(response.data || []);
      setLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete announcement");
      setLoaded(true);
    }
  }

  // Filter announcements by title, type, or deliveryTo
  const filteredAnnouncements = announcement.filter((notifi) => {
    if(!searchTerm) return true
    const term = searchTerm.toLowerCase();
    return (
      notifi.title?.toLowerCase().includes(term) ||
      notifi.type?.toLowerCase().includes(term) ||
      notifi.deliveryTo?.toLowerCase().includes(term)
    );
  });

  useEffect(() => {
    if (!loaded) return; // Don't run until initial data is loaded
    
    const fetchFilteredData = async () => {
      try {
        setFilterLoading(true); // Show filter loading state
        
        const params = new URLSearchParams();
        if (typeFilter !== "all") params.append("type", typeFilter);
        if (dateFilter !== "all") params.append("date", dateFilter);
        
        const url = params.toString() 
          ? `${import.meta.env.VITE_BACKEND_URL}/api/notification/filter?${params}`
          : `${import.meta.env.VITE_BACKEND_URL}/api/notification`;
          
        const response = await axios.get(url);
        setAnnouncement(response.data || []);
      } catch (error) {
        console.error("Failed to fetch filtered notifications:", error);
        toast.error("Failed to load filtered announcements");
      } finally {
        setFilterLoading(false); // Hide filter loading state
      }
    };

    fetchFilteredData();
  }, [typeFilter, dateFilter, loaded]); // Dependencies: filters and loaded state


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
    doc.text('Address: 48 Udyana Mawatha, Matara', 32, 25);

    doc.setFontSize(10);
    doc.setTextColor('#333');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 150, 18, { align: 'right' });
    doc.setDrawColor('#e30613');
    doc.line(10, 30, 200, 30);

    autoTable(doc, {
      startY: 35,
      head: [[
        'No', 'Announcement ID', 'Type', 'Title', 'Delivery To', 'Sent Date'
      ]],
      body: filteredAnnouncements.map((notifi, idx) => [
        idx + 1,
        notifi.notificationID || '-',
        notifi.type || '-',
        notifi.title || '-',
        notifi.deliveryTo || '-',
        new Date(notifi.createdAt).toLocaleDateString(),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [227, 6, 19] },
      styles: { fontSize: 9 },
    });

    // Optionally, add a summary of most recent announcements
    const sorted = [...filteredAnnouncements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recent = sorted.slice(0, 5);
    let y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor('#e30613');
    doc.text('Recent Announcements', 10, y);
    y += 2;
    autoTable(doc, {
      startY: y + 3,
      head: [[ 'Title', 'Type', 'Delivery To', 'Sent Date' ]],
      body: recent.map(a => [
        a.title || '-', 
        a.type || '-', 
        a.deliveryTo || '-', 
        new Date(a.createdAt).toLocaleDateString()
      ]),
      theme: 'striped',
      headStyles: { fillColor: [227, 6, 19] },
      styles: { fontSize: 9 },
    });

    doc.save('gettz_fitness_announcements.pdf');
  };

  return (
    <div className="p-6">
      {loaded && (
        <div className="mx-auto max-w-6xl">
          {/* header */}
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-semibold text-black">Manage Announcements</h1>
            <div className="relative ml-auto">
                <input
                  type="text"
                  placeholder="Search by title, type, or delivery..."
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
              <Link to="/admin/announcement/upload">
                <button className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-700">
                  <Plus className="h-4 w-4" />
                  Add Announcement
                </button>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center mb-5">

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500"
              >
                <option value="all">All Types</option>
                <option value="promotional">Promotional</option>
                <option value="alert">Alert</option>
                <option value="warning">Warning</option>
              </select>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
              </select>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white overflow-x-auto">
            <table className="min-w-full table-fixed text-sm text-left text-gray-700">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="w-20 px-4 py-3">No</th>
                  <th className="w-40 px-4 py-3">Announcement ID</th>
                  <th className="w-28 px-4 py-3">Type</th>
                  <th className="w-40 px-4 py-3">Title</th>
                  <th className="w-28 px-4 py-3">Delivery To</th>
                  {/* <th className="w-28 px-4 py-3">Created By</th> */}
                  <th className="w-28 px-4 py-3">Sent Date</th>
                  <th className="w-32 px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-500">
                {filteredAnnouncements.length === 0 && (
                  <tr>
                    <td
                      className="px-3 py-4 text-center text-neutral-500"
                      colSpan={8}
                    >
                      No announcements found.
                    </td>
                  </tr>
                )}

                {filteredAnnouncements.map((notifi, index) => (
                  <tr key={notifi.notificationId || index} className="align-top">
                    <td className="w-20 px-4 py-3">{index + 1}</td>
                    <td className="w-40 px-4 py-3">{notifi.notificationID}</td>
                    <td className="w-28 px-4 py-3">{notifi.type}</td>
                    <td className="w-40 px-4 py-3 font-medium text-gray-900">{notifi.title}</td>
                    <td className="w-28 px-4 py-3">{notifi.deliveryTo}</td>
                    {/* <td className="w-28 px-4 py-3">{notifi.createdBy}</td> */}
                    <td className="w-28 px-4 py-3">{new Date(notifi.createdAt).toLocaleDateString()}</td>
                    <td className="w-32 px-4 py-3">
                      <div className="flex justify-evenly">
                        <button
                          className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 mr-[5px]"
                          onClick={() =>
                            navigate(
                              `/admin/announcement/edit/${encodeURIComponent(notifi._id)}`,
                              { state: notifi }
                            )
                          }
                        >
                          Update
                        </button>
                        <button
                          className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                          onClick={() => confirmDelete(notifi._id)}
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
