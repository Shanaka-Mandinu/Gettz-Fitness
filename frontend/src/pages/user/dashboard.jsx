import axios from "axios";
import { Phone, Mail, MessageSquare, Medal } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import DefaultAvatar from "../../assets/default-avatar.png";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [loaded, setLoaded] = useState(false);
  const [userData, setUserData] = useState(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Load user data from localStorage
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        setUserData(JSON.parse(userStr));
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }, []);

  const fullName = useMemo(() => {
    if (!userData) return "User";
    return [userData.firstName, userData.lastName].filter(Boolean).join(" ").trim() || "User";
  }, [userData]);

  const avatarSrc = useMemo(() => {
    if (!userData) return DefaultAvatar;
    
    // Check for valid HTTP URLs first
    if (
      userData?.avatar &&
      typeof userData.avatar === "string" &&
      userData.avatar.startsWith("http")
    )
      return userData.avatar;
    if (
      userData?.profilePicture &&
      typeof userData.profilePicture === "string" &&
      userData.profilePicture.startsWith("http")
    )
      return userData.profilePicture;
    
    // Check for other valid profile pictures (not default placeholder)
    if (
      userData?.profilePicture &&
      typeof userData.profilePicture === "string" &&
      userData.profilePicture !== "default-profile.jpg" &&
      userData.profilePicture.trim() !== ""
    )
      return userData.profilePicture;
    if (
      userData?.avatar &&
      typeof userData.avatar === "string" &&
      userData.avatar !== "default-profile.jpg" &&
      userData.avatar.trim() !== ""
    )
      return userData.avatar;
    
    // Fallback to default avatar
    return DefaultAvatar;
  }, [userData]);

  console.log(userData);

  console.log(userData);
  useEffect(() => {
    if (!userData) return;
    
    if (userData.role != "user" && userData.role != "member") {
      return navigate("/login");
    }
    if (!loaded) {
      axios
        .get(import.meta.env.VITE_BACKEND_URL + "/api/user/getUser", {
          headers: {
            Authorization: "Bearer " + token,
          },
        })
        .then((res) => {
          console.log("User data from API:", res.data);
          // Update user data if needed
          if (res.data?.user) {
            localStorage.setItem("user", JSON.stringify(res.data.user));
            setUserData(res.data.user);
          }
        })
        .catch((err) => {
          console.error("Error fetching user data:", err);
        });
    }
  }, [loaded, userData, navigate, token]);
  return (
    <div className="w-full min-h-[675px] flex items-center justify-center">
      <div className="max-w-sm mx-auto bg-white rounded-2xl border border-red-300 shadow-sm p-6">
        {/* Avatar + Score */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src={avatarSrc}
              alt="User avatar"
              className="h-24 w-24 rounded-full object-cover ring-8 ring-slate-100"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DefaultAvatar;
              }}
            />
            <div className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-white shadow ring-1 ring-slate-200">
              <div className="h-7 w-7 flex items-center justify-center rounded-full border-2 border-green-200 bg-green-500 text-emerald-700 text-sm font-semibold"></div>
            </div>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            {fullName}
          </h2>
          <p className="text-sm text-slate-500">{userData?.role || "User"}</p>
        </div>

        {/* Contact Icons */}
        <div className="flex justify-center gap-4 mt-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-full border bg-white shadow-sm text-slate-700">
            📞
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-full border bg-white shadow-sm text-slate-700">
            ✉️
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-full border bg-white shadow-sm text-slate-700">
            💬
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 divide-y divide-slate-200 border rounded-xl">
          <div className="flex justify-between px-4 py-2 text-sm">
            <span className="text-slate-500">Email</span>
            <span className="text-slate-900">{userData?.email || "-"}</span>
          </div>
          <div className="flex justify-between px-4 py-2 text-sm">
            <span className="text-slate-500">Phone</span>
            <span className="text-slate-900">{userData?.phone || "-"}</span>
          </div>
          <div className="flex justify-between px-4 py-2 text-sm">
            <span className="text-slate-500">Point</span>
            <span className="text-slate-900">{userData?.point || 0}</span>
          </div>
          <div className="flex justify-between px-4 py-2 text-sm">
            <span className="text-slate-500">Account Created</span>
            <span className="text-slate-900">
              {userData?.createdAt ? userData.createdAt.split("T")[0] : "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
