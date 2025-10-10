import mongoose, { Schema, Document } from 'mongoose';

export interface IWishlistItem {
  productId: Schema.Types.ObjectId;
  addedAt: Date;
}

export interface IWishlist extends Document {
  userId: Schema.Types.ObjectId;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const WishlistItemSchema = new Schema<IWishlistItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [WishlistItemSchema],
  },
  {
    timestamps: true,
  },
);

WishlistSchema.index({ userId: 1 });
WishlistSchema.index({ 'items.productId': 1 });

WishlistSchema.methods.addItem = function (productId: string) {
  const existingItem = this.items.find(
    (item: IWishlistItem) => item.productId.toString() === productId,
  );

  if (!existingItem) {
    this.items.push({
      productId: new mongoose.Types.ObjectId(productId),
      addedAt: new Date(),
    });
  }
  return this.save();
};

WishlistSchema.methods.removeItem = function (productId: string) {
  this.items = this.items.filter((item: IWishlistItem) => item.productId.toString() !== productId);
  return this.save();
};

WishlistSchema.methods.isItemInWishlist = function (productId: string) {
  return this.items.some((item: IWishlistItem) => item.productId.toString() === productId);
};

WishlistSchema.methods.clearWishlist = function () {
  this.items = [];
  return this.save();
};

export default mongoose.models.Wishlist || mongoose.model<IWishlist>('Wishlist', WishlistSchema);
