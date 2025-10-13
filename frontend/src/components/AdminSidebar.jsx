import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Video,
  BadgePercent,
  Settings,
  Menu,
  Radio,
  LogOut,
  IdCardLanyard,
  Megaphone,
  Trophy,
  MessageSquareDot,
  DollarSign,
} from "lucide-react";
import GymLogo from "../assets/GymLogo.jpg";
import Swal from "sweetalert2";

const linkBase =
  "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all";
const activeStyle =
  "text-white bg-gradient-to-r from-red-600 via-red-500 to-black shadow-lg shadow-red-200";
const idleStyle = "text-gray-700 hover:text-red-600 hover:bg-gray-100";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/members", label: "Members", icon: Users },
  { to: "/admin/trainers", label: "Trainers", icon: Dumbbell },
  { to: "/admin/video", label: "Video", icon: Video },
  { to: "/admin/membership", label: "Membership", icon: BadgePercent },
  { to: "/admin/payment", label: "Payment", icon: DollarSign },
  { to: "/admin/workshift", label: "Employees", icon: IdCardLanyard },
  { to: "/admin/inquiry", label: "Inquiry", icon: MessageSquareDot },
  { to: "/admin/competitions", label: "Competitions", icon: Trophy },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

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

        navigate("/adminLog");
      }
    });
  };

  return (
    <aside
      className={`${
        open ? "w-64" : "w-16"
      } sticky top-0 h-screen shrink-0 border-r bg-white transition-all`}
    >
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          <img src={GymLogo} alt="Gettz" className="h-9 w-9 rounded-full" />
          {open && (
            <span className="text-base font-bold text-red-600">
              Gettz Admin
            </span>
          )}
        </div>
        <button
          onClick={() => setOpen((s) => !s)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <nav className="px-2 pt-2 space-y-1 flex flex-col h-[calc(100%-64px)]">
        <div className="flex-1 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? activeStyle : idleStyle}`
              }
            >
              <Icon className="h-4 w-4" />
              {open && <span>{label}</span>}
            </NavLink>
          ))}
        </div>

        <div className="px-3 space-y-3">
                <button
                  className={`mb-10 flex items-center gap-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg px-4 py-2 shadow-sm transition-colors ${
                    open ? "justify-start" : "justify-center"
                  }`}
                  title={!open ? "Logout" : undefined}
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  {open && <span>Logout</span>}
                </button>
              </div>
      </nav>
    </aside>
  );
}
