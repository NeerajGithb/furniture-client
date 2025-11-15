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
  user: User | null;
  loading: boolean;
  editing: boolean;
  uploadingImage: boolean;
  form: ProfileFormData;
  error: string | null;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setEditing: (editing: boolean) => void;
  setUploadingImage: (uploading: boolean) => void;
  setError: (error: string | null) => void;
  updateForm: (form: Partial<ProfileFormData>) => void;
  resetForm: () => void;

  initializeProfile: () => Promise<{ success: boolean; user?: User }>;
  initializeForm: (user: User) => void;
  cancelEdit: () => void;
  updateProfile: () => Promise<{ success: boolean; user?: User }>;
  uploadProfileImage: (file: File) => Promise<{ success: boolean; user?: User }>;
  uploadChatImage: (file: File) => Promise<{ success: boolean; url?: string }>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  user: null,
  loading: false,
  editing: false,
  uploadingImage: false,
  form: { name: '', phone: '' },
  error: null,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setEditing: (editing) => set({ editing }),
  setUploadingImage: (uploadingImage) => set({ uploadingImage }),
  setError: (error) => set({ error }),

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

  initializeProfile: async () => {
    set({ loading: true, error: null });

    try {
      const res = await fetchWithCredentials('/api/user/profile', { method: 'GET' });
      if (!res.ok) {
        const errorData = await handleApiResponse(res);
        throw new Error(errorData?.message || 'Failed to fetch profile');
      }
      const user = await handleApiResponse(res);
      set({
        user,
        form: { name: user.name || '', phone: user.phone || '' },
      });
      return { success: true, user };
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch profile' });
      return { success: false };
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async () => {
    const { form, user } = get();
    if (!user) {
      set({ error: 'User not found' });
      return { success: false };
    }

    set({ loading: true, error: null });

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
      set({
        user: updatedUser,
        editing: false,
        form: {
          name: updatedUser.name || '',
          phone: updatedUser.phone || '',
        },
      });
      toast.success('Profile updated successfully');
      return { success: true, user: updatedUser };
    } catch (error: any) {
      set({ error: error.message || 'Failed to update profile' });
      return { success: false };
    } finally {
      set({ loading: false });
    }
  },

  uploadProfileImage: async (file: File) => {
    const { user } = get();
    if (!user) {
      set({ error: 'User not found' });
      return { success: false };
    }

    if (!file) {
      set({ error: 'No file selected' });
      return { success: false };
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      set({ error: `Invalid file type: ${file.type}. Please use JPG, PNG, GIF, or WebP.` });
      return { success: false };
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      set({
        error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 5MB.`,
      });
      return { success: false };
    }

    set({ uploadingImage: true, error: null });

    try {
      const reader = new FileReader();
      const fileResult = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (reader.result) resolve(reader.result as string);
          else reject(new Error('Failed to read file'));
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const uploadRes = await fetchWithCredentials('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: fileResult, folder: 'profile-images' }),
      });

      if (!uploadRes.ok) {
        const errorData = await handleApiResponse(uploadRes);
        throw new Error(errorData?.message || 'Failed to upload image');
      }

      const uploadData = await handleApiResponse(uploadRes);
      if (!uploadData.url) throw new Error('Invalid upload response');

      const updatedProfileRes = await fetchWithCredentials('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          phone: user.phone || '',
          photoURL: uploadData.url,
        }),
      });

      if (!updatedProfileRes.ok) {
        const errorData = await handleApiResponse(updatedProfileRes);
        throw new Error(errorData?.message || 'Failed to update profile image');
      }

      const updatedUser = await handleApiResponse(updatedProfileRes);
      set({
        user: updatedUser,
        form: {
          name: updatedUser.name || '',
          phone: updatedUser.phone || '',
        },
      });
      toast.success('Profile image updated successfully');
      return { success: true, user: updatedUser };
    } catch (error: any) {
      console.error('Profile image upload error:', error);
      set({ error: error.message || 'Failed to upload image' });
      return { success: false };
    } finally {
      set({ uploadingImage: false });
    }
  },

  uploadChatImage: async (file: File) => {
    if (!file) {
      set({ error: 'No file selected' });
      return { success: false };
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      const errorMsg = `Invalid file type: ${file.type}. Please use JPG, PNG, GIF, or WebP.`;
      set({ error: errorMsg });
      toast.error(errorMsg);
      return { success: false };
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const errorMsg = `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 5MB.`;
      set({ error: errorMsg });
      toast.error(errorMsg);
      return { success: false };
    }

    set({ uploadingImage: true, error: null });

    try {
      const reader = new FileReader();
      const fileResult = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (reader.result) resolve(reader.result as string);
          else reject(new Error('Failed to read file'));
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: fileResult, folder: 'chat-images' }),
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData?.message || 'Failed to upload image');
      }

      const uploadData = await uploadRes.json();
      if (!uploadData.url) throw new Error('Invalid upload response');

      toast.success('Image uploaded successfully');
      return { success: true, url: uploadData.url };
    } catch (error: any) {
      console.error('Chat image upload error:', error);
      const errorMsg = error.message || 'Failed to upload image';
      set({ error: errorMsg });
      toast.error(errorMsg);
      return { success: false };
    } finally {
      set({ uploadingImage: false });
    }
  },
}));