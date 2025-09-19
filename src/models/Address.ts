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

const AddressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home',
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: /^[+]?[1-9][\d]{0,15}$/,
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
      match: /^[0-9]{6}$/,
    },
    country: {
      type: String,
      required: true,
      default: 'India',
      maxlength: 50,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

AddressSchema.index({ userId: 1 });
AddressSchema.index({ userId: 1, isDefault: 1 });

AddressSchema.pre('save', async function (next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await mongoose
      .model('Address')
      .updateMany({ userId: this.userId, _id: { $ne: this._id } }, { isDefault: false });
  }
  next();
});

AddressSchema.statics.getDefaultAddress = function (userId: string) {
  return this.findOne({ userId, isDefault: true });
};

AddressSchema.statics.getUserAddresses = function (userId: string) {
  return this.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
};

AddressSchema.methods.setAsDefault = async function () {
  await mongoose
    .model('Address')
    .updateMany({ userId: this.userId, _id: { $ne: this._id } }, { isDefault: false });

  this.isDefault = true;
  return this.save();
};

export default mongoose.models.Address || mongoose.model<IAddress>('Address', AddressSchema);
