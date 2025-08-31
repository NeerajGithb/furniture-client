// app/api/reviews/[reviewId]/route.ts - Fixed version
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import Review from '@/models/Review';
import Product from '@/models/product';
import UserVote from '@/models/UserVote';
import { connectDB } from '@/lib/dbConnect';
import { Types } from 'mongoose';

// DELETE - Delete user's own review (auth required)
export const DELETE = withAuth(async (
  request: NextRequest, 
  user: AuthenticatedUser,
  { params }: { params: { reviewId: string } }
) => {
  try {
    const { reviewId } = params;

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json(
        { error: 'Invalid review ID format' },
        { status: 400 }
      );
    }

    await connectDB();

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user owns this review
    if (review.userId.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'You can only delete your own reviews' },
        { status: 403 }
      );
    }

    const productId = review.productId.toString();

    // Delete associated user votes for this review
    await UserVote.deleteMany({ reviewId: new Types.ObjectId(reviewId) });

    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    // Update product rating (async - don't await to avoid blocking response)
    updateProductRating(productId).catch(error => {
      console.error('Error updating product rating after delete:', error);
    });

    return NextResponse.json({
      message: 'Review deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Review DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
});

// Helper function to update product rating asynchronously
async function updateProductRating(productId: string) {
  try {
    await connectDB();
    const stats = await Review.getReviewStats(productId);
    await Product.findByIdAndUpdate(productId, {
      ratings: stats.averageRating,
      'reviews.average': stats.averageRating,
      'reviews.count': stats.totalReviews,
      'reviews.breakdown': stats.breakdown
    });
  } catch (error) {
    console.error('Error updating product ratings:', error);
  }
}