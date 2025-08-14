'use client';

import { motion } from 'framer-motion';
import { Star, User } from 'lucide-react';

interface Review {
  user: string;
  rating: number;
  comment: string;
  date: Date;
}

interface ProductReviewsProps {
  reviews: {
    average: number;
    count: number;
    list: Review[];
  };
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ reviews }) => {
  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className={`${starSize} fill-black text-black`} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className={`relative ${starSize}`}>
            <Star className={`${starSize} text-gray-300 absolute`} />
            <div className="overflow-hidden w-1/2">
              <Star className={`${starSize} fill-black text-black`} />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className={`${starSize} text-gray-300`} />
        );
      }
    }
    return stars;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0]; // [1-star, 2-star, 3-star, 4-star, 5-star]

    reviews.list.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[Math.floor(review.rating) - 1]++;
      }
    });

    return distribution.reverse(); // Show 5-star first
  };

  const ratingDistribution = getRatingDistribution();

  if (!reviews || reviews.count === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <h2 className="text-2xl font-semibold text-gray-900">Customer Reviews</h2>
        <div className="text-center py-12 bg-gray-50 rounded-sm">
          <div className="text-gray-400 mb-4">
            <Star className="w-16 h-16 mx-auto mb-2" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-600">Be the first to share your thoughts about this product.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-semibold text-gray-900">Customer Reviews</h2>

      {/* Review Summary */}
      <div className="bg-gray-50 rounded-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Overall Rating */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="text-4xl font-bold text-gray-900">
                {reviews.average.toFixed(1)}
              </span>
              <div className="flex items-center">
                {renderStars(reviews.average, 'md')}
              </div>
            </div>
            <p className="text-gray-600">
              Based on {reviews.count} {reviews.count === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {ratingDistribution.map((count, index) => {
              const starCount = 5 - index;
              const percentage = reviews.count > 0 ? (count / reviews.count) * 100 : 0;

              return (
                <div key={starCount} className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-gray-600">{starCount}</span>
                    <Star className="w-3 h-3 fill-gray-400 text-gray-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-black h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-gray-600 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-6">
        {reviews.list.map((review, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="border-b border-gray-200 pb-6 last:border-b-0"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>

              {/* Review Content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{review.user}</h4>
                  <span className="text-sm text-gray-500">
                    {formatDate(review.date)}
                  </span>
                </div>

                <div className="flex items-center">
                  {renderStars(review.rating)}
                </div>

                <p className="text-gray-700 leading-relaxed">
                  {review.comment}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Write Review Button */}
      <div className="pt-6 border-t border-gray-200">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-sm transition-all duration-200"
        >
          Write a Review
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProductReviews;