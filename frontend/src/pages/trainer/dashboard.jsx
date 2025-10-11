import React, { useState, useEffect } from "react";
import { HandPlatter, Trophy, Users, Clock, CheckCircle, AlertCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [mealRequests, setMealRequests] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMealRequests: 0,
    pendingMealRequests: 0,
    totalChallenges: 0,
    activeChallenges: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch meal requests
      const mealResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/mealRequest`,
        { headers }
      );
      const mealData = Array.isArray(mealResponse.data?.response) ? mealResponse.data.response : [];
      setMealRequests(mealData);

      // Fetch challenges
      const challengeResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/challenge`,
        { headers }
      );
      const challengeData = Array.isArray(challengeResponse.data) ? challengeResponse.data : [];
      setChallenges(challengeData);

      // Calculate stats
      const pendingMeals = mealData.filter(meal => !meal.isAssigned).length;
      const activeChallenges = challengeData.filter(challenge => challenge.isActive).length;

      setStats({
        totalMealRequests: mealData.length,
        pendingMealRequests: pendingMeals,
        totalChallenges: challengeData.length,
        activeChallenges: activeChallenges,
      });

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const recentMealRequests = mealRequests
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const recentChallenges = challenges
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">Overview of your trainer activities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Meal Requests Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Meal Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMealRequests}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <HandPlatter className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <AlertCircle className="h-4 w-4 text-orange-500 mr-1" />
            <span className="text-gray-600">{stats.pendingMealRequests} pending</span>
          </div>
        </div>

        {/* Challenges Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Challenges</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalChallenges}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-gray-600">{stats.activeChallenges} active</span>
          </div>
        </div>

        {/* Pending Requests Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingMealRequests}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Requires attention</span>
          </div>
        </div>

        {/* Active Challenges Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Challenges</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeChallenges}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Currently running</span>
          </div>
        </div>
      </div>

      {/* Recent Activities Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Recent Meal Requests */}
              {recentMealRequests.map((request, index) => (
                <tr key={`meal-${request._id || index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <HandPlatter className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm text-gray-900">Meal Request</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Request #{request.request_id || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.user_name || 'Unknown User'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      request.isAssigned 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {request.isAssigned ? 'Assigned' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}

              {/* Recent Challenges */}
              {recentChallenges.map((challenge, index) => (
                <tr key={`challenge-${challenge._id || index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm text-gray-900">Challenge</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {challenge.title || 'Untitled Challenge'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {challenge.participantCount || 0} participants
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      challenge.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {challenge.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {challenge.createdAt ? new Date(challenge.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}

              {/* Empty State */}
              {recentMealRequests.length === 0 && recentChallenges.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No recent activities found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


