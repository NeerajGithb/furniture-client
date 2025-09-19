import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  orderId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  paymentId: string;
  amount: number;
  currency: string;
  method: 'card' | 'upi' | 'netbanking' | 'cod' | 'wallet';
  status: 'pending' | 'success' | 'failed' | 'cancelled' | 'refunded';
  gateway: 'razorpay' | 'stripe' | 'paytm' | 'phonepe' | 'googlepay' | 'mock';
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
      enum: ['card', 'upi', 'netbanking', 'cod', 'wallet'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
    },
    gateway: {
      type: String,
      enum: ['razorpay', 'stripe', 'paytm', 'phonepe', 'googlepay', 'mock'],
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

PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });

PaymentSchema.statics.createPayment = function (data: Partial<IPayment>) {
  return this.create({
    ...data,
    paymentId: data.paymentId || `pay_${Date.now()}_${Math.random().toString(36).substring(2)}`,
  });
};

PaymentSchema.statics.findByOrderId = function (orderId: string) {
  return this.findOne({ orderId }).populate('orderId userId');
};

PaymentSchema.methods.markAsSuccess = function (gatewayData: any = {}) {
  this.status = 'success';
  this.gatewayTransactionId = gatewayData.transactionId;
  this.gatewayResponse = gatewayData;
  return this.save();
};

PaymentSchema.methods.markAsFailed = function (reason: string, gatewayData: any = {}) {
  this.status = 'failed';
  this.failureReason = reason;
  this.gatewayResponse = gatewayData;
  return this.save();
};

PaymentSchema.methods.processRefund = function (amount?: number, refundId?: string) {
  this.status = 'refunded';
  this.refundAmount = amount || this.amount;
  this.refundId = refundId;
  this.refundedAt = new Date();
  return this.save();
};

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
