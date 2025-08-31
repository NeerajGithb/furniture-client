// models/Address.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress extends Document {
  userId: Schema.Types.ObjectId;
  type: 'home' | 'work' | 'other';
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: /^[+]?[1-9][\d]{0,15}$/ // International phone number format
  },
  addressLine1: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  addressLine2: {
    type: String,
    trim: true,
    maxlength: 200
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  state: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  postalCode: {
    type: String,
    required: true,
    trim: true,
    match: /^[0-9]{6}$/ // Indian PIN code format
  },
  country: {
    type: String,
    required: true,
    default: 'India',
    maxlength: 50
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
AddressSchema.index({ userId: 1 });
AddressSchema.index({ userId: 1, isDefault: 1 });

// Pre-save middleware to ensure only one default address per user
AddressSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Remove default status from other addresses
    await mongoose.model('Address').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Static method to get user's default address
AddressSchema.statics.getDefaultAddress = function(userId: string) {
  return this.findOne({ userId, isDefault: true });
};

// Static method to get all user addresses
AddressSchema.statics.getUserAddresses = function(userId: string) {
  return this.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
};

// Method to set as default
AddressSchema.methods.setAsDefault = async function() {
  // Remove default from other addresses
  await mongoose.model('Address').updateMany(
    { userId: this.userId, _id: { $ne: this._id } },
    { isDefault: false }
  );
  
  this.isDefault = true;
  return this.save();
};

export default mongoose.models.Address || mongoose.model<IAddress>('Address', AddressSchema);