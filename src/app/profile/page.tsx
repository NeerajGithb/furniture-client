'use client';

import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useProfileStore } from '@/stores/profileStore';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
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
  Shield,
} from 'lucide-react';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function ProfileOverview() {
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const { setUser: updateAuthUser } = useAuth();
  const [mounted, setMounted] = useState(false);

  const {
    user,
    loading,
    editing,
    uploadingImage,
    form,
    error,
    setEditing,
    updateForm,
    initializeForm,
    cancelEdit,
    updateProfile,
    uploadProfileImage,
    setError,
  } = useProfileStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && currentUser && !user) {
      initializeForm(currentUser);
    }
  }, [currentUser, mounted, initializeForm, user]);

  const formatMemberSinceDate = (dateString: string | null | undefined) => {
    if (!mounted || !dateString) return 'Date not available';

    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Date not available';
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;

    const result = await updateProfile();
    if (result.success) {
      // Don't pass result.user - let updateAuthUser fetch fresh data from API
      await updateAuthUser();
    }
  };

  const handleImageUpload = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await uploadProfileImage(file);
    if (result.success) {
      await updateAuthUser();
    }
  };

  if (!mounted || userLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-gray-600 mx-auto" />
          <p className="text-sm text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser && !userLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-600">Unable to load profile information</p>
        </div>
      </div>
    );
  }

  const displayUser = user || currentUser;
  if (!displayUser) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-gray-600 mx-auto" />
          <p className="text-sm text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your personal information</p>
        </div>
        {!editing && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xs hover:bg-gray-800 transition-all duration-200 text-sm font-medium w-fit"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </motion.button>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          <div className="flex flex-col items-center space-y-3 w-full lg:w-auto">
            <div className="relative group">
              {displayUser.photoURL ? (
                <img
                  src={displayUser.photoURL}
                  alt="Profile"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xs object-cover shadow-md"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-800 to-black rounded-xs flex items-center justify-center text-white text-lg font-medium shadow-md">
                  {(displayUser.name || '')
                    .split(' ')
                    .map((n: any) => n.charAt(0))
                    .join('')
                    .slice(0, 2)}
                </div>
              )}

              <label className="absolute -bottom-1 -right-1 bg-white text-gray-700 p-2 rounded-xs shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100 cursor-pointer">
                {uploadingImage ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Camera className="w-3 h-3" />
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
            <div className="flex items-center gap-2 text-xs text-green-600">
              <Shield className="w-3 h-3" />
              <span>Verified</span>
            </div>
          </div>

          <div className="flex-1 w-full min-w-0">
            {editing ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      value={form.name || ''}
                      onChange={(e) => updateForm({ name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xs focus:ring-2 focus:ring-black/10 focus:border-black outline-none transition-all duration-200 text-sm"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      value={form.phone || ''}
                      onChange={(e) => updateForm({ phone: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xs focus:ring-2 focus:ring-black/10 focus:border-black outline-none transition-all duration-200 text-sm"
                      placeholder="Enter your phone number"
                      type="tel"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={loading || !form.name?.trim()}
                    className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2.5 rounded-xs hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={cancelEdit}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xs hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {displayUser.name || 'No name provided'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-0.5">Member</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 py-2">
                    <Mail className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 uppercase tracking-wide">
                        Email Address
                      </p>
                      <p className="text-sm text-gray-700 mt-0.5 break-all">
                        {displayUser.email || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-2">
                    <Phone className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 uppercase tracking-wide">
                        Phone Number
                      </p>
                      <p className="text-sm text-gray-700 mt-0.5">
                        {displayUser.phone || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-2">
                    <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 uppercase tracking-wide">
                        Member Since
                      </p>
                      <p className="text-sm text-gray-700 mt-0.5">
                        {formatMemberSinceDate(displayUser.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-2">
                    <User className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 uppercase tracking-wide">
                        Account Status
                      </p>
                      <p className="text-sm text-green-600 font-medium mt-0.5">Active</p>
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
