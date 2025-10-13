import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, Shield, Clock, IdCard } from "lucide-react";
import DefaultAvatar from "../../../assets/default-avatar.png";

export default function AdminProfile() {
  const [admin, setAdmin] = useState(null);

  // Load from localStorage only
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setAdmin(JSON.parse(stored));
    } catch {
      setAdmin(null);
    }
  }, []);

  const displayName = useMemo(() => {
    if (!admin) return "";
    const full = [admin.firstName, admin.lastName].filter(Boolean).join(" ").trim();
    if (full) return full;
    if (admin.name && typeof admin.name === "string") return admin.name;
    if (admin.email && typeof admin.email === "string") return admin.email.split("@")[0];
    return "Admin";
  }, [admin]);

  const avatarSrc = useMemo(() => {
    if (!admin) return DefaultAvatar;
    const candidates = [admin.profilePicture, admin.avatar];
    for (const c of candidates) {
      if (typeof c === "string" && c.trim() !== "" && c !== "default-profile.jpg") return c;
    }
    return DefaultAvatar;
  }, [admin]);

  if (!admin) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
          <h2 className="text-xl font-semibold mb-2">No profile data</h2>
          <p>Please sign in to view your admin profile.</p>
        </div>
      </div>
    );
  }

  const email = admin.email || "-";
  const role = admin.role || "admin";
  const adminId = admin.adminId || admin.AID || admin.uid || "-";
  const phone = admin.phone || admin.phoneNumber || "-";
  const createdAt = admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "-";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      {/* Page Title */}
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Profile Settings</h2>
      </div>
      <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Accent bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 rounded-t-2xl" />

        {/* Header */}
        <div className="px-6 pt-8 pb-4 flex flex-col items-center text-center">
          <img
            src={avatarSrc}
            alt={displayName || "Admin"}
            className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-md bg-white"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DefaultAvatar;
            }}
          />
          <h1 className="mt-4 text-2xl font-extrabold text-gray-900">{displayName}</h1>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
              <Shield size={14} /> {role}
            </span>
            {createdAt !== "-" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                <Clock size={14} /> Joined {createdAt}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50">
              <Mail className="text-red-600" size={18} />
              <div>
                <div className="text-xs text-gray-500">Email</div>
                <div className="font-medium text-gray-800 break-all">{email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50">
              <Phone className="text-red-600" size={18} />
              <div>
                <div className="text-xs text-gray-500">Phone</div>
                <div className="font-medium text-gray-800">{phone}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="text-xs text-gray-500">Admin ID</div>
              <div className="mt-1 font-semibold text-gray-900 flex items-center gap-2">
                <IdCard size={16} className="text-red-600" /> {adminId}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="text-xs text-gray-500">Role</div>
              <div className="mt-1 font-semibold text-gray-900 capitalize">{role}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
