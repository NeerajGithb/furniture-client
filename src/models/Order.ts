import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: Schema.Types.ObjectId;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  insuranceCost?: number;
  selectedVariant?: {
    color?: string;
    size?: string;
    sku?: string;
  };
  productImage?: string;

  sku?: string;
  itemId?: string;
  discount?: number;
  discountPercent?: number;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IPriceBreakdown {
  originalSubtotal: number;
  itemDiscount: number;
  couponDiscount: number;
  totalInsurance: number;
  finalSubtotal: number;
  shippingCost: number;
  tax: number;
  grandTotal: number;
  totalSavings: number;
}

export interface IOrder extends Document {
  userId: Schema.Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  totalAmount: number;
  shippingAddress: IShippingAddress;
  paymentMethod:
    | 'card'
    | 'upi'
    | 'netbanking'
    | 'cod'
    | 'wallet'
    | 'razorpay'
    | 'stripe'
    | 'paytm'
    | 'phonepe'
    | 'googlepay';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'returned';
  trackingNumber?: string;
  expectedDeliveryDate?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  refundAmount?: number;
  refundedAt?: Date;
  notes?: string;

  priceBreakdown?: IPriceBreakdown;
  insuranceEnabled?: string[];
  couponCode?: string;

  createdAt: Date;
  updatedAt: Date;

  canCancel(): boolean;
  cancel(reason?: string): Promise<IOrder>;
  markAsDelivered(): Promise<IOrder>;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  originalPrice: {
    type: Number,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  insuranceCost: {
    type: Number,
    min: 0,
  },
  selectedVariant: {
    type: {
      color: { type: String, trim: true },
      size: { type: String, trim: true },
      sku: { type: String, trim: true },
    },
    required: false,
    default: undefined,
  },
  productImage: {
    type: String,
    trim: true,
  },

  sku: { type: String, trim: true },
  itemId: { type: String, trim: true },
  discount: { type: Number, min: 0, default: 0 },
  discountPercent: { type: Number, min: 0, max: 100, default: 0 },
});

OrderItemSchema.pre('save', function (next) {
  if (
    this.selectedVariant &&
    typeof this.selectedVariant === 'object' &&
    !this.selectedVariant.color &&
    !this.selectedVariant.size &&
    !this.selectedVariant.sku
  ) {
    this.selectedVariant = undefined;
  }
  next();
});

const ShippingAddressSchema = new Schema<IShippingAddress>({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  addressLine1: { type: String, required: true, trim: true },
  addressLine2: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, default: 'India' },
});

const PriceBreakdownSchema = new Schema<IPriceBreakdown>({
  originalSubtotal: { type: Number, required: true, min: 0 },
  itemDiscount: { type: Number, default: 0, min: 0 },
  couponDiscount: { type: Number, default: 0, min: 0 },
  totalInsurance: { type: Number, default: 0, min: 0 },
  finalSubtotal: { type: Number, required: true, min: 0 },
  shippingCost: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  grandTotal: { type: Number, required: true, min: 0 },
  totalSavings: { type: Number, default: 0, min: 0 },
});

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: [OrderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAddress: {
      type: ShippingAddressSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: [
        'card',
        'upi',
        'netbanking',
        'cod',
        'wallet',
        'razorpay',
        'stripe',
        'paytm',
        'phonepe',
        'googlepay',
      ],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    expectedDeliveryDate: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: {
      type: String,
      trim: true,
    },
    refundAmount: {
      type: Number,
      min: 0,
    },
    refundedAt: Date,
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    priceBreakdown: {
      type: PriceBreakdownSchema,
      required: false,
    },
    insuranceEnabled: [
      {
        type: String,
      },
    ],
    couponCode: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

OrderSchema.index({ userId: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });

OrderSchema.pre('validate', function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD${timestamp}${random}`;
  }
  next();
});

OrderSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    let originalSubtotal = 0;
    let itemDiscount = 0;
    let totalInsurance = 0;

    this.items.forEach((item) => {
      const itemOriginalPrice = (item.originalPrice || item.price) * item.quantity;
      const itemFinalPrice = item.price * item.quantity;
      const itemDiscountAmount = itemOriginalPrice - itemFinalPrice;
      const itemInsuranceAmount = item.insuranceCost || 0;

      originalSubtotal += itemOriginalPrice;
      itemDiscount += itemDiscountAmount;
      totalInsurance += itemInsuranceAmount;
    });

    this.priceBreakdown = {
      originalSubtotal,
      itemDiscount,
      couponDiscount: 0,
      totalInsurance,
      finalSubtotal: this.subtotal,
      shippingCost: this.shippingCost || 0,
      tax: this.tax || 0,
      grandTotal: this.totalAmount,
      totalSavings: itemDiscount + (this.priceBreakdown?.couponDiscount || 0),
    };
  }

  next();
});

OrderSchema.statics.getUserOrders = function (
  userId: string,
  page: number = 1,
  limit: number = 10,
) {
  const skip = (page - 1) * limit;
  return this.find({ userId })
    .populate('items.productId', 'name mainImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

OrderSchema.statics.getOrderByNumber = function (orderNumber: string) {
  return this.findOne({ orderNumber }).populate('items.productId', 'name mainImage');
};

OrderSchema.methods.canCancel = function () {
  return ['pending', 'confirmed'].includes(this.orderStatus);
};

OrderSchema.methods.cancel = function (reason?: string) {
  if (!this.canCancel()) {
    throw new Error('Order cannot be cancelled');
  }

  this.orderStatus = 'cancelled';
  this.cancelledAt = new Date();
  if (reason) this.cancellationReason = reason;

  return this.save();
};

OrderSchema.methods.markAsDelivered = function () {
  this.orderStatus = 'delivered';
  this.deliveredAt = new Date();
  if (this.paymentMethod === 'cod') {
    this.paymentStatus = 'paid';
  }
  return this.save();
};

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
