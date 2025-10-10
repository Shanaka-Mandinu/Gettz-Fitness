import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaBell } from "react-icons/fa";
import "./NotificationBell.css";

const API = "http://localhost:3000/api/notification";

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
  return <span className={`nf-chip nf-${type}`}>{type}</span>;
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
  
  // Create axios instance with auth header
  const axiosInstance = useMemo(() => {
    return axios.create({
      baseURL: API,
      headers: {
        Authorization: `Bearer ${token}`
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