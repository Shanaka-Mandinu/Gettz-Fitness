import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

import GymLogo from "../assets/GymLogo.jpg";
import DefaultAvatar from "../assets/default-avatar.png";
import NotificationBell from "./notificationBell/NotificationBell";
import Swal from "sweetalert2";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const userData = JSON.parse(localStorage.getItem("user"));
  const readUser = () => {
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      if (token && userStr) return JSON.parse(userStr);
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    setUser(readUser());
  }, [location.pathname]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "user" || e.key === "token") setUser(readUser());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Log Out!",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/");
      }
    });
  };

  const displayName = useMemo(() => {
    if (!user) return "Guest";
    if (user.firstName)
      return [user.firstName].filter(Boolean).join(" ").trim();
    if (user.name && typeof user.name === "string") return user.name;
    if (user.email && typeof user.email === "string")
      return user.email.split("@")[0];
    return "Member";
  }, [user]);


  const avatarSrc = useMemo(() => {
    // Check for valid HTTP URLs first
    if (
      user?.avatar &&
      typeof user.avatar === "string" &&
      user.avatar.startsWith("http")
    )
      return user.avatar;
    if (
      user?.profilePicture &&
      typeof user.profilePicture === "string" &&
      user.profilePicture.startsWith("http")
    )
      return user.profilePicture;
    
    // Check for other valid profile pictures (not default placeholder)
    if (
      user?.profilePicture &&
      typeof user.profilePicture === "string" &&
      user.profilePicture !== "default-profile.jpg" &&
      user.profilePicture.trim() !== ""
    )
      return user.profilePicture;
    if (
      user?.avatar &&
      typeof user.avatar === "string" &&
      user.avatar !== "default-profile.jpg" &&
      user.avatar.trim() !== ""
    )
      return user.avatar;
    
    // Fallback to default avatar
    return DefaultAvatar;
  }, [user]);

  // Centralized links (keeps desktop + mobile in sync)
  const navLinks = useMemo(
  () => [
    { to: "/", label: "Home" },
    { to: "/aboutUs", label: "About" },
    { to: "/membership", label: "Membership" },
    //{ to: "/trainers", label: "Trainers" },
    { to: "/videos", label: "Videos" },
    { to: "/contactUs", label: "Contact" },
    ...(user?.role === "member" ? [{ to: "/mealPlan", label: "Meals" }] : []),
    { to: "/store", label: "Store" },
    ...(userData ? [{ to: "/challenges", label: "Competitions" }] : [])
  ],
  [userData]
);

  // Consistent link style for active/inactive
  const linkClasses = ({ isActive }) =>
    [
      "relative px-4 py-2 rounded-lg text-sm font-semibold",
      "transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
      isActive
        ? "text-white shadow-lg shadow-orange-200 bg-red-700 "
        : "text-gray-700 hover:text-white hover:shadow-lg hover:shadow-orange-200 hover:bg-red-700",
    ].join(" ");

  const primaryBtn =
    "px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500";
  const ghostBtn =
    "px-4 py-2 text-gray-700 hover:text-red-600 underline-offset-2 hover:underline transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded";

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="mx-auto flex items-center justify-between px-6 py-3">
        {/* Logo / Brand */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src={GymLogo}
            alt="Gettz Fitness"
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="text-xl font-bold text-red-600">Gettz Fitness</span>
        </Link>

        {/* Center links (desktop) */}
        <div className="hidden md:flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClasses} end={l.to === "/"} >
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <img
                src={avatarSrc}
                alt={displayName || "User"}
                className="h-8 w-8 rounded-full object-cover border"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DefaultAvatar;
                }}
              />
              <Link to="/userDashboard" className={ghostBtn}>
                {displayName}
              </Link>
              <button onClick={handleLogout} className={primaryBtn}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className={primaryBtn}>
              Login
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="flex flex-col px-6 py-4 space-y-3">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={linkClasses}
                end={l.to === "/"} 
              >
                {l.label}
              </NavLink>
            ))}

            {user ? (
              <>
                <div className="flex items-center gap-3 pt-2">
                  <img
                    src={avatarSrc}
                    alt={displayName || "User"}
                    className="h-8 w-8 rounded-full object-cover border"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DefaultAvatar;
                    }}
                  />
                  <span className="font-medium text-gray-700">
                    {displayName}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className={primaryBtn}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className={primaryBtn}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
