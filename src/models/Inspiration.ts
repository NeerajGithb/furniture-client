import mongoose, { Document, Schema } from 'mongoose';
import category, { ICategory } from './category';
void category;
export interface IInspiration extends Document {
  title: string;
  slug: string;
  description: string;
  heroImage: { url: string; alt: string; publicId: string };
  tags: string[];
  keywords: string[];
  categories: (Schema.Types.ObjectId | ICategory)[];
  createdAt: Date;
  updatedAt: Date;
}

const inspirationSchema = new Schema<IInspiration>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true, trim: true },
    heroImage: {
      url: { type: String, required: true },
      alt: { type: String, required: true, trim: true },
      publicId: { type: String, required: true },
    },
    tags: { type: [String], required: true, default: [] },
    keywords: { type: [String], required: true, default: [] },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category', required: true }],
  },
  { timestamps: true },
);

inspirationSchema.index({ slug: 1 });
inspirationSchema.index({ categories: 1 });
inspirationSchema.index({ createdAt: -1 });
inspirationSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  keywords: 'text',
});

const Inspiration =
  mongoose.models.Inspiration || mongoose.model<IInspiration>('Inspiration', inspirationSchema);

export default Inspiration;
