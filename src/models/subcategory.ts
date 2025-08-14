import mongoose, { Schema, Document } from 'mongoose';

export interface ISubCategory extends Document {
    name: string;
    categoryId: Schema.Types.ObjectId;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}

const SubCategorySchema: Schema = new Schema({
    name: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    slug: { type: String, required: true }
}, { timestamps: true });

export default mongoose.models.SubCategory || mongoose.model<ISubCategory>('SubCategory', SubCategorySchema);