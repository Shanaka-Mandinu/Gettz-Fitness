import axios from "axios";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DefaultAvatar from "../../assets/default-avatar.png";
import { Calendar, Clock, User, Activity } from "lucide-react";

export default function Dashboard() {
  const [loaded, setLoaded] = useState(false);
  const [userData, setUserData] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

 
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        setUserData(JSON.parse(userStr));
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }, []);

  // ✅ Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ✅ Fetch user attendance data
  const fetchUserAttendance = async (userId) => {
    setAttendanceLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/attendance/user/${userId}`,
        { headers: { Authorization: "Bearer " + token } }
      );
      setAttendanceData(response.data || []);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      // Fallback to empty array if API fails
      setAttendanceData([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fullName = useMemo(() => {
    if (!userData) return "User";
    return [userData.firstName, userData.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || "User";
  }, [userData]);

  const avatarSrc = useMemo(() => {
    if (!userData) return DefaultAvatar;

    if (
      userData?.avatar &&
      typeof userData.avatar === "string" &&
      userData.avatar.startsWith("http")
    )
      return userData.avatar;

    if (
      userData?.profilePicture &&
      typeof userData.profilePicture === "string" &&
      userData.profilePicture.startsWith("http")
    )
      return userData.profilePicture;

    if (
      userData?.profilePicture &&
      typeof userData.profilePicture === "string" &&
      userData.profilePicture !== "default-profile.jpg" &&
      userData.profilePicture.trim() !== ""
    )
      return userData.profilePicture;

    if (
      userData?.avatar &&
      typeof userData.avatar === "string" &&
      userData.avatar !== "default-profile.jpg" &&
      userData.avatar.trim() !== ""
    )
      return userData.avatar;

    return DefaultAvatar;
  }, [userData]);

 

  const recentAttendance = useMemo(() => {
    return attendanceData
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 5)
      .map(att => ({
        date: new Date(att.time).toLocaleDateString(),
        time: new Date(att.time).toLocaleTimeString(),
        status: "Present"
      }));
  }, [attendanceData]);

 
  useEffect(() => {
    if (!userData) return;

    if (userData.role !== "user" && userData.role !== "member") {
      navigate("/login");
      return;
    }

    if (!loaded) {
      setLoading(true);
      axios
        .get(import.meta.env.VITE_BACKEND_URL + "/api/user/getUser", {
          headers: { Authorization: "Bearer " + token },
        })
        .then((res) => {
          console.log("User data from API:", res.data);
          if (res.data?.user) {
            localStorage.setItem("user", JSON.stringify(res.data.user));
            setUserData(res.data.user);
            
            fetchUserAttendance(res.data.user._id);
          }
          setLoaded(true);
        })
        .catch((err) => {
          console.error("Error fetching user data:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [loaded, userData, navigate, token]);

  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {fullName}!
              </h1>
              <p className="text-gray-600">
                Here's your fitness journey overview
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center min-w-[200px]">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-sm font-medium text-gray-600">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex items-center justify-center">
                <Clock className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-lg font-bold text-gray-900">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour12: true, 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* User Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center">
                <div className="relative inline-block">
                  <img
                    src={avatarSrc}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-red-500 shadow-lg"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
                  {fullName}
                </h2>
                <p className="text-gray-600 mb-4">{userData?.email || "-"}</p>
                <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-semibold mb-4">
                  <User className="h-4 w-4 mr-2" />
                  {userData?.membership || "Premium Member"}
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Member Since:</span>
                    <span className="font-medium">
                      {userData?.createdAt ? 
                        new Date(userData.createdAt).toLocaleDateString() : "-"}
                    </span>
                  </div>
                  {userData?.phone && (
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span className="font-medium">{userData.phone}</span>
                    </div>
                  )}
                  {userData?.height && userData?.weight && (
                    <div className="flex justify-between">
                      <span>BMI:</span>
                      <span className="font-medium">
                        {((userData.weight / (userData.height * userData.height)) * 10000).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Attendance Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8 h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Recent Attendance</h3>
                <div className="text-sm text-gray-600">
                  Last 5 visits
                </div>
              </div>
              
              {attendanceLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading attendance data...</p>
                </div>
              ) : recentAttendance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Time</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAttendance.map((attendance, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4 text-gray-900 font-medium">
                            {attendance.date}
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {attendance.time}
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              {attendance.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No attendance records yet</h4>
                  <p className="text-gray-600">Start your fitness journey by visiting the gym!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
