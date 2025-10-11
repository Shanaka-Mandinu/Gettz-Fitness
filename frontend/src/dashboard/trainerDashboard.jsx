import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import TrainerSidebar from "../components/TrainerSidebar.jsx";

import RequestedMeals from "../pages/trainer/requestedMeals.jsx";
import Dashboard from "../pages/trainer/dashboard.jsx";
import Challenges from "../pages/trainer/challenges.jsx";
import Profile from "../pages/trainer/profile.jsx";
import MealTemplate from "../pages/trainer/mealTemplate.jsx";
import AddMealTemplate from "../pages/trainer/addMealTemplate.jsx";
import EditMealTemplate from "../pages/trainer/editMealTemplate.jsx";
import AssignMealPlan from "../pages/trainer/assignMealPlan.jsx";

export default function TrainerLayout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex">
        <TrainerSidebar />

        <main className="flex-1 min-w-0">
          <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
            <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
              <h1 className="text-lg font-semibold">Trainer Console</h1>
              <div className="text-sm text-gray-500">
                <p>Trainer</p>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 py-6">
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />

                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/reqMeals" element={<RequestedMeals />} />
                      <Route path="/assign-meal-plan" element={<AssignMealPlan />} />
                      <Route path="/mealTemplate" element={<MealTemplate />} />
                      <Route path="/add-meal-template" element={<AddMealTemplate />} />
                      <Route path="/edit-meal-template/:id" element={<EditMealTemplate />} />
                      <Route path="/challenges" element={<Challenges />} />
                      <Route path="/profile" element={<Profile />} />

              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
