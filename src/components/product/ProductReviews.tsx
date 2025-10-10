import React, { useEffect, useRef, useState } from 'react';
import {
  Star,
  Camera,
  X,
  ThumbsUp,
  ThumbsDown,
  User,
  Calendar,
  Shield,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import useReviewStore from '@/stores/reviewStore';
import AuthModal from '../models/AuthModal';

interface ProductReviewsProps {
  productId: string;
  userId?: string;
}

const ReviewSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-sm p-4 space-y-3 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="flex items-center gap-1">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="w-3 h-3 bg-gray-200 rounded"></div>
            ))}
          <div className="h-3 bg-gray-200 rounded w-20 ml-2"></div>
        </div>
      </div>
      <div className="h-6 bg-gray-200 rounded w-12"></div>
    </div>
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>
    <div className="flex gap-4 pt-2">
      <div className="h-6 bg-gray-200 rounded w-16"></div>
      <div className="h-6 bg-gray-200 rounded w-16"></div>
    </div>
  </div>
);

const StatsSkeleton = () => (
  <div className="animate-pulse">
    <div className="space-y-3 mb-1">
      {[5, 4, 3, 2, 1].map((star) => (
        <div key={star} className="flex items-center gap-3">
          <div className="w-3 h-3 bg-gray-200 rounded"></div>
          <div className="w-3 h-3 bg-gray-200 rounded"></div>
          <div className="flex-1 bg-gray-200 rounded-full h-2"></div>
          <div className="w-12 h-3 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, userId }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const [votingStates, setVotingStates] = useState<
    Record<string, { helpful: boolean; unhelpful: boolean }>
  >({});

  const {
    reviews,
    loading,
    submitting,
    uploading,
    loadingMore,
    deleting,
    stats,
    currentPage,
    hasMore,
    showReviewForm,
    formData,
    hoveredRating,
    currentFilter,
    userHasReviewed,
    setShowReviewForm,
    setHoveredRating,
    setFormData,
    resetForm,
    fetchReviews,
    submitReview,
    uploadImages,
    removeImage,
    voteHelpful,
    deleteReview,
    applyFilter,
    loadMoreReviews,
    clearReviews,
    getFilteredCount,
    canUserVote,
    isUserReview,
    setCurrentUserId,
    reportReview,
  } = useReviewStore();

  const [openAuthModal, setOpenAuthModal] = useState(false);

  useEffect(() => {
    if (userId) {
      setCurrentUserId(userId);
    }
  }, [userId, setCurrentUserId]);

  useEffect(() => {
    if (productId) {
      fetchReviews(productId, 1, true).catch((error) => {
        console.error('Fetch reviews error:', error);
        setErrorMessage('Failed to load reviews. Please try refreshing the page.');
      });
    }
    return () => clearReviews();
  }, [productId]);

  useEffect(() => {
    if (successMessage || errorMessage || uploadSuccess) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
        setUploadSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage, uploadSuccess]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter((file) => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setErrorMessage('Please upload only JPG, PNG, GIF, or WebP images');
      e.target.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    const oversizedFiles = files.filter((file) => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setErrorMessage('Each image must be less than 5MB');
      e.target.value = '';
      return;
    }

    if (formData.images.length + files.length > 5) {
      setErrorMessage('Maximum 5 images allowed per review');
      e.target.value = '';
      return;
    }

    try {
      await uploadImages(files);
      setUploadSuccess(`${files.length} image(s) uploaded successfully`);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to upload images. Please try again.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmitReview = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!userId) {
      setErrorMessage('Please log in to submit a review');
      setOpenAuthModal(true);
      return;
    }

    if (!formData.rating || formData.rating === 0) {
      setErrorMessage('Please select a rating');
      return;
    }

    if (!formData.comment.trim()) {
      setErrorMessage('Please write a review comment');
      return;
    }

    if (formData.comment.trim().length < 10) {
      setErrorMessage('Review comment must be at least 10 characters long');
      return;
    }

    try {
      await submitReview(productId, userId);
      setSuccessMessage('Review submitted successfully!');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to submit review. Please try again.');
    }
  };

  const handleHelpfulVote = async (reviewId: string, isHelpful: boolean) => {
    if (!userId) {
      setErrorMessage('Please log in to vote on reviews');
      return;
    }

    const voteType = isHelpful ? 'helpful' : 'unhelpful';

    if (votingStates[reviewId]?.[voteType]) {
      return;
    }

    setVotingStates((prev) => ({
      ...prev,
      [reviewId]: {
        ...prev[reviewId],
        [voteType]: true,
      },
    }));

    try {
      await voteHelpful(reviewId, isHelpful);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to submit vote. Please try again.');
    } finally {
      setVotingStates((prev) => ({
        ...prev,
        [reviewId]: {
          ...prev[reviewId],
          [voteType]: false,
        },
      }));
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!userId) {
      setErrorMessage('Please log in to delete reviews');
      return;
    }

    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteReview(reviewId);
      setSuccessMessage('Review deleted successfully');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to delete review. Please try again.');
    }
  };

  const handleReportReview = async (reviewId: string) => {
    if (!userId) {
      setErrorMessage('Please log in to report reviews');
      return;
    }

    if (
      !confirm('Are you sure you want to report this review? This will flag it for moderation.')
    ) {
      return;
    }

    try {
      await reportReview(reviewId);
      setSuccessMessage('Review reported successfully. Our team will review it shortly.');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to report review. Please try again.');
    }
  };

  const handleFilterChange = async (filter: string) => {
    try {
      await applyFilter(productId, filter);
    } catch (error) {
      setErrorMessage('Failed to apply filter. Please try again.');
    }
  };

  const handleLoadMore = async () => {
    try {
      await loadMoreReviews(productId);
    } catch (error) {
      setErrorMessage('Failed to load more reviews. Please try again.');
    }
  };

  const renderStars = (rating: number, interactive = false, size = 'w-3 h-3') => {
    return Array.from({ length: 5 }, (_, i) => {
      if (interactive) {
        return (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHoveredRating(i + 1)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setFormData({ rating: i + 1 })}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded transition-transform hover:scale-110"
            aria-label={`Rate ${i + 1} star${i > 0 ? 's' : ''}`}
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                i < (hoveredRating || formData.rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        );
      }

      return (
        <Star
          key={i}
          className={`${size} ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      );
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getVotingState = (reviewId: string, voteType: 'helpful' | 'unhelpful') => {
    return votingStates[reviewId]?.[voteType] || false;
  };

  return (
    <div className="max-w-5xl mx-auto p-3 space-y-4">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-sm p-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-800">{successMessage}</span>
          <button
            onClick={() => setSuccessMessage('')}
            className="ml-auto text-green-600 hover:text-green-800"
            aria-label="Close message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-sm p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-800">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage('')}
            className="ml-auto text-red-600 hover:text-red-800"
            aria-label="Close message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {uploadSuccess && (
        <div className="bg-blue-50 border border-blue-200 rounded-sm p-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm text-blue-800">{uploadSuccess}</span>
          <button
            onClick={() => setUploadSuccess('')}
            className="ml-auto text-blue-600 hover:text-blue-800"
            aria-label="Close message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Ratings & Reviews</h2>

          {/* Overall Rating */}
          {loading ? (
            <StatsSkeleton />
          ) : (
            <div className="flex items-start gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
                </div>
                <div className="flex items-center gap-1 justify-center mb-1">
                  {renderStars(Math.round(stats.averageRating))}
                </div>
                <div className="text-xs text-gray-600">
                  {stats.totalReviews.toLocaleString()} review{stats.totalReviews !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Rating Breakdown */}
              <div className="flex-1 max-w-xs space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.breakdown[star] || 0;
                  const percentage =
                    stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-2 text-gray-600">{star}</span>
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-gray-600 text-right text-xs">
                        {count.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Rate Product Button */}
        {!userHasReviewed && (
          <div className="lg:w-36">
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="w-full bg-blue-600 text-white px-3 py-2 text-sm font-medium rounded-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Write Review
            </button>
          </div>
        )}
      </div>

      {/* User Already Reviewed Notice */}
      {userId && userHasReviewed && (
        <div className="bg-blue-50 border border-blue-200 rounded-sm p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm text-blue-800">
            You have already reviewed this product. Thank you for your feedback!
          </span>
        </div>
      )}
      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-sm p-4 space-y-3">
          <h3 className="text-base font-medium text-gray-900">Write Your Review</h3>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating *</label>
            <div className="flex items-center gap-1">
              {renderStars(formData.rating, true)}
              {formData.rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {formData.rating} star{formData.rating > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Review *</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ comment: e.target.value })}
              placeholder="Share your detailed experience with this product..."
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
              maxLength={1000}
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.comment.length}/1000 characters (minimum 10)
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Photos (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image.url}
                    alt={`Review ${index + 1}`}
                    className="w-16 h-16 object-cover border border-gray-300 rounded-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 opacity-80 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {formData.images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-sm flex flex-col items-center justify-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Add image"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">Add</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="text-xs text-gray-500 mt-1">
              Upload up to 5 images (JPG, PNG, GIF, WebP - max 5MB each)
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={
                submitting ||
                !formData.rating ||
                !formData.comment.trim() ||
                formData.comment.trim().length < 10
              }
              className="bg-blue-600 text-white px-4 py-2 text-sm font-medium rounded-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Review
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReviewForm(false);
                resetForm();
                setErrorMessage('');
                setSuccessMessage('');
                setUploadSuccess('');
              }}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-sm font-medium text-gray-700 mr-2">Filter:</span>
        {['all', '5', '4', '3', '2', '1'].map((filterValue) => {
          const count = getFilteredCount(filterValue === 'all' ? 'all' : Number(filterValue));
          return (
            <button
              key={filterValue}
              onClick={() => handleFilterChange(filterValue)}
              disabled={loading}
              className={`px-2 py-1 text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors disabled:opacity-50 ${
                currentFilter === filterValue
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterValue === 'all' ? 'All' : `${filterValue}★`}
              <span className="ml-1 opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {loading ? (
          Array(1)
            .fill(0)
            .map((_, i) => <ReviewSkeleton key={i} />)
        ) : reviews.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <div className="text-lg font-medium mb-2">No reviews yet</div>
            <div className="text-sm">Be the first to review this product!</div>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white border border-gray-200 rounded-sm p-4 space-y-3 hover:shadow-sm transition-shadow"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {review.user?.photoURL ? (
                      <img
                        src={review.user.photoURL}
                        alt={review.user.name || 'User'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML =
                              '<div class="w-full h-full flex items-center justify-center"><svg class="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg></div>';
                          }
                        }}
                      />
                    ) : (
                      <User className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm truncate">
                        {review.user?.name || 'Anonymous User'}
                      </span>
                      {review.isVerifiedPurchase && (
                        <div className="flex items-center gap-1 bg-green-100 text-green-800 px-1.5 py-0.5 text-xs font-medium rounded">
                          <Shield className="w-2.5 h-2.5" />
                          Verified
                        </div>
                      )}
                      {isUserReview(review) && (
                        <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-1.5 py-0.5 text-xs font-medium rounded">
                          Your Review
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating, false, 'w-2.5 h-2.5')}
                      </div>
                      <span className="text-xs text-gray-500">
                        <Calendar className="w-2.5 h-2.5 inline mr-1" />
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 text-xs font-medium rounded">
                    <span>{review.rating}</span>
                    <Star className="w-2.5 h-2.5 fill-current" />
                  </div>

                  {/* Delete Button for User's Own Review */}
                  {isUserReview(review) && (
                    <button
                      onClick={() => handleDeleteReview(review._id)}
                      disabled={deleting === review._id}
                      className="p-1 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors disabled:opacity-50"
                      title="Delete review"
                      aria-label="Delete review"
                    >
                      {deleting === review._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Review Content */}
              <div className="text-gray-700 text-sm leading-relaxed break-words">
                {review.comment}
              </div>

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {review.images.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={typeof image === 'string' ? image : image.url}
                      alt={`Review image ${index + 1}`}
                      className="w-16 h-16 object-cover border border-gray-200 rounded cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-opacity"
                      onClick={() => {
                        const imageUrl = typeof image === 'string' ? image : image.url;
                        window.open(imageUrl, '_blank', 'noopener,noreferrer');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          const imageUrl = typeof image === 'string' ? image : image.url;
                          window.open(imageUrl, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      tabIndex={0}
                    />
                  ))}
                  {review.images.length > 4 && (
                    <div
                      className="w-16 h-16 bg-gray-100 border border-gray-200 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                      onClick={() => {
                        review.images.slice(4).forEach((image) => {
                          const imageUrl = typeof image === 'string' ? image : image.url;
                          window.open(imageUrl, '_blank', 'noopener,noreferrer');
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          review.images.slice(4).forEach((image) => {
                            const imageUrl = typeof image === 'string' ? image : image.url;
                            window.open(imageUrl, '_blank', 'noopener,noreferrer');
                          });
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View ${review.images.length - 4} more images`}
                    >
                      <span className="text-xs font-medium text-gray-600">
                        +{review.images.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Review Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">Was this helpful?</span>

                  {/* Show voting buttons for all logged-in users */}
                  {userId ? (
                    <>
                      <button
                        onClick={() => handleHelpfulVote(review._id, true)}
                        disabled={getVotingState(review._id, 'helpful')}
                        className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 rounded px-1 py-0.5 ${
                          review.userVote === 'helpful'
                            ? 'text-green-600 font-medium bg-green-50'
                            : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                        }`}
                        aria-label="Mark as helpful"
                      >
                        {getVotingState(review._id, 'helpful') ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ThumbsUp className="w-3 h-3" />
                        )}
                        <span>{review.helpfulVotes || 0}</span>
                      </button>
                      <button
                        onClick={() => handleHelpfulVote(review._id, false)}
                        disabled={getVotingState(review._id, 'unhelpful')}
                        className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded px-1 py-0.5 ${
                          review.userVote === 'unhelpful'
                            ? 'text-red-600 font-medium bg-red-50'
                            : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                        }`}
                        aria-label="Mark as not helpful"
                      >
                        {getVotingState(review._id, 'unhelpful') ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ThumbsDown className="w-3 h-3" />
                        )}
                        <span>{review.unhelpfulVotes || 0}</span>
                      </button>
                    </>
                  ) : (
                    /* Show vote counts only when not logged in */
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{review.helpfulVotes || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <ThumbsDown className="w-3 h-3" />
                        <span>{review.unhelpfulVotes || 0}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Actions */}
                <div className="flex items-center gap-2">
                  {/* Report Button (for all users except when not logged in) */}
                  {userId && (
                    <button
                      onClick={() => handleReportReview(review._id)}
                      className="text-xs text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 rounded px-1 py-0.5 transition-colors"
                      aria-label="Report review"
                    >
                      Report
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && reviews.length > 0 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="bg-gray-100 text-gray-700 px-6 py-2 text-sm font-medium rounded-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading more reviews...
              </>
            ) : (
              `Load More Reviews (${Math.min(
                10,
                (stats.totalReviews || 0) - reviews.length,
              )} remaining)`
            )}
          </button>
        </div>
      )}
      {/* Auth Modal */}
      <AuthModal isOpen={openAuthModal} onClose={() => setOpenAuthModal(false)} />
    </div>
  );
};

export default ProductReviews;
