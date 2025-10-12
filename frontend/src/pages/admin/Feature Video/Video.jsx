// src/utils/Testing/Video.jsx

import axios from "axios";
import Loader from "../../../components/lorder-animate";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import GymLogo from "../../../assets/GymLogo.jpg";

export default function VideoDetailsPage() {
  const [video, setVideo] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loaded) {
      axios
        .get(`${import.meta.env.VITE_BACKEND_URL}/api/video`)
        .then((res) => {
          setVideo(res.data || []);
          setLoaded(true);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Failed to load videos");
        });
    }
  }, [loaded]);

  async function confirmDelete(id) {
    toast.custom((t) => (
      <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-4 flex flex-col gap-3 w-72">
        <p className="text-sm text-gray-800">Are you sure you want to delete this video?</p>
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
              deleteVideo(id);
            }}
            className="px-3 py-1 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    ));
  }

  async function deleteVideo(id) {
    const token = localStorage.getItem("token") || localStorage.getItem("jwt");
    if (!token) {
      toast.error("You must be logged in to delete a video");
      return;
    }
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/video/delete/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Video deleted successfully");
      setLoaded(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete video");
    }
  }

  // PDF Download Handler
  const handleDownloadPDF = async () => {
    const doc = new jsPDF();
  
    const img = new window.Image();
    img.src = GymLogo;
    await new Promise((resolve) => { img.onload = resolve; });
    doc.addImage(img, 'JPEG', 10, 8, 18, 18);
  
    doc.setFontSize(18);
    doc.setTextColor('#e30613');
    doc.text('Gettz Fitness', 32, 18);
    doc.setFontSize(11);
    doc.setTextColor('#333');
    doc.text('Address: Matara', 32, 25);
    doc.setDrawColor('#e30613');
    doc.line(10, 30, 200, 30);

    
    autoTable(doc, {
      startY: 35,
      head: [[
        'No', 'Video ID', 'Title', 'Duration', 'Views', 'Category', 'Status'
      ]],
      body: video.map((vid, idx) => [
        idx + 1,
        vid.videoId,
        vid.title,
        vid.duration,
        vid.viewCount,
        vid.category,
        vid.isPublished ? 'Published' : 'Unlisted',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [227, 6, 19] },
      styles: { fontSize: 9 },
    });

   
    const sorted = [...video].sort((a, b) => (b.viewCount + b.likeCount) - (a.viewCount + a.likeCount));
    const popular = sorted.slice(0, 5);
    let y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor('#e30613');
    doc.text('Popular Videos', 10, y);
    y += 2;
    autoTable(doc, {
      startY: y + 3,
      head: [[ 'Title', 'Views', 'Likes', 'Category' ]],
      body: popular.map(v => [v.title, v.viewCount, v.likeCount, v.category]),
      theme: 'striped',
      headStyles: { fillColor: [227, 6, 19] },
      styles: { fontSize: 9 },
    });

    doc.save('gettz_fitness_videos.pdf');
  };

  return (
    <div className="relative w-full h-full rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Videos</h2>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:opacity-95 transition"
          >
            Download PDF
          </button>
          <Link
            to="/admin/video/upload"
            className="inline-flex items-center rounded-lg bg-[#e30613] px-4 py-2 text-sm font-medium text-white hover:opacity-95 transition"
          >
            + Add Video
          </Link>
        </div>
      </div>

      {loaded ? (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-x-auto">
            <table className="min-w-full table-fixed text-sm text-left text-gray-700">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-3 py-2 text-left">No</th>
                <th className="px-3 py-2 text-left">Video ID</th>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Duration</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-left">Views</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {video.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-center text-neutral-500" colSpan={7}>
                    No videos found.
                  </td>
                </tr>
              )}

              {[...video]
                .map((vid, index) => (
                  <tr key={vid.videoId || index} className="border-t border-black/10">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2">{vid.videoId}</td>
                    <td className="px-3 py-2">{vid.title}</td>
                    <td className="px-3 py-2">{vid.duration} sec</td>
                    <td className="px-3 py-2">{vid.description}</td>
                    <td className="px-3 py-2">{vid.viewCount}</td>
                    <td className="px-3 py-2">{vid.category}</td>
                    <td className="px-3 py-2">
                      <select
                        value={vid.isPublished ? "published" : "unlisted"}
                        onChange={async (e) => {
                          const newStatus = e.target.value === "published";
                          try {
                            await axios.put(
                              `${import.meta.env.VITE_BACKEND_URL}/api/video/update/${vid.videoId}`,
                              { ...vid, isPublished: newStatus }
                            );
                            toast.success(`Video set to ${newStatus ? "Published" : "Unlisted"}`);
                            setLoaded(false);
                          } catch (err) {
                            toast.error("Failed to update status");
                          }
                        }}
                        className="rounded border px-2 py-1 text-sm"
                      >
                        <option value="published">Published</option>
                        <option value="unlisted">Unlisted</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/video/edit/${encodeURIComponent(vid.videoId)}`,
                              { state: vid }
                            )
                          }
                          className="rounded-md bg-black px-2 py-1 text-white hover:opacity-90"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => confirmDelete(vid.videoId)}
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
