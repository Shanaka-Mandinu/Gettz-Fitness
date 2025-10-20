import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import io from "socket.io-client";

export default function UserInquiry() {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [submittingReply, setSubmittingReply] = useState(false);
    const messagesEndRef = useRef(null);

    const token = useMemo(() => localStorage.getItem("token"), []);
    const userId = useMemo(() => localStorage.getItem("userId"), []);

    // Socket.io connection for real-time updates
    const socket = useMemo(() => {
        if (!token) return null;
        return io(import.meta.env.VITE_BACKEND_URL, {
            auth: {
                token: token
            }
        });
    }, [token]);

    const fetchInquiries = async () => {
        if (!token) return;
        
        setLoading(true);
        setError(null);
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
        
        try {
            const res = await axios.get(`${backendUrl}/api/inquiry/user`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("User inquiry response:", res.data);
            setInquiries(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setError(err?.message || "Failed to fetch inquiries");
            console.error("User inquiry error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInquiries();
    }, [token]);

    // Real-time notification handling for admin replies
    useEffect(() => {
        if (!socket) return;

        // Listen for inquiry reply notifications
        socket.on('inquiryReply', (data) => {
            // Check if this notification is for the current user
            if (data.userId === userId || data.userId === localStorage.getItem("userId")) {
                // Show toast notification
                toast.success(`New reply to your inquiry #${data.inquiryId}`, {
                    duration: 5000,
                    position: 'top-right'
                });

                // Update the specific inquiry with the new reply
                setInquiries(prevInquiries => 
                    prevInquiries.map(inquiry => {
                        if (inquiry.inquiry_id === data.inquiryId) {
                            // Add the new admin reply
                            const newReply = {
                                message: data.message,
                                responder: "admin",
                                date: new Date()
                            };
                            
                            return {
                                ...inquiry,
                                inquiry_response: [...(inquiry.inquiry_response || []), newReply]
                            };
                        }
                        return inquiry;
                    })
                );
            }
        });

        return () => {
            socket.off('inquiryReply');
        };
    }, [socket, userId]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [inquiries, replyingTo]);

    const handleReply = async (inquiryId) => {
        if (!replyText.trim()) {
            toast.error("Please enter a reply message");
            return;
        }

        setSubmittingReply(true);
        try {
            const token = localStorage.getItem("token");
            const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
            
            const response = await axios.post(
                `${backendUrl}/api/inquiry/user-reply/${inquiryId}`,
                { message: replyText.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Reply sent successfully!");
            setReplyText("");
            setReplyingTo(null);
            
            // Refresh inquiries to show the new reply
            await fetchInquiries();
            
        } catch (err) {
            console.error("Reply error:", err);
            toast.error(err?.response?.data?.message || "Failed to send reply");
        } finally {
            setSubmittingReply(false);
        }
    };

    const selectInquiry = (inquiryId) => {
        setReplyingTo(inquiryId);
        setReplyText("");
    };

    const clearSelection = () => {
        setReplyingTo(null);
        setReplyText("");
    };

    // Count inquiries with admin replies
    const inquiriesWithAdminReplies = inquiries.filter(inq => 
        inq.inquiry_response && inq.inquiry_response.some(resp => resp.responder === "admin")
    ).length;

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            {/* Minimal Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Inquiries</h2>
                        <p className="text-sm text-gray-500 mt-1">Support conversations</p>
                    </div>
                    {inquiriesWithAdminReplies > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-600">
                                {inquiriesWithAdminReplies} with replies
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-3"></div>
                        <div className="text-sm text-gray-500">Loading...</div>
                    </div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <div className="text-red-600 text-sm font-medium mb-1">Error</div>
                    <div className="text-red-500 text-sm">{error}</div>
                </div>
            ) : inquiries.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <div className="text-gray-400 text-sm mb-2">No inquiries yet</div>
                    <p className="text-gray-500 text-sm">You haven't submitted any inquiries.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {inquiries.map((inq) => (
                        <div key={inq._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                            {/* Minimal Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    <h3 className="font-medium text-gray-900">{inq.inquiry_type}</h3>
                                    <span className="text-sm text-gray-500">#{inq.inquiry_id}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* New reply indicator */}
                                    {inq.inquiry_response && inq.inquiry_response.some(resp => resp.responder === "admin") && (
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    )}
                                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                                        inq.inquiry_status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                        inq.inquiry_status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                                        inq.inquiry_status === 'Closed' ? 'bg-gray-100 text-gray-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {inq.inquiry_status}
                                    </span>
                                </div>
                            </div>

                            {/* Inquiry Message */}
                            <div className="mb-4">
                                <p className="text-gray-700 text-sm leading-relaxed">{inq.inquiry_message}</p>
                                <p className="text-xs text-gray-400 mt-2">{new Date(inq.inquiry_date).toLocaleString()}</p>
                            </div>

                            {/* Conversation */}
                            {inq.inquiry_response && inq.inquiry_response.length > 0 && (
                                <div className="mb-4">
                                    <div className="space-y-2">
                                        {inq.inquiry_response.map((resp, idx) => (
                                            <div key={idx} className={`text-sm p-3 rounded ${
                                                resp.responder === "admin" 
                                                    ? "bg-blue-50 text-blue-900" 
                                                    : "bg-gray-50 text-gray-700"
                                            }`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-xs">
                                                        {resp.responder === "admin" ? "Admin" : "You"}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {resp.date ? new Date(resp.date).toLocaleString() : ""}
                                                    </span>
                                                </div>
                                                <p className="text-sm">{resp.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reply Section */}
                            {replyingTo === inq.inquiry_id ? (
                                <div className="border-t pt-4">
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type your reply..."
                                        className="w-full p-3 border border-gray-200 rounded text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 mb-3"
                                        rows={3}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleReply(inq.inquiry_id)}
                                            disabled={submittingReply || !replyText.trim()}
                                            className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {submittingReply ? "Sending..." : "Send"}
                                        </button>
                                        <button
                                            onClick={clearSelection}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => selectInquiry(inq.inquiry_id)}
                                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                                >
                                    Reply
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
