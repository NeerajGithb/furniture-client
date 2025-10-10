import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import Review from '@/models/Review';
import { connectDB } from '@/lib/dbConnect';
import { Types } from 'mongoose';

export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { reviewId } = body;

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

    if (review.userId.toString() === user.userId) {
      return NextResponse.json({ error: 'You cannot report your own review' }, { status: 400 });
    }

    await review.reportReview();

    return NextResponse.json(
      {
        message: 'Review reported successfully',
        reportedCount: review.reportedCount,
        status: review.status,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Error reporting review:', error);
    return NextResponse.json({ error: 'Failed to report review' }, { status: 500 });
  }
});
