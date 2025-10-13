import React, { useState } from "react";
import { NavLink, useNavigate,Link } from "react-router-dom";
import {
  LayoutDashboard,
  HandPlatter,
  Menu,
  LogOut,
  CreditCard,
  FileText,
  ShoppingCart,
  ArrowDownToDot,
} from "lucide-react";
import GymLogo from "../assets/GymLogo.jpg";
import Swal from "sweetalert2";

const linkBase =
  "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all";
const activeStyle =
  "text-white bg-gradient-to-r from-red-600 via-red-500 to-black shadow-lg shadow-red-200/40";
const idleStyle =
  "text-gray-700 hover:text-red-600 hover:bg-white/70 backdrop-blur-sm";

const navItems = [
  {
    to: "/userDashboard/dashboard",
    label: "Profile",
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: "/userDashboard/inquiry",
    label: "Inquiry & Reply",
    icon: FileText,
  },
  {
    to: "/userDashboard/requestMeal",
    label: "Requested Meal Plans",
    icon: ArrowDownToDot,
  },
  {
    to: "/userDashboard/currentMeal",
    label: "Active Meal Plans",
    icon: HandPlatter,
  },
  {
    to: "/userDashboard/manageCards",
    label: "Credit Cards",
    icon: CreditCard,
  },
  {
    to: "/userDashboard/mysubscription",
    label: "My Subscription",
    icon: FileText,
  },
  {
    to: "/userDashboard/myOrders",
    label: "My Orders",
    icon: ShoppingCart,
  },
];

export default function UserSidebar() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
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
        navigate("/login");
      }
    });
  }
  return (
    <aside
      className={`${
        open ? "w-64" : "w-16"
      } sticky top-0 h-screen shrink-0 border-r bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.95),rgba(255,255,255,0.8))] backdrop-blur supports-[backdrop-filter]:bg-white/70 transition-all flex flex-col`}
    >
      {/* Brand / Toggle */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-red-400/5 to-transparent" />
        <div className="flex items-center justify-between px-3 py-3 relative">
          
           <Link to="/"><div className="flex items-center gap-2">
           
              <img
                src={GymLogo}
                alt="Gettz"
                className="h-9 w-9 rounded-full ring-2 ring-red-500/20 object-cover"
              />
            
            {open && (
              <span className="text-base font-extrabold tracking-tight text-red-700">
                Gettz User
              </span>
            )}
          </div></Link>
          <button
            onClick={() => setOpen((s) => !s)}
            className="rounded-lg p-2 text-gray-600 hover:bg-white/70"
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-2 pt-2 space-y-1 flex-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `${linkBase} ${isActive ? activeStyle : idleStyle} ${
                open ? "" : "justify-center"
              }`
            }
            title={!open ? label : undefined} // tooltip when collapsed
          >
            <span
              className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-red-500/0 group-[.active]:bg-red-500/90"
              aria-hidden
            />
            <Icon className="h-4 w-4" />
            {open && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section (card + logout) */}
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
