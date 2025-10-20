import Header from "../components/header";
import HomeFooter from "../components/homeFooter";
import PaymentCard from "./client/payment/paymentCard";
import ViewSavedCards from "./client/payment/savedCards";
import GymLandingPage from "../components/homePage";
import { Route, Routes } from "react-router-dom";
import MembershipPlan from "./client/membershipPlan";
import AboutUs from "./aboutUs";
import ContactUs from "./contactUs";
import ChatBot from "../components/ChatBot/chatBot";
import VideoPortal from "./client/VideoPortal";
import VideoDetails from "./client/VideoDetails";
import PaymentSuccess from "../pages/client/payment/paymentSuccess";
import PaymentFailed from "./client/payment/paymentFailed";
import MealPlan from "./mealPlan";import SupplementStore from "./eq_manager/supplement_store/store_view";
import { CartProvider } from "./eq_manager/supplement_store/supplement_cart";
import SupplementCart from "./eq_manager/supplement_store/supplement_cart";
import SupplementCheckout from "./eq_manager/supplement_store/supplement_checkout";
import SupplementSavedCards from "./eq_manager/supplement_store/supplement_saved_cards";
import SupplementPaymentSuccess from "./eq_manager/supplement_store/supplement_paymentSuccess";
import SupplementPaymentFailed from "./eq_manager/supplement_store/supplement_paymentFailed";
import ChallengePage from "./client/challengesPage";
import NotFound from "../pages/NotFound";
import { useEffect, useState } from "react";
export default function Homepage() {

  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(
    () => {
      // Check if user is logged in
      const checkAuthStatus = () => {
        const token = localStorage.getItem("token")
        const user = localStorage.getItem("user")
        setIsLoggedIn(user && token ? true : false);
      }

      checkAuthStatus()

       // Listen for custom auth change events (same tab)
      const handleAuthChange = (e) => {
        if(e.detail && typeof e.detail.isLoggedIn !== 'undefined'){
          setIsLoggedIn(e.detail.isLoggedIn)
        }else{
          // Fallback: check localStorage
          checkAuthStatus();
        }
      }

      // Listen for storage changes (when user logs in/out in another tab)
      const handleStorageChange = (e) => {
        if (e.key === 'token' || e.key === 'user'){
          checkAuthStatus()
        }
      }

      window.addEventListener('storage', handleStorageChange)

      /// Also listen for custom events if you trigger them on login/logout
      window.addEventListener('authChange', checkAuthStatus)

      return () => {
        window.removeEventListener('storage', handleStorageChange)
        window.removeEventListener('authChange', checkAuthStatus)
      }

    }, []
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-gray-900 to-gray-800 flex flex-col">
      <Header />
      <CartProvider>
      <div className="flex-1 w-full pt-16 h-screen">
        <Routes>
          <Route path="/" element={<GymLandingPage />} />
          <Route path="/membership" element={<MembershipPlan />} />
          <Route path="/membership/savedCards" element={<ViewSavedCards />} />
          <Route path="/membership/card" element={<PaymentCard />} />
          <Route path="/aboutUs" element={<AboutUs />} />
          <Route path="/contactUs" element={<ContactUs />} />
          
          <Route path="/store" element={<SupplementStore />} />
          <Route path="/cart" element={<SupplementCart />} /*fixed*//>
          <Route path="/supplement/checkout" element={<SupplementCheckout />} />
          <Route path="/supplement/savedCards" element={<SupplementSavedCards />} />
          <Route path="/supplement/paymentSuccess" element={<SupplementPaymentSuccess />} />
          <Route path="/supplement/paymentFailed" element={<SupplementPaymentFailed />} />


          <Route path="/videos" element={<VideoPortal />} />
          <Route path="/videos/:videoId" element={<VideoDetails />} />
          <Route path="/membership/paymentSuccess" element={<PaymentSuccess/>} />        
          <Route path="/membership/paymentFailed" element={<PaymentFailed/>} />
          <Route path="/mealPlan" element={<MealPlan />} />
          <Route path="/challenges" element={<ChallengePage/>} />
          <Route
            path="/*"
            element={<NotFound />} />
        </Routes>
      </div>
      </CartProvider>
      {
        isLoggedIn && <ChatBot />
      }
      <HomeFooter />
    </div>
  );
}
