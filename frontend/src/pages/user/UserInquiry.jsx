import React, { useEffect, useState } from "react";
import axios from "axios";

export default function UserInquiry() {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        setLoading(true);
        setError(null);
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
        axios.get(`${backendUrl}/api/inquiry/user`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                console.log("User inquiry response:", res.data);
                setInquiries(Array.isArray(res.data) ? res.data : []);
                setLoading(false);
            })
            .catch(err => {
                setError(err?.message || "Failed to fetch inquiries");
                console.error("User inquiry error:", err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold text-black mb-6">Your Inquiries & Replies</h2>
            {loading ? (
                <div className="text-gray-500">Loading inquiries...</div>
            ) : error ? (
                <div className="text-red-500">Error: {error}</div>
            ) : inquiries.length === 0 ? (
                <div className="text-gray-500">No inquiries found.</div>
            ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {inquiries.map((inq) => (
                        <li key={inq._id} className="bg-white rounded-2xl shadow-md border border-red-100 p-6 flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-600 font-semibold text-sm">{inq.inquiry_type}</span>
                                {inq.inquiry_status && (
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ml-2
                                        ${inq.inquiry_status === 'completed' ? 'bg-green-100 text-green-700' :
                                          inq.inquiry_status === 'inprogress' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-gray-100 text-gray-700'}`}
                                    >
                                        {inq.inquiry_status.charAt(0).toUpperCase() + inq.inquiry_status.slice(1)}
                                    </span>
                                )}
                            </div>
                            <div className="text-gray-800 text-base font-medium mb-1">{inq.inquiry_message}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <span>Sent: {new Date(inq.inquiry_date).toLocaleString()}</span>
                            </div>
                            <div className="font-semibold text-gray-700 mb-1">Replies:</div>
                            <div className="flex flex-col gap-1">
                                {inq.inquiry_response && inq.inquiry_response.length > 0 ? (
                                    inq.inquiry_response.map((resp, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <span className="text-red-600 font-bold">{resp.responder === "admin" ? "Admin:" : "You:"}</span>
                                            <span className="text-gray-700 font-medium">{resp.message}</span>
                                            <span className="text-gray-400 text-xs">{resp.date ? new Date(resp.date).toLocaleString() : ""}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-gray-400">No replies yet.</div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
