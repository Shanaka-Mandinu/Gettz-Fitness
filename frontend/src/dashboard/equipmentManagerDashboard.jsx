import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import EquipmentManagerSidebar from "../components/equipmentManagerSidebar.jsx";
import EquipmentDetailsPage from "../pages/eq_manager/equipment/eq_view.jsx";
import EquipmentAddPage from "../pages/eq_manager/equipment/eq_addForm.jsx";
import EquipmentEditPage from "../pages/eq_manager/equipment/eq_editForm.jsx";
import MaintenanceLogsPage from "../pages/eq_manager/maintenance/maintain_view.jsx";
import MaintenanceLogsAddPage from "../pages/eq_manager/maintenance/maintain_addForm.jsx";
import PurchaseListPage from "../pages/eq_manager/purchases/purchase_view.jsx";
import PurchaseAddPage from "../pages/eq_manager/purchases/purchase_addForm.jsx";
import PurchaseEditPage from "../pages/eq_manager/purchases/purchase_editForm.jsx";
import SupplementsViewPage from "../pages/eq_manager/supplement/supplement_view.jsx";
import SupplementAddForm from "../pages/eq_manager/supplement/supplement_addForm.jsx";
import SupplementEditPage from "../pages/eq_manager/supplement/supplement_editForm.jsx";
import EquipmentDashboard from "../pages/eq_manager/EquipmentDashboard.jsx";

export default function EquipmentManagerLayout() {
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex">
        {/* Sidebar with the requested nav items */}
        <EquipmentManagerSidebar />

        <main className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
            <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
              <h1 className="text-lg font-semibold">Equipment Manager Console</h1>
              <div className="text-sm text-gray-500">
                {JSON.parse(localStorage.getItem("user") || "{}")?.firstName || "Manager"}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="mx-auto max-w-7xl px-4 py-6">
            <Routes>
              {/* Index (Overview) */}
              <Route index element={<EquipmentDashboard/>} />

              {/* Matches the nav items */}
              <Route path="equipment" element={<EquipmentDetailsPage />} />
              <Route path="equipment/add" element={<EquipmentAddPage />} />
              <Route path="equipment/edit/:code" element={<EquipmentEditPage />} />
              <Route path="supplements" element={<SupplementsViewPage />} />
              <Route path="supplements/add" element={<SupplementAddForm />} />
              <Route path="supplements/edit/:code" element={<SupplementEditPage />} />
              <Route path="maintenance" element={<MaintenanceLogsPage />} />
              <Route path="maintenance/add" element={<MaintenanceLogsAddPage />} />
              <Route path="purchases" element={<PurchaseListPage />} />
              <Route path="purchases/add" element={<PurchaseAddPage />} />
              <Route path="purchases/edit/:code" element={<PurchaseEditPage />} />
              

              {/* fallback */}
              <Route path="*" element={<Navigate to="." replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
