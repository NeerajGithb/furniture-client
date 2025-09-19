import mongoose, { Schema, Document } from 'mongoose';

export interface IUserVote extends Document {
  userId: Schema.Types.ObjectId;
  reviewId: Schema.Types.ObjectId;
  voteType: 'helpful' | 'unhelpful';
  createdAt: Date;
}

const UserVoteSchema = new Schema<IUserVote>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      required: true,
    },
    voteType: {
      type: String,
      enum: ['helpful', 'unhelpful'],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

UserVoteSchema.index({ userId: 1, reviewId: 1 }, { unique: true });

UserVoteSchema.index({ reviewId: 1 });
UserVoteSchema.index({ userId: 1 });

export default mongoose.models.UserVote || mongoose.model<IUserVote>('UserVote', UserVoteSchema);
