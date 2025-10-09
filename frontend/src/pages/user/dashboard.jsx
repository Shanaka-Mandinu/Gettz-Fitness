import axios from "axios";
import { Phone, Mail, MessageSquare, Medal } from "lucide-react";
import { useEffect, useState } from "react";
import Profilepic from "../../assets/default-avatar.png";
import { useNavigate } from "react-router-dom";
export default function Dashboard() {
  const [loaded, setLoaded] = useState(false);
  const userData = JSON.parse(localStorage.getItem("user"));
  const fullName = userData.firstName + " " + userData.lastName;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  console.log(userData);

  console.log(userData);
  useEffect(() => {
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
          console.log(res.data); // actual user object is usually inside res.data
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [loaded]);
  return (
    <div className="w-full min-h-[675px] flex items-center justify-center">
      <div className="max-w-sm mx-auto bg-white rounded-2xl border border-red-300 shadow-sm p-6">
        {/* Avatar + Score */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src={Profilepic}
              alt="User avatar"
              className="h-24 w-24 rounded-full object-cover ring-8 ring-slate-100"
            />
            <div className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-white shadow ring-1 ring-slate-200">
              <div className="h-7 w-7 flex items-center justify-center rounded-full border-2 border-green-200 bg-green-500 text-emerald-700 text-sm font-semibold"></div>
            </div>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            {fullName}
          </h2>
          <p className="text-sm text-slate-500">{userData.role}</p>
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
            <span className="text-slate-900">{userData.email}</span>
          </div>
          <div className="flex justify-between px-4 py-2 text-sm">
            <span className="text-slate-500">Phone</span>
            <span className="text-slate-900">{userData.phone}</span>
          </div>
          <div className="flex justify-between px-4 py-2 text-sm">
            <span className="text-slate-500">Point</span>
            <span className="text-slate-900">{userData.point}</span>
          </div>
          <div className="flex justify-between px-4 py-2 text-sm">
            <span className="text-slate-500">Account Created</span>
            <span className="text-slate-900">
              {userData.createdAt.split("T")[0]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
