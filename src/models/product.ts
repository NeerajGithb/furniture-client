import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    description?: string;
    categoryId: Schema.Types.ObjectId;
    subCategoryId: Schema.Types.ObjectId;
    itemId: string;
    originalPrice: number;
    finalPrice: number;
    emiPrice?: number;
    discountPercent?: number;
    inStockQuantity?: number;
    colorOptions?: string[];
    size?: string[]; // ✅ Keeping as array for backward compatibility
    material?: string;
    tags?: string[];
    galleryImages: { url: string; alt?: string; publicId: string }[];
    mainImage?: { url: string; alt?: string; publicId: string }; // ✅ Added from new schema
    badge?: string;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
    };
    weight?: number;
    isPublished?: boolean;
    ratings?: number; // ✅ Changed from number to object safely
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
        subCategoryId: { type: Schema.Types.ObjectId, ref: 'SubCategory', required: true },
        itemId: { type: String, required: true, unique: true },
        originalPrice: { type: Number, required: true },
        finalPrice: { type: Number, required: true },

        description: { type: String },
        emiPrice: { type: Number },
        discountPercent: { type: Number, default: 0 },
        inStockQuantity: { type: Number },
        colorOptions: [{ type: String }],
        size: [{ type: String }], // ✅ keep as array
        material: { type: String },
        tags: [{ type: String }],
        galleryImages: [
            {
                url: { type: String, required: true },
                alt: { type: String },
                publicId: { type: String }
            }
        ],
        mainImage: {
            url: { type: String },
            alt: { type: String },
            publicId: { type: String }
        }, // ✅ new field added
        badge: { type: String },
        dimensions: {
            length: { type: Number },
            width: { type: Number },
            height: { type: Number }
        },
        weight: { type: Number },
        isPublished: { type: Boolean, default: false }, // ✅ new field added
        ratings: { type: Number, min: 0, max: 5, default: 0 } // ✅ upgraded from number to object
    },
    { timestamps: true }
);


ProductSchema.index({ categoryId: 1, subCategoryId: 1 });
ProductSchema.index({ isPublished: 1 });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
