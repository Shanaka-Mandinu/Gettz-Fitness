import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaBell } from "react-icons/fa";
import io from "socket.io-client";
import toast from "react-hot-toast";
import "./NotificationBell.css";

const API = `${import.meta.env.VITE_BACKEND_URL}/api/notification`;

const formatDateTime = (ts) => {
  try {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
};

const TypeChip = ({ type = "info" }) => {
  const getTypeLabel = (type) => {
    switch (type) {
      case 'inquiry_reply':
        return 'Inquiry Reply';
      case 'promotional':
        return 'Promotional';
      case 'system':
        return 'System';
      case 'announcement':
        return 'Announcement';
      default:
        return type;
    }
  };

  return <span className={`nf-chip nf-${type}`}>{getTypeLabel(type)}</span>;
};

const SkeletonItem = () => (
  <div className="nf-item nf-skeleton">
    <div className="nf-chip nf-skeleton-chip" />
    <div className="nf-title nf-skeleton-line" />
    <div className="nf-body nf-skeleton-line long" />
    <div className="nf-meta nf-skeleton-line short" />
  </div>
);

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = useMemo(() => localStorage.getItem("token"), []);
  const userId = useMemo(() => localStorage.getItem("userId"), []);
  
  // Create axios instance with auth header
  const axiosInstance = useMemo(() => {
    return axios.create({
      baseURL: API,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }, [token]);

  // Socket.io connection for real-time notifications
  const socket = useMemo(() => {
    if (!token) return null;
    return io(import.meta.env.VITE_BACKEND_URL, {
      auth: {
        token: token
      }
    });
  }, [token]);

  const fetchMine = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/mine');
      const data = response.data; // [{id, title, body, type, createdAt, isRead}]
      setItems(data);
      setUnread(data.filter((x) => !x.isRead).length);
    } catch (e) {
      console.error("Error fetching notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMine(); // initial
    const t = setInterval(fetchMine, 45000); // light polling
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time notification handling
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

        // Add notification to the list
        const newNotification = {
          id: data.notification.id,
          title: data.notification.title,
          body: data.notification.body,
          type: data.notification.type,
          createdAt: data.notification.createdAt,
          isRead: false
        };

        setItems(prev => [newNotification, ...prev]);
        setUnread(prev => prev + 1);
      }
    });

    // Listen for general notifications
    socket.on('notification', (data) => {
      if (data.userId === userId || data.userId === localStorage.getItem("userId")) {
        toast.success(data.title, {
          duration: 4000,
          position: 'top-right'
        });

        const newNotification = {
          id: data.id,
          title: data.title,
          body: data.body,
          type: data.type,
          createdAt: data.createdAt,
          isRead: false
        };

        setItems(prev => [newNotification, ...prev]);
        setUnread(prev => prev + 1);
      }
    });

    return () => {
      socket.off('inquiryReply');
      socket.off('notification');
    };
  }, [socket, userId]);

  const markAllAsRead = async () => {
    try {
      await axiosInstance.put('/markasread');
      setItems((prev) => prev.map((p) => ({ ...p, isRead: true })));
      setUnread(0);
    } catch (e) {
      console.error("Error marking all as read:", e);
    }
  };

  // Close on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      const panel = document.getElementById("nf-panel");
      const btn = document.getElementById("nf-button");
      if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="nf-wrap">
      <button
        id="nf-button"
        className="nf-bell"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Open notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <FaBell className="nf-bell-icon" />
        {unread > 0 && <span className="nf-badge">{unread}</span>}
      </button>

      {open && (
        <div
          id="nf-panel"
          className="nf-panel"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="nf-header">
            <div className="nf-titlebar">
              <h3 className="nf-title">Notifications</h3>
              <div className="nf-actions">
                <button className="nf-link" onClick={fetchMine}>
                  Refresh
                </button>
                <span className="nf-sep" />
                <button className="nf-link" onClick={markAllAsRead}>
                  Mark all as read
                </button>
              </div>
            </div>
          </div>

          <div className="nf-list">
            {loading ? (
              <>
                <SkeletonItem />
                <SkeletonItem />
                <SkeletonItem />
              </>
            ) : items.length === 0 ? (
              <div className="nf-empty">
                <div className="nf-empty-emoji">🔔</div>
                <div className="nf-empty-title">You're all caught up</div>
                <div className="nf-empty-sub">No notifications to show.</div>
                <button className="nf-ghost" onClick={fetchMine}>
                  Check again
                </button>
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`nf-item ${!n.isRead ? "nf-unread" : ""}`}
                >
                  <div className="nf-item-top">
                    <TypeChip type={n.type} />
                    {!n.isRead && <span className="nf-dot" aria-hidden="true" />}
                  </div>
                  <div className="nf-titleline">{n.title}</div>
                  <div className="nf-body">{n.body}</div>
                  <div className="nf-meta">{formatDateTime(n.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}