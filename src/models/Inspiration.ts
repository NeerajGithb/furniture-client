import mongoose, { Schema, Document, model, Model } from "mongoose";

export interface IInspiration extends Document {
  title: string;          // Display name: "Living Room"
  slug: string;           // URL-friendly: "living-room"
  description?: string;   // Optional tagline or short text
  bannerImage?: string;   // Hero/banner image URL
  categoryIds: Schema.Types.ObjectId[]; // Link to categories
  createdAt: Date;
  updatedAt: Date;
}

const inspirationSchema = new Schema<IInspiration>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    bannerImage: { type: String },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: "Category" }],
  },
  { timestamps: true }
);

const Inspiration: Model<IInspiration> =
  mongoose.models.Inspiration || model<IInspiration>("Inspiration", inspirationSchema);

export default Inspiration;
