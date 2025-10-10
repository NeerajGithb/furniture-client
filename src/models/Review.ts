import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  userId: Schema.Types.ObjectId;
  productId: Schema.Types.ObjectId;
  orderId?: Schema.Types.ObjectId;
  rating: number;
  title?: string;
  comment: string;
  images?: {
    url: string;
    publicId: string;
    alt?: string;
  }[];
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  unhelpfulVotes: number;
  reportedCount: number;
  status: 'pending' | 'approved' | 'rejected';
  moderatorNote?: string;
  createdAt: Date;
  updatedAt: Date;
  approve(moderatorNote?: string): Promise<IReview>;
  reject(moderatorNote?: string): Promise<IReview>;
  addHelpfulVote(): Promise<IReview>;
  addUnhelpfulVote(): Promise<IReview>;
  reportReview(): Promise<IReview>;
}

interface IReviewStatics {
  getProductReviews(
    productId: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    userId?: string,
  ): Promise<any[]>;
  getReviewStats(productId: string): Promise<{
    totalReviews: number;
    averageRating: number;
    breakdown: { [key: number]: number };
  }>;
}

interface IReviewModel extends Model<IReview>, IReviewStatics {}

const ReviewSchema = new Schema<IReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
          validate: {
            validator: function (v: string) {
              return /^https?:\/\/.+/.test(v);
            },
            message: 'Invalid image URL',
          },
        },
        publicId: {
          type: String,
          required: true,
        },
        alt: {
          type: String,
          trim: true,
          maxlength: 100,
        },
      },
    ],
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    unhelpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    reportedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    moderatorNote: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

ReviewSchema.index({ productId: 1, status: 1 });
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ createdAt: -1 });
ReviewSchema.index({ isVerifiedPurchase: 1 });
ReviewSchema.index({ helpfulVotes: -1 });
ReviewSchema.index({ unhelpfulVotes: 1 });
ReviewSchema.index({ userId: 1, productId: 1 }, { unique: true });
ReviewSchema.index(
  {
    title: 'text',
    comment: 'text',
  },
  {
    weights: { title: 2, comment: 1 },
  },
);

ReviewSchema.virtual('age').get(function () {
  return Date.now() - this.createdAt.getTime();
});

ReviewSchema.statics.getProductReviews = async function (
  productId: string,
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'newest',
  userId?: string,
) {
  const skip = (page - 1) * limit;
  let sort: any = { createdAt: -1 };

  switch (sortBy) {
    case 'oldest':
      sort = { createdAt: 1 };
      break;
    case 'highest':
      sort = { rating: -1, createdAt: -1 };
      break;
    case 'lowest':
      sort = { rating: 1, createdAt: -1 };
      break;
    case 'helpful':
      sort = { helpfulVotes: -1, createdAt: -1 };
      break;
    case 'verified':
      sort = { isVerifiedPurchase: -1, createdAt: -1 };
      break;
  }

  const reviews = await this.find({
    productId: new mongoose.Types.ObjectId(productId),
    status: 'approved',
  })
    .populate('userId', 'name photoURL email')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  if (userId && reviews.length > 0) {
    try {
      const UserVote = mongoose.model('UserVote');
      const reviewIds = reviews.map((r: { _id: any }) => r._id);

      const userVotes = await UserVote.find({
        userId: new mongoose.Types.ObjectId(userId),
        reviewId: { $in: reviewIds },
      }).lean();

      const voteMap = userVotes.reduce((acc: any, vote: any) => {
        acc[vote.reviewId.toString()] = vote.voteType;
        return acc;
      }, {});

      return reviews.map((review: { _id: { toString: () => string | number } }) => ({
        ...review,
        userVote: voteMap[review._id.toString()] || null,
      }));
    } catch (error) {
      console.error('Error fetching user votes:', error);

      return reviews.map((review: any) => ({
        ...review,
        userVote: null,
      }));
    }
  }

  return reviews.map((review: any) => ({
    ...review,
    userVote: null,
  }));
};

ReviewSchema.statics.getReviewStats = async function (productId: string) {
  try {
    const stats = await this.aggregate([
      {
        $match: {
          productId: new mongoose.Types.ObjectId(productId),
          status: 'approved',
        },
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingBreakdown: { $push: '$rating' },
          verifiedCount: { $sum: { $cond: ['$isVerifiedPurchase', 1, 0] } },
          totalHelpfulVotes: { $sum: '$helpfulVotes' },
          totalUnhelpfulVotes: { $sum: '$unhelpfulVotes' },
        },
      },
      {
        $addFields: {
          breakdown: {
            5: { $size: { $filter: { input: '$ratingBreakdown', cond: { $eq: ['$$this', 5] } } } },
            4: { $size: { $filter: { input: '$ratingBreakdown', cond: { $eq: ['$$this', 4] } } } },
            3: { $size: { $filter: { input: '$ratingBreakdown', cond: { $eq: ['$$this', 3] } } } },
            2: { $size: { $filter: { input: '$ratingBreakdown', cond: { $eq: ['$$this', 2] } } } },
            1: { $size: { $filter: { input: '$ratingBreakdown', cond: { $eq: ['$$this', 1] } } } },
          },
          verifiedPercentage: {
            $cond: {
              if: { $eq: ['$totalReviews', 0] },
              then: 0,
              else: {
                $multiply: [{ $divide: ['$verifiedCount', '$totalReviews'] }, 100],
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalReviews: 1,
          averageRating: { $round: [{ $ifNull: ['$averageRating', 0] }, 1] },
          breakdown: 1,
          verifiedCount: 1,
          verifiedPercentage: { $round: [{ $ifNull: ['$verifiedPercentage', 0] }, 1] },
          totalHelpfulVotes: 1,
          totalUnhelpfulVotes: 1,
        },
      },
    ]);

    return (
      stats[0] || {
        totalReviews: 0,
        averageRating: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        verifiedCount: 0,
        verifiedPercentage: 0,
        totalHelpfulVotes: 0,
        totalUnhelpfulVotes: 0,
      }
    );
  } catch (error) {
    console.error('Error in getReviewStats:', error);
    return {
      totalReviews: 0,
      averageRating: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      verifiedCount: 0,
      verifiedPercentage: 0,
      totalHelpfulVotes: 0,
      totalUnhelpfulVotes: 0,
    };
  }
};

ReviewSchema.methods.approve = function (moderatorNote?: string) {
  this.status = 'approved';
  if (moderatorNote) this.moderatorNote = moderatorNote;
  return this.save();
};

ReviewSchema.methods.reject = function (moderatorNote?: string) {
  this.status = 'rejected';
  if (moderatorNote) this.moderatorNote = moderatorNote;
  return this.save();
};

ReviewSchema.methods.addHelpfulVote = function () {
  this.helpfulVotes = (this.helpfulVotes || 0) + 1;
  return this.save();
};

ReviewSchema.methods.addUnhelpfulVote = function () {
  this.unhelpfulVotes = (this.unhelpfulVotes || 0) + 1;
  return this.save();
};

ReviewSchema.methods.reportReview = function () {
  this.reportedCount = (this.reportedCount || 0) + 1;
  if (this.reportedCount >= 5) {
    this.status = 'pending';
  }
  return this.save();
};

ReviewSchema.pre('save', async function (next) {
  if (this.isNew && this.orderId && !this.isVerifiedPurchase) {
    try {
      const Order = mongoose.model('Order');
      const order = await Order.findOne({
        _id: this.orderId,
        userId: this.userId,
        orderStatus: { $in: ['delivered', 'completed'] },
      });

      if (
        order &&
        order.items.some((item: any) => item.productId.toString() === this.productId.toString())
      ) {
        this.isVerifiedPurchase = true;
      }
    } catch (error) {
      console.error('Error verifying purchase:', error);
    }
  }

  if (this.isNew) {
    if (this.isVerifiedPurchase && this.status === 'pending') {
      this.status = 'approved';
    } else if (this.status === 'pending') {
      const commentLength = this.comment?.trim().length || 0;
      if (commentLength >= 20 && commentLength <= 500) {
        this.status = 'approved';
      }
    }
  }

  if (this.images && this.images.length > 5) {
    const error = new Error('Maximum 5 images allowed per review');
    return next(error);
  }

  next();
});

ReviewSchema.post('save', async function (doc) {
  if (doc.status === 'approved') {
    try {
      const Product = mongoose.model('Product');
      const stats = await (this.constructor as any).getReviewStats(doc.productId.toString());

      await Product.findByIdAndUpdate(doc.productId, {
        ratings: stats.averageRating,
        'reviews.average': stats.averageRating,
        'reviews.count': stats.totalReviews,
        'reviews.breakdown': stats.breakdown,
      });
    } catch (error) {
      console.error('Error updating product ratings:', error);
    }
  }
});

ReviewSchema.post('deleteOne', { document: true, query: false }, async function (doc: any) {
  try {
    const Product = mongoose.model('Product');
    const stats = await (this.constructor as any).getReviewStats(this.productId.toString());

    await Product.findByIdAndUpdate(this.productId, {
      ratings: stats.averageRating,
      'reviews.average': stats.averageRating,
      'reviews.count': stats.totalReviews,
      'reviews.breakdown': stats.breakdown,
    });
  } catch (error) {
    console.error('Error updating product ratings after deletion:', error);
  }
});

export default (mongoose.models.Review as IReviewModel) ||
  mongoose.model<IReview, IReviewModel>('Review', ReviewSchema);
