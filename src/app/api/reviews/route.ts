import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withOptionalAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import Review from '@/models/Review';
import Product from '@/models/product';
import Order from '@/models/Order';
import UserVote from '@/models/UserVote';
import { connectDB } from '@/lib/dbConnect';
import { Types } from 'mongoose';

export const GET = withOptionalAuth(
  async (request: NextRequest, user: AuthenticatedUser | null) => {
    try {
      const { searchParams } = new URL(request.url);
      const productId = searchParams.get('productId');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const sortBy = searchParams.get('sortBy') || 'newest';
      const rating = searchParams.get('rating');

      if (!productId) {
        return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
      }

      if (!Types.ObjectId.isValid(productId)) {
        return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 });
      }

      await connectDB();

      let query: any = {
        productId: new Types.ObjectId(productId),
        status: 'approved',
      };

      if (rating && rating !== 'all') {
        const ratingNum = parseInt(rating);
        if (ratingNum >= 1 && ratingNum <= 5) {
          query.rating = ratingNum;
        }
      }

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
      }

      const skip = (page - 1) * limit;

      const reviews = await Review.find(query)
        .populate('userId', 'name photoURL')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      const totalReviews = await Review.countDocuments(query);
      const totalPages = Math.ceil(totalReviews / limit);

      const stats = await Review.getReviewStats(productId);

      let userHasReviewed = false;
      let userVotes: any = {};

      if (user) {
        const userReview = await Review.findOne({
          userId: new Types.ObjectId(user.userId),
          productId: new Types.ObjectId(productId),
        });
        userHasReviewed = !!userReview;

        if (reviews.length > 0) {
          const reviewIds = reviews.map((r) => r._id);
          const votes = await UserVote.find({
            userId: new Types.ObjectId(user.userId),
            reviewId: { $in: reviewIds },
          }).lean();

          userVotes = votes.reduce((acc: any, vote: any) => {
            acc[vote.reviewId.toString()] = vote.voteType;
            return acc;
          }, {});
        }
      }

      return NextResponse.json({
        reviews: reviews.map((review: any) => ({
          _id: review._id,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          images: review.images || [],
          isVerifiedPurchase: review.isVerifiedPurchase,
          helpfulVotes: review.helpfulVotes || 0,
          unhelpfulVotes: review.unhelpfulVotes || 0,
          createdAt: review.createdAt,
          userVote: userVotes[review._id.toString()] || null,
          user: {
            _id: review.userId?._id || review.userId,
            name: review.userId?.name || 'Anonymous',
            photoURL: review.userId?.photoURL || null,
          },
        })),
        statistics: stats,
        userHasReviewed,
        pagination: {
          currentPage: page,
          totalPages,
          totalReviews,
          hasMore: page < totalPages,
        },
      });
    } catch (error) {
      console.error('Reviews GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
  },
);

export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { productId, orderId, rating, title, comment, images } = body;

    if (!productId || !rating || !comment) {
      return NextResponse.json(
        { error: 'Product ID, rating, and comment are required' },
        { status: 400 },
      );
    }

    if (!Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 });
    }

    const ratingNum = parseInt(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    if (comment.trim().length < 10) {
      return NextResponse.json(
        { error: 'Comment must be at least 10 characters long' },
        { status: 400 },
      );
    }

    await connectDB();

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const existingReview = await Review.findOne({
      userId: new Types.ObjectId(user.userId),
      productId: new Types.ObjectId(productId),
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 },
      );
    }

    let isVerifiedPurchase = false;
    if (orderId && Types.ObjectId.isValid(orderId)) {
      const order = await Order.findOne({
        _id: new Types.ObjectId(orderId),
        userId: new Types.ObjectId(user.userId),
        orderStatus: 'delivered',
      });

      if (order && order.items.some((item: any) => item.productId.toString() === productId)) {
        isVerifiedPurchase = true;
      }
    }

    const review = new Review({
      userId: new Types.ObjectId(user.userId),
      productId: new Types.ObjectId(productId),
      orderId: orderId && Types.ObjectId.isValid(orderId) ? new Types.ObjectId(orderId) : undefined,
      rating: ratingNum,
      title: title?.trim() || undefined,
      comment: comment.trim(),
      images: images || [],
      isVerifiedPurchase,
      status: 'approved',
    });

    await review.save();

    await review.populate('userId', 'name photoURL');

    updateProductRating(productId).catch((error) => {
      console.error('Error updating product rating after creation:', error);
    });

    return NextResponse.json({
      message: 'Review added successfully',
      review: {
        _id: review._id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images,
        isVerifiedPurchase: review.isVerifiedPurchase,
        helpfulVotes: review.helpfulVotes,
        unhelpfulVotes: review.unhelpfulVotes,
        createdAt: review.createdAt,
        userVote: null,
        user: {
          _id: (review.userId as any)?._id || review.userId,
          name: (review.userId as any)?.name || 'User',
          photoURL: (review.userId as any)?.photoURL || null,
        },
      },
    });
  } catch (error) {
    console.error('Review POST error:', error);
    return NextResponse.json({ error: 'Failed to add review' }, { status: 500 });
  }
});

async function updateProductRating(productId: string) {
  try {
    await connectDB();
    const stats = await Review.getReviewStats(productId);
    await Product.findByIdAndUpdate(productId, {
      ratings: stats.averageRating,
      'reviews.average': stats.averageRating,
      'reviews.count': stats.totalReviews,
      'reviews.breakdown': stats.breakdown,
    });
  } catch (error) {
    console.error('Error updating product ratings:', error);
  }
}
