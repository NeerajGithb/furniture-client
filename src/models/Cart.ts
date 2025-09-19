import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
  productId: Schema.Types.ObjectId;
  quantity: number;
  selectedVariant?: {
    color?: string;
    size?: string;
    sku?: string;
  };
  addedAt: Date;
}

export interface ICart extends Document {
  userId: Schema.Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  selectedVariant: {
    color: String,
    size: String,
    sku: String,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [CartItemSchema],
  },
  {
    timestamps: true,
  },
);

CartSchema.index({ userId: 1 });
CartSchema.index({ 'items.productId': 1 });

CartSchema.methods.addItem = function (productId: string, quantity: number = 1, variant?: any) {
  const existingItemIndex = this.items.findIndex(
    (item: ICartItem) => item.productId.toString() === productId,
  );

  if (existingItemIndex >= 0) {
    this.items[existingItemIndex].quantity += quantity;
  } else {
    this.items.push({
      productId: new mongoose.Types.ObjectId(productId),
      quantity,
      selectedVariant: variant,
      addedAt: new Date(),
    });
  }
  return this.save();
};

CartSchema.methods.removeItem = function (productId: string) {
  this.items = this.items.filter((item: ICartItem) => item.productId.toString() !== productId);
  return this.save();
};

CartSchema.methods.updateQuantity = function (productId: string, quantity: number) {
  const itemIndex = this.items.findIndex(
    (item: ICartItem) => item.productId.toString() === productId,
  );

  if (itemIndex >= 0) {
    if (quantity <= 0) {
      this.items.splice(itemIndex, 1);
    } else {
      this.items[itemIndex].quantity = quantity;
    }
  }
  return this.save();
};

CartSchema.methods.clearCart = function () {
  this.items = [];
  return this.save();
};

export default mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);
