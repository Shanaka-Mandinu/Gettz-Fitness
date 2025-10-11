import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Home, 
  ArrowLeft, 
  Search, 
  Dumbbell,
  AlertCircle,
  RefreshCw
} from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Animated 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="relative">
            <h1 className="text-9xl md:text-[12rem] font-black text-red-600 opacity-20">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="text-red-600"
              >
                <Dumbbell className="h-16 w-16 md:h-20 md:w-20" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
              Page Not Found
            </h2>
          </div>
          <p className="text-slate-600 text-lg mb-2">
            Oops! The page you're looking for doesn't exist.
          </p>
          <p className="text-slate-500">
            It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-red-600 text-red-600 rounded-xl font-semibold hover:bg-red-600 hover:text-white transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </button>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-slate-100 transition-all duration-300"
          >
            <RefreshCw className="h-5 w-5" />
            Refresh
          </button>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Popular Pages
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              to="/"
              className="flex flex-col items-center p-3 rounded-lg hover:bg-red-50 transition-colors duration-200 group"
            >
              <Home className="h-6 w-6 text-red-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-slate-700">Home</span>
            </Link>
            
            <Link
              to="/community"
              className="flex flex-col items-center p-3 rounded-lg hover:bg-red-50 transition-colors duration-200 group"
            >
              <Search className="h-6 w-6 text-red-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-slate-700">Community</span>
            </Link>
            
            <Link
              to="/videos"
              className="flex flex-col items-center p-3 rounded-lg hover:bg-red-50 transition-colors duration-200 group"
            >
              <Dumbbell className="h-6 w-6 text-red-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-slate-700">Videos</span>
            </Link>
            
            <Link
              to="/leaderboard"
              className="flex flex-col items-center p-3 rounded-lg hover:bg-red-50 transition-colors duration-200 group"
            >
              <Dumbbell className="h-6 w-6 text-red-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-slate-700">Leaderboard</span>
            </Link>
          </div>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 text-sm text-slate-500"
        >
          <p>
            If you believe this is an error, please{" "}
            <Link to="/contact" className="text-red-600 hover:underline">
              contact our support team
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
