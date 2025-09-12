// stores/profileStore.ts
import { create } from 'zustand';
import { fetchWithCredentials, handleApiResponse } from '@/utils/fetchWithCredentials';
import toast from 'react-hot-toast';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  createdAt: string;
}

export interface ProfileFormData {
  name: string;
  phone: string;
}

interface ProfileState {
  // State
  user: User | null;
  loading: boolean;
  editing: boolean;
  uploadingImage: boolean;
  form: ProfileFormData;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setEditing: (editing: boolean) => void;
  setUploadingImage: (uploading: boolean) => void;
  updateForm: (form: Partial<ProfileFormData>) => void;
  resetForm: () => void;

  // API Actions
  initializeProfile: () => Promise<boolean>;
  initializeForm: (user: User) => void;
  cancelEdit: () => void;
  updateProfile: () => Promise<boolean>;
  uploadProfileImage: (file: File) => Promise<boolean>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  // Initial state
  user: null,
  loading: false,
  editing: false,
  uploadingImage: false,
  form: { name: '', phone: '' },

  // Basic setters
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setEditing: (editing) => set({ editing }),
  setUploadingImage: (uploadingImage) => set({ uploadingImage }),

  updateForm: (formUpdate) =>
    set((state) => ({
      form: { ...state.form, ...formUpdate },
    })),

  resetForm: () =>
    set((state) => ({
      form: {
        name: state.user?.name || '',
        phone: state.user?.phone || '',
      },
    })),

  initializeForm: (user) =>
    set({
      user,
      form: {
        name: user.name || '',
        phone: user.phone || '',
      },
    }),

  cancelEdit: () => {
    const { user } = get();
    set({
      editing: false,
      form: {
        name: user?.name || '',
        phone: user?.phone || '',
      },
    });
  },

  // ✅ New Initialization action
  initializeProfile: async () => {
    set({ loading: true });

    try {
      const res = await fetchWithCredentials('/api/user/profile', {
        method: 'GET',
      });

      if (!res.ok) {
        const errorData = await handleApiResponse(res);
        throw new Error(errorData?.message || 'Failed to fetch profile');
      }

      const user = await handleApiResponse(res);
      set({
        user,
        form: {
          name: user.name || '',
          phone: user.phone || '',
        },
      });

      return true;
    } catch (error) {
      console.error('Profile initialization error:', error);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ✅ Profile Update action
  updateProfile: async () => {
    const { form, user } = get();
    if (!user) {
      toast.error('User not found');
      return false;
    }

    set({ loading: true });

    try {
      const res = await fetchWithCredentials('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errorData = await handleApiResponse(res);
        throw new Error(errorData?.message || 'Failed to update profile');
      }

      const updatedUser = await handleApiResponse(res);
      set({ user: updatedUser, editing: false });
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ✅ Profile Image Upload action
  uploadProfileImage: async (file: File) => {
    const { user } = get();
    if (!user) {
      return false;
    }

    if (!file.type.startsWith('image/')) {
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return false;
    }

    set({ uploadingImage: true });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetchWithCredentials('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Failed to upload image');

      const uploadData = await handleApiResponse(uploadRes);

      const profileRes = await fetchWithCredentials('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...user,
          photoURL: uploadData.url,
        }),
      });

      if (!profileRes.ok) {
        const errorData = await handleApiResponse(profileRes);
        throw new Error(errorData?.message || 'Failed to update profile image');
      }

      const updatedUser = await handleApiResponse(profileRes);
      set({ user: updatedUser });
      toast.success('Profile image updated successfully');
      return true;
    } catch (error) {
      console.error('Image upload error:', error);
      return false;
    } finally {
      set({ uploadingImage: false });
    }
  },
}));
