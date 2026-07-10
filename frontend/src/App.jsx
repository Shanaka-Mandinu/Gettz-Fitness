import { useEffect, useRef, useState } from "react";
import "./App.css";
import LoginPage from "./pages/loginPage";
import AdminLayout from "./pages/adminPage";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Testing from "./pages/testing";
import { Toaster } from "react-hot-toast";
import SignupPage from "./pages/Signup";
import Homepage from "./pages/homepage";
import AdminLoginForm from "./pages/admin/adminLogging";
import TestingCheckout from "./pages/testingCheckout";
import { GoogleOAuthProvider } from "@react-oauth/google";
import VideoPortal from "./pages/client/VideoPortal";
import VideoDetails from "./pages/client/VideoDetails";
import EquipmentManagerLayout from "./dashboard/equipmentManagerDashboard";
import TrainerLayout from "./dashboard/trainerDashboard";
import UserLayout from "./dashboard/userDashboard";
import CommunityFeed from './pages/client/communityPosts';
import ChallengesPage from './pages/client/challengesPage';
import AddNotification from './pages/AddNotification';
import Leaderboard from './pages/leaderboard';
import ChatBot from './components/ChatBot/chatBot';
import ReceiptPDF from "./pages/client/mySubscription/paymentReport";
import UserDashboard from "./dashboard/userDashboard";
import PredefinedMealTemplates from "./pages/predefinedMealTemplates";
import NotFound from "./pages/NotFound";
import { useAuthContext } from "@asgardeo/auth-react";

function AsgardeoSessionSync() {
  const { isAuthenticated, getAccessToken, getBasicUserInfo } = useAuthContext();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      if (!isAuthenticated) {
        hasSyncedRef.current = false;
        return;
      }

      if (hasSyncedRef.current) return;

      try {
        const [token, basicUserInfo] = await Promise.all([
          getAccessToken(),
          getBasicUserInfo(),
        ]);

        if (!active) return;

        const user = {
          name: "Member",
          email: basicUserInfo?.email || "",
          authProvider: "asgardeo",
        };

        localStorage.setItem("token", token);
        localStorage.setItem("asgardeo_access_token", token);
        localStorage.setItem("user", JSON.stringify(user));

        window.dispatchEvent(
          new CustomEvent("authChange", {
            detail: { isLoggedIn: true, provider: "asgardeo" },
          })
        );

        hasSyncedRef.current = true;
      } catch (error) {
        console.error("Failed to sync Asgardeo session", error);
      }
    };

    syncSession();

    return () => {
      active = false;
    };
  }, [isAuthenticated, getAccessToken, getBasicUserInfo]);

  return null;
}



function App() {
  const [count, setCount] = useState(0);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_LOGIN_CLIENT_ID}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <AsgardeoSessionSync />
        <Routes>
          <Route path="/admin/*" element={<AdminLayout />} />
          <Route path="/trainerDashboard/*" element={<TrainerLayout />} />
          <Route path="/userDashboard/*" element={<UserLayout />} />
            <Route path="/login" element={<LoginPage />} />
          <Route
            path="/checkout"
            element={<TestingCheckout></TestingCheckout>}
          />
          <Route path="/testing" element={<Testing />} />
          <Route path="/register" element={<SignupPage />} />
          <Route path="/adminLog" element={<AdminLoginForm />} />
          <Route path="/equip-manager/*" element={<EquipmentManagerLayout />} />
          <Route path="/community" element={<CommunityFeed/>}/>
          <Route path="/admin/notifications/new" element={<AddNotification />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/chatbot" element={<ChatBot />} />
          <Route path="/my" element={<testing></testing>} />
          <Route path="/eq_manager/*" element={<EquipmentManagerLayout />} />

          <Route path="/videos" element={<VideoPortal />} />
          <Route path="/videos/:videoId" element={<VideoDetails />} />
          <Route path="/meal-templates" element={<PredefinedMealTemplates />} />
          <Route path="/*" element={<Homepage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
