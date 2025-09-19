import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  mainImage: {
    url: string;
    alt: string;
  };
  description?: string;
}

const CategorySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    mainImage: {
      url: { type: String, required: true },
      alt: { type: String, required: true },
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
