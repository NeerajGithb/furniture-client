import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import Review from '@/models/Review';
import Product from '@/models/product';
import UserVote from '@/models/UserVote';
import { connectDB } from '@/lib/dbConnect';
import { Types } from 'mongoose';

export const DELETE = withAuth(
  async (
    request: NextRequest,
    user: AuthenticatedUser,
    { params }: { params: { reviewId: string } },
  ) => {
    try {
      const { reviewId } = params;

      if (!reviewId) {
        return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
      }

      if (!Types.ObjectId.isValid(reviewId)) {
        return NextResponse.json({ error: 'Invalid review ID format' }, { status: 400 });
      }

      await connectDB();

      const review = await Review.findById(reviewId);
      if (!review) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      }

      if (review.userId.toString() !== user.userId) {
        return NextResponse.json(
          { error: 'You can only delete your own reviews' },
          { status: 403 },
        );
      }

      const productId = review.productId.toString();

      await UserVote.deleteMany({ reviewId: new Types.ObjectId(reviewId) });

      await Review.findByIdAndDelete(reviewId);

      updateProductRating(productId).catch((error) => {
        console.error('Error updating product rating after delete:', error);
      });

      return NextResponse.json(
        {
          message: 'Review deleted successfully',
        },
        { status: 200 },
      );
    } catch (error) {
      console.error('Review DELETE error:', error);
      return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
    }
  },
);

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
