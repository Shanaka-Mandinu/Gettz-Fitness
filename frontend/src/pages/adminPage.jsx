
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import MembershipPlans from "./admin/membershipPlans/membershipPlan";
import AddPlanForm from "./admin/membershipPlans/addPlan";
import UpdatePlanForm from "./admin/membershipPlans/updatePlan";
import Homepage from "./homepage";
import VideoDetailsPage from "../pages/admin/Feature Video/Video";
import VideoUpload from "../pages/admin/Feature Video/VideoUpload";
import EditVideo from "../pages/admin/Feature Video/Editvideo";
import Workshift from "../pages/admin/manageWorkshift"
import ViewTrainers from "../pages/admin/sideBarLinks/viewTrainers";
import TrainerRegistration from "../pages/admin/sideBarLinks/addTrainer";
import MemberRegistration from "../pages/admin/sideBarLinks/MemberRegistration";
import MemberList from "../pages/admin/sideBarLinks/MemberList";
import AdminDashboard from "../dashboard/adminDashboard"

import AnnouncementDetailsPage from "./admin/announcements/announcements";
import AnnouncementAdd from "./admin/announcements/addAnnouncements";
import EditAnnouncement from "./admin/announcements/updateAnnouncements";
import CompetitionDetailsPage from "./admin/competitions/competitions";
import AddCompetition from "./admin/competitions/addCompetition";
import UpdateCompetition from "./admin/competitions/updateCompetition";
import Inquiry from "./admin/sideBarLinks/Inquiry";
import AdminProfile from "../pages/admin/sideBarLinks/adminProfile";
import AdminPaymentPage from "./admin/payment/AdminPaymentPage";

export default function AdminLayout() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user?.role?.toLowerCase() !== "admin")
    return <Navigate to="/adminLog" replace />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex">
        <AdminSidebar />

        <main className="flex-1 min-w-0">
          <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
            <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
              <h1 className="text-lg font-semibold">Admin Console</h1>
              <div className="text-sm text-black">
                {JSON.parse(localStorage.getItem("user") || "{}")?.firstName || "Admin"}
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 py-6">
            <Routes>
              <Route index element={<AdminDashboard />} />

              <Route path="/members" element={<MemberList/>} />
              <Route path="/product" element={<h1>Product</h1>} />
              <Route path="/orders" element={<h1>Orders</h1>} />
              <Route path="/addProduct" element={<h1>Add Product</h1>} />
              <Route path="/editProduct" element={<h1>Edit Product</h1>} />
              <Route path="/trainers" element={<ViewTrainers/>} />
              <Route path="/sessions" element={<h1>Sessions</h1>} />
              <Route path="/equipment" element={<h1>Equipment</h1>} />
              <Route path="/supplement" element={<h1>Supplement</h1>} />

              <Route path="/membership" element={<MembershipPlans/>} />
              <Route path="/payment" element={<AdminPaymentPage />} />
              <Route path="/announcements" element={<AnnouncementDetailsPage />} />
              <Route path="/announcement/upload" element={<AnnouncementAdd />} />
              <Route path="/announcement/edit/:annId" element={<EditAnnouncement />} />
              <Route path="/competitions" element={<CompetitionDetailsPage />} />
              <Route path="/competition/add" element={<AddCompetition />} />
              <Route path="/competition/update/:compId" element={<UpdateCompetition />} />
              <Route path="/settings" element={<AdminProfile/>} />
              <Route path="/membership/addPlan" element={<AddPlanForm/>} />
              <Route path="/membership/updatePlan" element={<UpdatePlanForm/>} />

              <Route path="/video" element={<VideoDetailsPage />} />
              <Route path="/video/upload" element={<VideoUpload />} />
              <Route path="/video/edit/:videoId" element={<EditVideo />} />
              <Route path="/workshift" element={<Workshift/>} />
              <Route path="/trainers/register" element={<TrainerRegistration/>} />
              <Route path="/members/register" element={<MemberRegistration/>} />
              <Route path="/inquiry" element={<Inquiry/>} />              <Route path="/trainers/register" element={<TrainerRegistration/>} />
              <Route path="/members/register" element={<MemberRegistration/>} />

              
              <Route path="*" element={<Navigate to="." replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
