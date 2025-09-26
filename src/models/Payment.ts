import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  orderId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  paymentId: string;
  amount: number;
  currency: string;
  method:
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
  status: 'pending' | 'success' | 'failed' | 'cancelled' | 'refunded';
  gateway: 'razorpay' | 'stripe' | 'paytm' | 'phonepe' | 'googlepay' | 'mock' | 'offline';
  gatewayTransactionId?: string;
  gatewayResponse?: any;
  refundId?: string;
  refundAmount?: number;
  refundedAt?: Date;
  failureReason?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR'],
    },
    method: {
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
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
    },
    gateway: {
      type: String,
      enum: ['razorpay', 'stripe', 'paytm', 'phonepe', 'googlepay', 'mock', 'offline'],
      required: true,
    },
    gatewayTransactionId: {
      type: String,
      trim: true,
    },
    gatewayResponse: {
      type: Schema.Types.Mixed,
    },
    refundId: {
      type: String,
      trim: true,
    },
    refundAmount: {
      type: Number,
      min: 0,
    },
    refundedAt: Date,
    failureReason: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ paymentId: 1 }, { unique: true });

// Pre-save middleware to generate paymentId
PaymentSchema.pre('save', function (next) {
  if (!this.paymentId) {
    this.paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
  next();
});

// Static methods
PaymentSchema.statics.createPayment = function (data: Partial<IPayment>) {
  return this.create({
    ...data,
    paymentId: data.paymentId || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
  });
};

PaymentSchema.statics.findByOrderId = function (orderId: string) {
  return this.findOne({ orderId }).populate('orderId userId');
};

// Instance methods
PaymentSchema.methods.markAsSuccess = function (gatewayData: any = {}) {
  this.status = 'success';
  this.gatewayTransactionId = gatewayData.transactionId || gatewayData.razorpayPaymentId;
  this.gatewayResponse = {
    ...this.gatewayResponse,
    ...gatewayData,
    paidAt: new Date(),
  };
  return this.save();
};

PaymentSchema.methods.markAsFailed = function (reason: string, gatewayData: any = {}) {
  this.status = 'failed';
  this.failureReason = reason;
  this.gatewayResponse = {
    ...this.gatewayResponse,
    ...gatewayData,
    failedAt: new Date(),
  };
  return this.save();
};

PaymentSchema.methods.processRefund = function (amount?: number, refundId?: string) {
  this.status = 'refunded';
  this.refundAmount = amount || this.amount;
  this.refundId = refundId || `refund_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  this.refundedAt = new Date();
  return this.save();
};

PaymentSchema.methods.markAsCancelled = function (reason?: string) {
  this.status = 'cancelled';
  if (reason) {
    this.failureReason = reason;
  }
  this.gatewayResponse = {
    ...this.gatewayResponse,
    cancelledAt: new Date(),
    reason,
  };
  return this.save();
};

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
