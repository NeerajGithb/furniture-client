// app/profile/page.tsx
"use client";

import { useEffect } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useProfileStore } from "@/stores/profileStore";
import { motion } from "framer-motion";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Loader2, 
  Edit3, 
  Camera,
  Check,
  X,
  Shield
} from "lucide-react";

export default function ProfileOverview() {
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  
  const {
    user,
    loading,
    editing,
    uploadingImage,
    form,
    setEditing,
    updateForm,
    initializeForm,
    cancelEdit,
    updateProfile,
    uploadProfileImage,
  } = useProfileStore();

  // Initialize form when user data is available
  useEffect(() => {
    if (currentUser) {
      initializeForm(currentUser);
    }
  }, [currentUser, initializeForm]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    await updateProfile();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadProfileImage(file);
  };

  if (userLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600 mx-auto" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your personal information</p>
        </div>
        {!editing && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xs hover:bg-gray-800 transition-all duration-200 text-sm font-medium"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </motion.button>
        )}
      </div>

      {/* Profile Section */}
      <div className="space-y-8">
        {/* Avatar and Basic Info */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-24 h-24 rounded-sm object-cover shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-black rounded-sm flex items-center justify-center text-white text-xl font-medium shadow-lg">
                  {(user.name || "").split(' ').map((n) => n.charAt(0)).join('').slice(0, 2)}
                </div>
              )}
              
              <label className="absolute -bottom-1 -right-1 bg-white text-gray-700 p-2 rounded-xs shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100 cursor-pointer">
                {uploadingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Shield className="w-4 h-4" />
              Verified
            </div>
          </div>

          {/* Profile Form/Display */}
          <div className="flex-1 w-full">
            {editing ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => updateForm({ name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xs focus:ring-2 focus:ring-black/10 focus:border-black outline-none transition-all duration-200"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      value={form.phone}
                      onChange={(e) => updateForm({ phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xs focus:ring-2 focus:ring-black/10 focus:border-black outline-none transition-all duration-200"
                      placeholder="Enter your phone number"
                      type="tel"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={loading || !form.name.trim()}
                    className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xs hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {loading ? "Saving..." : "Save Changes"}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={cancelEdit}
                    disabled={loading}
                    className="flex items-center gap-2 border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xs hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {user.name}
                  </h2>
                  <p className="text-gray-600">Member</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 py-3 border-b border-gray-100">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email Address</p>
                      <p className="text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 py-3 border-b border-gray-100">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone Number</p>
                      <p className="text-gray-600">{user.phone || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 py-3 border-b border-gray-100">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Member Since</p>
                      <p className="text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString("en-IN", {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 py-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Account Status</p>
                      <p className="text-green-600 font-medium">Active</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}