import { handleApiResponse } from '@/utils/fetchWithCredentials';
import { create } from 'zustand';

export interface Review {
  _id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment: string;
  images: { url: string; publicId: string }[];
  helpfulVotes: number;
  unhelpfulVotes: number;
  userVote: 'helpful' | 'unhelpful' | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    _id: string;
    name: string;
    photoURL?: string;
  };
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  breakdown: { [key: number]: number };
}

export interface ReviewFormData {
  rating: number;
  title: string;
  comment: string;
  images: { url: string; publicId: string }[];
}

export interface ReviewStore {
  reviews: Review[];
  loading: boolean;
  submitting: boolean;
  uploading: boolean;
  loadingMore: boolean;
  deleting: string | null;
  stats: ReviewStats;
  currentPage: number;
  hasMore: boolean;
  showReviewForm: boolean;
  formData: ReviewFormData;
  hoveredRating: number;
  currentFilter: string;
  userHasReviewed: boolean;
  currentUserId: string | null;

  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setUploading: (uploading: boolean) => void;
  setLoadingMore: (loadingMore: boolean) => void;
  setDeleting: (reviewId: string | null) => void;
  setShowReviewForm: (show: boolean) => void;
  setHoveredRating: (rating: number) => void;
  setFormData: (data: Partial<ReviewFormData>) => void;
  resetForm: () => void;
  setFilter: (filter: string) => void;
  setCurrentUserId: (userId: string | null) => void;

  fetchReviews: (productId: string, pageNum?: number, reset?: boolean) => Promise<void>;
  submitReview: (productId: string, userId: string) => Promise<any>;
  uploadImages: (files: FileList | File[]) => Promise<{ url: string; publicId: string }[]>;
  removeImage: (index: number) => void;
  voteHelpful: (reviewId: string, isHelpful?: boolean) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  reportReview: (reviewId: string) => Promise<any>;
  applyFilter: (productId: string, filter: string) => Promise<void>;
  loadMoreReviews: (productId: string) => Promise<void>;
  clearReviews: () => void;
  getFilteredCount: (rating: number | 'all') => number;
  canUserVote: (review: Review) => boolean;
  isUserReview: (review: Review) => boolean;
}

const defaultStats: ReviewStats = {
  totalReviews: 0,
  averageRating: 0,
  breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
};

const defaultFormData: ReviewFormData = {
  rating: 0,
  title: '',
  comment: '',
  images: [],
};

const parseErrorResponse = async (response: Response): Promise<string> => {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const errorData = await handleApiResponse(response);
      return errorData.error || errorData.message || 'An unexpected error occurred';
    } else {
      const text = await response.text();
      return text || `Request failed with status ${response.status}`;
    }
  } catch (parseError) {
    console.error('Error parsing error response:', parseError);
    return `Request failed with status ${response.status}`;
  }
};

const safeJsonParse = async (response: Response) => {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await handleApiResponse(response);
    } else {
      return { message: 'Operation completed successfully' };
    }
  } catch (parseError) {
    console.error('Error parsing JSON response:', parseError);
    return { message: 'Operation completed successfully' };
  }
};

const calculateAverageRating = (breakdown: { [key: number]: number }): number => {
  const total = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
  if (total === 0) return 0;

  const weightedSum = Object.entries(breakdown).reduce((sum, [rating, count]) => {
    return sum + parseInt(rating) * count;
  }, 0);

  return Number((weightedSum / total).toFixed(1));
};

const useReviewStore = create<ReviewStore>((set, get) => ({
  reviews: [],
  loading: false,
  submitting: false,
  uploading: false,
  loadingMore: false,
  deleting: null,
  stats: defaultStats,
  currentPage: 1,
  hasMore: true,
  showReviewForm: false,
  formData: defaultFormData,
  hoveredRating: 0,
  currentFilter: 'all',
  userHasReviewed: false,
  currentUserId: null,

  setLoading: (loading) => set({ loading }),
  setSubmitting: (submitting) => set({ submitting }),
  setUploading: (uploading) => set({ uploading }),
  setLoadingMore: (loadingMore) => set({ loadingMore }),
  setDeleting: (reviewId) => set({ deleting: reviewId }),
  setShowReviewForm: (show) => set({ showReviewForm: show }),
  setHoveredRating: (rating) => set({ hoveredRating: rating }),
  setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
  resetForm: () => set({ formData: { ...defaultFormData }, hoveredRating: 0 }),
  setFilter: (filter) => set({ currentFilter: filter, currentPage: 1 }),
  setCurrentUserId: (userId) => set({ currentUserId: userId }),

  canUserVote: (review: Review) => {
    const { currentUserId } = get();

    return !!currentUserId;
  },

  isUserReview: (review: Review) => {
    const { currentUserId } = get();
    return !!currentUserId && review.user?._id === currentUserId;
  },

  fetchReviews: async (productId, pageNum = 1, reset = true) => {
    const { currentFilter } = get();

    try {
      if (reset) {
        set({ loading: true, reviews: [], hasMore: true });
      } else {
        set({ loadingMore: true });
      }

      const params = new URLSearchParams({
        productId,
        page: pageNum.toString(),
        limit: '10',
        ...(currentFilter !== 'all' && { rating: currentFilter }),
      });

      const response = await fetch(`/api/reviews?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response);
        throw new Error(errorMessage);
      }

      const data = await safeJsonParse(response);

      set((state) => ({
        reviews: reset ? data.reviews || [] : [...state.reviews, ...(data.reviews || [])],
        stats: data.statistics || defaultStats,
        hasMore: data.pagination?.hasMore || false,
        currentPage: pageNum,
        userHasReviewed: data.userHasReviewed || false,
      }));
    } catch (error) {
      console.error('Fetch reviews error:', error);
      set({
        reviews: reset ? [] : get().reviews,
        stats: reset ? defaultStats : get().stats,
        hasMore: false,
      });
      throw error;
    } finally {
      set({ loading: false, loadingMore: false });
    }
  },

  submitReview: async (productId, userId) => {
    const { formData } = get();

    if (!userId) throw new Error('Please log in to submit a review');
    if (!formData.rating || formData.rating === 0) {
      throw new Error('Please select a rating');
    }
    if (!formData.comment.trim()) {
      throw new Error('Please provide a review comment');
    }
    if (formData.comment.trim().length < 10) {
      throw new Error('Review comment must be at least 10 characters long');
    }

    set({ submitting: true });

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          rating: formData.rating,
          title: formData.title.trim() || undefined,
          comment: formData.comment.trim(),
          images: formData.images,
        }),
      });

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response);
        throw new Error(errorMessage);
      }

      const data = await safeJsonParse(response);

      if (data.review) {
        const newBreakdown = { ...get().stats.breakdown };
        newBreakdown[data.review.rating] = (newBreakdown[data.review.rating] || 0) + 1;

        const newStats = {
          ...get().stats,
          totalReviews: get().stats.totalReviews + 1,
          breakdown: newBreakdown,
          averageRating: calculateAverageRating(newBreakdown),
        };

        set((state) => ({
          reviews: [data.review, ...state.reviews],
          showReviewForm: false,
          userHasReviewed: true,
          stats: newStats,
        }));
      }

      get().resetForm();

      try {
        await get().fetchReviews(productId, 1, true);
      } catch (refreshError) {
        console.error('Error refreshing reviews after submit:', refreshError);
      }

      return data;
    } catch (error) {
      console.error('Submit review error:', error);
      throw error;
    } finally {
      set({ submitting: false });
    }
  },

  uploadImages: async (files) => {
    if (!files || files.length === 0) {
      throw new Error('No files selected');
    }

    set({ uploading: true });

    try {
      const uploadPromises = Array.from(files).map(
        (file) =>
          new Promise<{ url: string; publicId: string }>((resolve, reject) => {
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
              reject(
                new Error(`Invalid file type: ${file.type}. Please use JPG, PNG, GIF, or WebP.`),
              );
              return;
            }

            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
              reject(
                new Error(
                  `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 5MB.`,
                ),
              );
              return;
            }

            const reader = new FileReader();

            reader.onload = async (e) => {
              try {
                const response = await fetch('/api/upload', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    image: e.target?.result,
                    folder: 'reviews',
                  }),
                });

                if (!response.ok) {
                  const errorMessage = await parseErrorResponse(response);
                  reject(new Error(errorMessage));
                  return;
                }

                const data = await safeJsonParse(response);
                if (!data.url || !data.publicId) {
                  reject(new Error('Invalid upload response'));
                  return;
                }
                resolve({ url: data.url, publicId: data.publicId });
              } catch (error) {
                reject(error);
              }
            };

            reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
            reader.readAsDataURL(file);
          }),
      );

      const uploadedImages = await Promise.all(uploadPromises);

      set((state) => ({
        formData: {
          ...state.formData,
          images: [...state.formData.images, ...uploadedImages],
        },
      }));

      return uploadedImages;
    } catch (error) {
      console.error('Upload images error:', error);
      throw error;
    } finally {
      set({ uploading: false });
    }
  },

  removeImage: (index) => {
    set((state) => {
      const newImages = [...state.formData.images];
      newImages.splice(index, 1);
      return {
        formData: {
          ...state.formData,
          images: newImages,
        },
      };
    });
  },

  voteHelpful: async (reviewId, isHelpful = true) => {
    const { currentUserId, reviews } = get();

    if (!currentUserId) {
      throw new Error('Please log in to vote on reviews');
    }

    const review = reviews.find((r) => r._id === reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    const originalHelpfulVotes = review.helpfulVotes || 0;
    const originalUnhelpfulVotes = review.unhelpfulVotes || 0;
    const originalUserVote = review.userVote;

    try {
      const action = isHelpful ? 'helpful' : 'unhelpful';
      const currentVote = review.userVote;

      let newHelpfulVotes = originalHelpfulVotes;
      let newUnhelpfulVotes = originalUnhelpfulVotes;
      let newUserVote: 'helpful' | 'unhelpful' | null = action;

      if (currentVote === action) {
        if (action === 'helpful') {
          newHelpfulVotes = Math.max(0, newHelpfulVotes - 1);
        } else {
          newUnhelpfulVotes = Math.max(0, newUnhelpfulVotes - 1);
        }
        newUserVote = null;
      } else if (currentVote && currentVote !== action) {
        if (currentVote === 'helpful') {
          newHelpfulVotes = Math.max(0, newHelpfulVotes - 1);
          newUnhelpfulVotes = newUnhelpfulVotes + 1;
        } else {
          newUnhelpfulVotes = Math.max(0, newUnhelpfulVotes - 1);
          newHelpfulVotes = newHelpfulVotes + 1;
        }
      } else {
        if (action === 'helpful') {
          newHelpfulVotes = newHelpfulVotes + 1;
        } else {
          newUnhelpfulVotes = newUnhelpfulVotes + 1;
        }
      }

      set((state) => ({
        reviews: state.reviews.map((r) =>
          r._id === reviewId
            ? {
                ...r,
                helpfulVotes: newHelpfulVotes,
                unhelpfulVotes: newUnhelpfulVotes,
                userVote: newUserVote,
              }
            : r,
        ),
      }));

      const response = await fetch('/api/reviews/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reviewId,
          action,
        }),
      });

      if (!response.ok) {
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r._id === reviewId
              ? {
                  ...r,
                  helpfulVotes: originalHelpfulVotes,
                  unhelpfulVotes: originalUnhelpfulVotes,
                  userVote: originalUserVote,
                }
              : r,
          ),
        }));

        const errorMessage = await parseErrorResponse(response);
        throw new Error(errorMessage);
      }

      const data = await safeJsonParse(response);

      if (
        data &&
        (typeof data.helpfulVotes === 'number' || typeof data.unhelpfulVotes === 'number')
      ) {
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r._id === reviewId
              ? {
                  ...r,
                  helpfulVotes:
                    typeof data.helpfulVotes === 'number' ? data.helpfulVotes : newHelpfulVotes,
                  unhelpfulVotes:
                    typeof data.unhelpfulVotes === 'number'
                      ? data.unhelpfulVotes
                      : newUnhelpfulVotes,
                  userVote: data.userVote !== undefined ? data.userVote : newUserVote,
                }
              : r,
          ),
        }));
      }
    } catch (error) {
      console.error('Vote error:', error);

      set((state) => ({
        reviews: state.reviews.map((r) =>
          r._id === reviewId
            ? {
                ...r,
                helpfulVotes: originalHelpfulVotes,
                unhelpfulVotes: originalUnhelpfulVotes,
                userVote: originalUserVote,
              }
            : r,
        ),
      }));

      throw error;
    }
  },

  deleteReview: async (reviewId) => {
    const { currentUserId, reviews } = get();

    const review = reviews.find((r) => r._id === reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    if (!currentUserId) {
      throw new Error('Please log in to delete reviews');
    }

    if (review.user?._id !== currentUserId) {
      throw new Error('You can only delete your own reviews');
    }

    set({ deleting: reviewId });

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response);
        throw new Error(errorMessage);
      }

      await safeJsonParse(response);

      const newBreakdown = { ...get().stats.breakdown };
      newBreakdown[review.rating] = Math.max(0, (newBreakdown[review.rating] || 0) - 1);

      const newStats = {
        ...get().stats,
        totalReviews: Math.max(0, get().stats.totalReviews - 1),
        breakdown: newBreakdown,
        averageRating: calculateAverageRating(newBreakdown),
      };

      set((state) => ({
        reviews: state.reviews.filter((r) => r._id !== reviewId),
        userHasReviewed: false,
        stats: newStats,
      }));

      try {
        await get().fetchReviews(review.productId, 1, true);
      } catch (refreshError) {
        console.error('Error refreshing reviews after delete:', refreshError);
      }
    } catch (error) {
      console.error('Delete review error:', error);
      throw error;
    } finally {
      set({ deleting: null });
    }
  },

  reportReview: async (reviewId) => {
    const { currentUserId } = get();

    if (!currentUserId) {
      throw new Error('Please log in to report reviews');
    }

    try {
      const response = await fetch('/api/reviews/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reviewId }),
      });

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response);
        throw new Error(errorMessage);
      }

      const data = await safeJsonParse(response);
      return data;
    } catch (error) {
      console.error('Report review error:', error);
      throw error;
    }
  },

  applyFilter: async (productId, filter) => {
    set({ currentFilter: filter, currentPage: 1 });
    try {
      await get().fetchReviews(productId, 1, true);
    } catch (error) {
      console.error('Apply filter error:', error);

      set({ currentFilter: 'all' });
      throw error;
    }
  },

  loadMoreReviews: async (productId) => {
    const { currentPage, hasMore, loadingMore } = get();

    if (!hasMore || loadingMore) return;

    try {
      await get().fetchReviews(productId, currentPage + 1, false);
    } catch (error) {
      console.error('Load more reviews error:', error);
      throw error;
    }
  },

  clearReviews: () =>
    set({
      reviews: [],
      stats: defaultStats,
      currentPage: 1,
      hasMore: true,
      currentFilter: 'all',
      userHasReviewed: false,
      showReviewForm: false,
      formData: { ...defaultFormData },
      hoveredRating: 0,
      deleting: null,
      loading: false,
      submitting: false,
      uploading: false,
      loadingMore: false,
    }),

  getFilteredCount: (rating) => {
    const { stats } = get();
    if (rating === 'all') {
      return stats.totalReviews;
    }
    return stats.breakdown[rating as number] || 0;
  },
}));

export default useReviewStore;
