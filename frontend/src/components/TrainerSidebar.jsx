import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Dumbbell, CalendarClock, Video,
  Wrench, Pill, BadgePercent, Settings, Menu, HandPlatter, ArrowDownToDot, Trophy,
  LogOut
} from "lucide-react";
import GymLogo from "../assets/GymLogo.jpg";
import Swal from "sweetalert2";

const linkBase =
  "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all";
const activeStyle =
  "text-white bg-gradient-to-r from-red-600 via-red-500 to-black shadow-lg shadow-red-200";
const idleStyle =
  "text-gray-700 hover:text-red-600 hover:bg-gray-100";

const navItems = [
  { to: "/trainerDashboard/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/trainerDashboard/reqMeals", label: "User Requests", icon: HandPlatter  },
  { to: "/trainerDashboard/challenges", label: "Challenges", icon: Trophy },

];

export default function TrainerSidebar() {
  const [open, setOpen] = useState(true);
  const navigate=useNavigate()
   function logout() {
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
          navigate("/admin");
        }
      });
    }

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
            <span className="text-base font-bold text-red-600">Gettz Trainer</span>
          )}
        </div>
        <button
          onClick={() => setOpen((s) => !s)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <nav className="px-2 pt-2 space-y-1">
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
      </nav>
      <div className="px-3 space-y-3">
        {/* Logout */}
        <button
          className={`mb-10 flex items-center gap-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg px-4 py-2 shadow-sm transition-colors ${
            open ? "justify-start" : "justify-center"
          }`}
          title={!open ? "Logout" : undefined}
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          {open && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
