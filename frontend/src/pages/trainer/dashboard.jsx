import React from "react";
import { 
  User, 
  Mail, 
  Phone, 
  Award, 
  Star, 
  Calendar, 
  Target, 
  Activity,
  Clock,
  Users,
  Shield,
  MessageSquare,
  FileText,
  Trophy
} from "lucide-react";

export default function Dashboard() {
  // Hardcoded trainer data
  const trainerData = {
    name: "John Smith",
    trainerId: "Trainer12345",
    email: "john.smith@getzzfitness.com",
    phoneNumber: "+1 (555) 123-4567",
    profilePicture: null,
    role: "trainer",
    certifications: ["Certified Personal Trainer", "Nutrition Specialist", "Yoga Instructor"],
    experienceYears: 8,
    specialization: "Weight Loss",
    rating: 4.8,
    reviews: [
      { member: "user1", comment: "Great trainer!", rating: 5 },
      { member: "user2", comment: "Very helpful", rating: 4 },
      { member: "user3", comment: "Excellent guidance", rating: 5 }
    ],
    isActive: true,
    isDisabled: false,
    createdAt: "2023-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z",
    lastLogin: "2024-01-20T10:30:00.000Z"
  };

  // Hardcoded stats
  const stats = {
    totalMembers: 45,
    activeMealPlans: 23,
    averageRating: 4.8
  };

  // New stats for left section
  const leftSectionStats = {
    currentRequests: 12,
    createdMealTemplates: 8,
    approvedChallenges: 15
  };


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trainer Dashboard</h1>
        <p className="text-gray-600">Welcome back, {trainerData.name}!</p>
      </div>

      {/* Main Content - Side by Side Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Trainer Profile Card - Takes 2/3 width on large screens */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-h-[500px]">
            <div className="flex flex-col lg:flex-row h-full">
              {/* Left Section - Profile Image and Basic Info */}
              <div className="lg:w-1/3 bg-gradient-to-br from-red-50 to-red-100 p-6 flex flex-col items-center justify-center min-h-[500px]">
                <div className="relative mb-4">
                  {trainerData.profilePicture ? (
                    <img
                      src={`${import.meta.env.VITE_BACKEND_URL}/${trainerData.profilePicture}`}
                      alt={trainerData.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-red-600 flex items-center justify-center border-4 border-white shadow-lg">
                      <User className="w-16 h-16 text-white" />
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{trainerData.name}</h2>
                <p className="text-red-600 font-semibold mb-2">ID: {trainerData.trainerId}</p>

                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  trainerData.isActive && !trainerData.isDisabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {trainerData.isActive && !trainerData.isDisabled ? 'Active' : 'Inactive'}
                </div>
              </div>

              {/* Right Section - Detailed Information */}
              <div className="lg:w-2/3 p-6 flex flex-col justify-center min-h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-red-600" />
                      Contact Information
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">{trainerData.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium text-gray-900">{trainerData.phoneNumber || "Not provided"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Member Since</p>
                          <p className="font-medium text-gray-900">
                            {new Date(trainerData.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Award className="w-5 h-5 text-red-600" />
                      Professional Details
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Specialization</p>
                          <p className="font-medium text-gray-900">{trainerData.specialization}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Experience</p>
                          <p className="font-medium text-gray-900">
                            {trainerData.experienceYears} years
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Certifications</p>
                          <p className="font-medium text-gray-900">
                            {trainerData.certifications?.length > 0 
                              ? trainerData.certifications.join(", ")
                              : "No certifications listed"
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certifications List */}
                {trainerData.certifications?.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {trainerData.certifications.map((cert, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Takes 1/3 width on large screens */}
        <div className="xl:col-span-1 flex flex-col h-full min-h-[500px]">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 flex-1 min-h-[150px]">
            <div className="flex items-center justify-between h-full">
              <div>
                <p className="text-sm font-medium text-gray-500">Current User Requests</p>
                <p className="text-2xl font-bold text-gray-900">{leftSectionStats.currentRequests}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 flex-1 mt-6 min-h-[150px]">
            <div className="flex items-center justify-between h-full">
              <div>
                <p className="text-sm font-medium text-gray-500">Created Meal Templates</p>
                <p className="text-2xl font-bold text-gray-900">{leftSectionStats.createdMealTemplates}</p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 flex-1 mt-6 min-h-[150px]">
            <div className="flex items-center justify-between h-full">
              <div>
                <p className="text-sm font-medium text-gray-500">Approved Challenges</p>
                <p className="text-2xl font-bold text-gray-900">{leftSectionStats.approvedChallenges}</p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}


