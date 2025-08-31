// stores/profileStore.ts
import { create } from 'zustand';
import { fetchWithCredentials } from '@/utils/fetchWithCredentials';
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
  updateProfile: () => Promise<boolean>;
  uploadProfileImage: (file: File) => Promise<boolean>;
  initializeForm: (user: User) => void;
  cancelEdit: () => void;
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

  // ✅ Optimized Profile Update
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
        const errorData = await res.json();
        throw new Error(errorData?.message || 'Failed to update profile');
      }

      const updatedUser = await res.json();
      set({ user: updatedUser, editing: false });
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ✅ Optimized Profile Image Upload
  uploadProfileImage: async (file: File) => {
    const { user } = get();
    if (!user) {
      toast.error('User not found');
      return false;
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return false;
    }

    set({ uploadingImage: true });

    try {
      // Upload to Cloudinary (or backend proxy)
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetchWithCredentials('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Failed to upload image');

      const uploadData = await uploadRes.json();

      // Update profile with new image URL
      const profileRes = await fetchWithCredentials('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...user,
          photoURL: uploadData.url,
        }),
      });

      if (!profileRes.ok) {
        const errorData = await profileRes.json();
        throw new Error(errorData?.message || 'Failed to update profile image');
      }

      const updatedUser = await profileRes.json();
      set({ user: updatedUser });
      toast.success('Profile image updated successfully');
      return true;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
      return false;
    } finally {
      set({ uploadingImage: false });
    }
  },
}));
