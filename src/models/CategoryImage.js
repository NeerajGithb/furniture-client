import mongoose from 'mongoose';

const CategoryImageSchema = new mongoose.Schema(
  {
    imageType: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

CategoryImageSchema.index({ imageType: 1 });

export default mongoose.models.CategoryImage ||
  mongoose.model('CategoryImage', CategoryImageSchema);
