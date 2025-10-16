import React, { useState, useEffect } from "react";
import { 
  User, Mail, Phone, MapPin, Calendar, Award, 
  Edit3, Save, X, Camera, Star, Clock, Users 
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import DefaultAvatar from "../../assets/default-avatar.png";

export default function TrainerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalSessions: 0,
    rating: 0,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Get current user data from localStorage first
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      
      // Fetch detailed trainer profile from API
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/trainer/profile`,
        { headers }
      );

      const profileData = response.data?.trainer || userData;
      setProfile(profileData);
      setEditForm(profileData);

      // Fetch trainer statistics
      await fetchTrainerStats();

    } catch (error) {
      console.error("Error fetching profile:", error);
      // Fallback to localStorage data
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setProfile(userData);
      setEditForm(userData);
      
      // Only show error toast if there's no localStorage data
      if (!userData.email) {
        toast.error("Failed to load profile data");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainerStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch trainer statistics from the new stats endpoint
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/trainer/stats`,
        { headers }
      );

      setStats(response.data?.stats || {
        totalClients: 0,
        activeClients: 0,
        totalSessions: 0,
        rating: profile?.rating || 4.5,
      });

    } catch (error) {
      console.error("Error fetching stats:", error);
      // Use default stats
      setStats({
        totalClients: 0,
        activeClients: 0,
        totalSessions: 0,
        rating: profile?.rating || 4.5,
      });
    }
  };



  const handleCancel = () => {
    setEditing(false);
    setEditForm(profile);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/trainer/profile`,
        editForm,
        { headers }
      );

      setProfile(response.data?.trainer || editForm);
      setEditing(false);
      toast.success("Profile updated successfully");

      // Update localStorage
      localStorage.setItem("user", JSON.stringify(response.data?.trainer || editForm));

    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getAvatarSrc = () => {
    if (profile?.profilePicture && profile.profilePicture.startsWith("http")) {
      return profile.profilePicture;
    }
    if (profile?.avatar && profile.avatar.startsWith("http")) {
      return profile.avatar;
    }
    return DefaultAvatar;
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
          <p className="text-gray-600">Manage your trainer profile information</p>
        </div>
        
      </div>

      {/* Profile Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            <div className="relative">
              <img
                src={getAvatarSrc()}
                alt="Profile"
                className="h-32 w-32 rounded-full object-cover border-4 border-gray-200"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DefaultAvatar;
                }}
              />
              {editing && (
                <button className="absolute bottom-0 right-0 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {profile?.name || profile?.firstName || "Trainer Name"}
              </h3>
              {editing && (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Email:</span>
                {editing ? (
                  <input
                    type="email"
                    value={editForm.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                ) : (
                  <span className="text-gray-900">{profile?.email || "N/A"}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Phone:</span>
                {editing ? (
                  <input
                    type="tel"
                    value={editForm.phoneNumber || ""}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                ) : (
                  <span className="text-gray-900">{profile?.phoneNumber || "N/A"}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Location:</span>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.location || ""}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                ) : (
                  <span className="text-gray-900">{profile?.location || "N/A"}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Joined:</span>
                <span className="text-gray-900">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Clients</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeClients}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <User className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalSessions}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rating</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.rating}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Professional Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              {editing ? (
                <input
                  type="text"
                  value={editForm.specialization || ""}
                  onChange={(e) => handleInputChange("specialization", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profile?.specialization || "General Fitness"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
              {editing ? (
                <input
                  type="number"
                  value={editForm.experienceYears || ""}
                  onChange={(e) => handleInputChange("experienceYears", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profile?.experienceYears || "0"} years</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
              {editing ? (
                <textarea
                  value={editForm.certifications || ""}
                  onChange={(e) => handleInputChange("certifications", e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="List your certifications..."
                />
              ) : (
                <p className="text-gray-900">{profile?.certifications || "No certifications listed"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              {editing ? (
                <textarea
                  value={editForm.bio || ""}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-900">{profile?.bio || "No bio available"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
              {editing ? (
                <input
                  type="text"
                  value={editForm.availability || ""}
                  onChange={(e) => handleInputChange("availability", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Monday-Friday 9AM-6PM"
                />
              ) : (
                <p className="text-gray-900">{profile?.availability || "Not specified"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                profile?.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {profile?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
