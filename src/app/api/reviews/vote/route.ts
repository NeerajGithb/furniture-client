// app/api/reviews/vote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import Review from '@/models/Review';
import UserVote from '@/models/UserVote';
import { connectDB } from '@/lib/dbConnect';
import { Types } from 'mongoose';

// POST - Handle review voting (auth required)
export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { reviewId, action } = body;

    if (!reviewId || !action) {
      return NextResponse.json(
        { error: 'Review ID and action are required' },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json(
        { error: 'Invalid review ID format' },
        { status: 400 }
      );
    }

    if (action !== 'helpful' && action !== 'unhelpful') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "helpful" or "unhelpful"' },
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

    // Check if user has already voted on this review
    const existingVote = await UserVote.findOne({
      userId: new Types.ObjectId(user.userId),
      reviewId: new Types.ObjectId(reviewId)
    });

    if (existingVote) {
      // If same vote type, remove the vote (toggle off)
      if (existingVote.voteType === action) {
        await UserVote.deleteOne({ _id: existingVote._id });
        
        // Decrease the corresponding vote count
        if (action === 'helpful') {
          review.helpfulVotes = Math.max(0, (review.helpfulVotes || 0) - 1);
        } else {
          review.unhelpfulVotes = Math.max(0, (review.unhelpfulVotes || 0) - 1);
        }
        
        await review.save();

        return NextResponse.json({
          message: `${action} vote removed`,
          helpfulVotes: review.helpfulVotes,
          unhelpfulVotes: review.unhelpfulVotes,
          userVote: null
        });
      } else {
        // If different vote type, update the vote
        const oldVoteType = existingVote.voteType;
        existingVote.voteType = action;
        await existingVote.save();

        // Update vote counts: decrease old, increase new
        if (oldVoteType === 'helpful') {
          review.helpfulVotes = Math.max(0, (review.helpfulVotes || 0) - 1);
          review.unhelpfulVotes = (review.unhelpfulVotes || 0) + 1;
        } else {
          review.unhelpfulVotes = Math.max(0, (review.unhelpfulVotes || 0) - 1);
          review.helpfulVotes = (review.helpfulVotes || 0) + 1;
        }

        await review.save();

        return NextResponse.json({
          message: `Vote changed to ${action}`,
          helpfulVotes: review.helpfulVotes,
          unhelpfulVotes: review.unhelpfulVotes,
          userVote: action
        });
      }
    } else {
      // Create new vote
      const newVote = new UserVote({
        userId: new Types.ObjectId(user.userId),
        reviewId: new Types.ObjectId(reviewId),
        voteType: action
      });

      await newVote.save();

      // Increase the corresponding vote count
      if (action === 'helpful') {
        review.helpfulVotes = (review.helpfulVotes || 0) + 1;
      } else {
        review.unhelpfulVotes = (review.unhelpfulVotes || 0) + 1;
      }

      await review.save();

      return NextResponse.json({
        message: `Marked as ${action}`,
        helpfulVotes: review.helpfulVotes,
        unhelpfulVotes: review.unhelpfulVotes,
        userVote: action
      });
    }

  } catch (error) {
    console.error('Review vote error:', error);
    
    // Handle duplicate vote error
    if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 11000) {
      return NextResponse.json(
        { error: 'You have already voted on this review' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update vote' },
      { status: 500 }
    );
  }
});