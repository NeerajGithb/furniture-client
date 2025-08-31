// models/Checkout.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICheckoutItem {
  productId: Schema.Types.ObjectId;
  quantity: number;
  hasInsurance: boolean;
}

export interface ICheckout extends Document {
  userId: Schema.Types.ObjectId;
  items: ICheckoutItem[];
  sessionId: string; // To identify unique checkout sessions
  selectedAddressId?: Schema.Types.ObjectId;
  selectedPaymentMethod?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CheckoutItemSchema = new Schema<ICheckoutItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  hasInsurance: {
    type: Boolean,
    default: false
  }
});

const CheckoutSchema = new Schema<ICheckout>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [CheckoutItemSchema],
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  selectedAddressId: {
    type: Schema.Types.ObjectId,
    ref: 'Address'
  },
  selectedPaymentMethod: {
    type: String,
    enum: ['cod', 'card', 'upi', 'netbanking', 'wallet']
  },
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Expires after 1 hour
  }
}, {
  timestamps: true
});

// Index for performance
CheckoutSchema.index({ userId: 1 });
CheckoutSchema.index({ sessionId: 1 });
CheckoutSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Checkout || mongoose.model<ICheckout>('Checkout', CheckoutSchema);