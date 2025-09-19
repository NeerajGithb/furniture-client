import mongoose, { Schema, Document } from 'mongoose';

export interface ISubCategory extends Document {
  name: string;
  categoryId: Schema.Types.ObjectId;
  slug: string;
  mainImage?: {
    url?: string;
    alt?: string;
  };
  description?: string;
}

const SubCategorySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    mainImage: {
      type: new Schema(
        {
          url: { type: String },
          alt: { type: String },
        },
        { _id: false },
      ),
      required: false,
      default: undefined,
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

SubCategorySchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true,
});

export default mongoose.models.SubCategory ||
  mongoose.model<ISubCategory>('SubCategory', SubCategorySchema);
