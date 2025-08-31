import mongoose, { Schema, Document, CallbackError } from 'mongoose';

export interface IProduct extends Document {
    // Existing fields (keeping your current structure)
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
    size?: string[];
    material?: string;
    tags?: string[];
    galleryImages: { url: string; alt?: string; publicId: string }[];
    mainImage?: { url: string; alt?: string; publicId: string };
    badge?: string;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
    };
    weight?: number;
    isPublished?: boolean;
    ratings?: number;
    
    // Enhanced fields for better search (from your document)
    reviews?: {
        average: number;
        count: number;
        breakdown?: {
            5: number;
            4: number;
            3: number;
            2: number;
            1: number;
        };
    };
    
    isFeatured?: boolean;
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    
    shippingInfo?: {
        freeShipping?: boolean;
        estimatedDays?: number;
        shippingCost?: number;
    };
    
    variants?: {
        color?: string;
        size?: string;
        sku?: string;
        price?: number;
        inStock?: number;
    }[];
    
    slug?: string;
    metaTitle?: string;
    metaDescription?: string;
    
    totalSold?: number;
    viewCount?: number;
    wishlistCount?: number;
    
    brand?: string;
    warranty?: string;
    returnPolicy?: string;
    
    // SEARCH-SPECIFIC ENHANCEMENTS
    categorySlug?: string;        // Denormalized for faster search
    subcategorySlug?: string;     // Denormalized for faster search
    searchKeywords?: string[];    // Additional keywords for search
    attributes?: {
        seater?: number;          // For furniture like sofas, chairs
        color?: string;           // Primary color (normalized)
        material?: string;        // Primary material (normalized)
        style?: string;           // Modern, Traditional, Contemporary
        room?: string;            // Living Room, Bedroom, Office
        [key: string]: any;       // Flexible attributes
    };
    
    createdAt: Date;
    updatedAt: Date;
    
    // Methods
    updateSearchScore(): number;
}

interface ICategory extends Document {
    slug: string;
}

interface ISubCategory extends Document {
    slug: string;
}

const ProductSchema: Schema<IProduct> = new Schema(
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
        inStockQuantity: { type: Number, default: 0 },
        colorOptions: [{ type: String }],
        size: [{ type: String }],
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
        },
        badge: { type: String },
        dimensions: {
            length: { type: Number },
            width: { type: Number },
            height: { type: Number }
        },
        weight: { type: Number },
        isPublished: { type: Boolean, default: false },
        ratings: { type: Number, min: 0, max: 5, default: 0 },
        
        // Enhanced fields for better UX
        reviews: {
            average: { type: Number, min: 0, max: 5, default: 0 },
            count: { type: Number, default: 0 },
            breakdown: {
                5: { type: Number, default: 0 },
                4: { type: Number, default: 0 },
                3: { type: Number, default: 0 },
                2: { type: Number, default: 0 },
                1: { type: Number, default: 0 }
            }
        },
        
        isFeatured: { type: Boolean, default: false },
        isNewArrival: { type: Boolean, default: false },
        isBestSeller: { type: Boolean, default: false },
        
        shippingInfo: {
            freeShipping: { type: Boolean, default: true },
            estimatedDays: { type: Number, default: 3 },
            shippingCost: { type: Number, default: 0 }
        },
        
        variants: [{
            color: { type: String },
            size: { type: String },
            sku: { type: String },
            price: { type: Number },
            inStock: { type: Number }
        }],
        
        slug: { type: String, unique: true },
        metaTitle: { type: String },
        metaDescription: { type: String },
        
        totalSold: { type: Number, default: 0 },
        viewCount: { type: Number, default: 0 },
        wishlistCount: { type: Number, default: 0 },
        
        brand: { type: String },
        warranty: { type: String },
        returnPolicy: { type: String, default: "30 days return" },
        
        // SEARCH-SPECIFIC FIELDS
        categorySlug: { type: String, index: true },
        subcategorySlug: { type: String, index: true },
        searchKeywords: [{ type: String }],
        attributes: {
            seater: { type: Number, index: true },
            color: { type: String, index: true },
            material: { type: String, index: true },
            style: { type: String, index: true },
            room: { type: String, index: true }
        }
    },
    { timestamps: true }
);

// ===== SEARCH-OPTIMIZED INDEXES =====

// Text search index (PRIMARY SEARCH)
ProductSchema.index({
    name: "text",
    description: "text",
    tags: "text",
    brand: "text",
    "searchKeywords": "text"
}, {
    weights: {
        name: 10,           // Highest weight for product name
        brand: 5,           // High weight for brand
        tags: 3,            // Medium weight for tags
        searchKeywords: 3,  // Medium weight for search keywords
        description: 1      // Lowest weight for description
    },
    name: "product_text_search"
});

// Compound indexes for filtered searches
ProductSchema.index({ isPublished: 1, categorySlug: 1, finalPrice: 1 });
ProductSchema.index({ isPublished: 1, subcategorySlug: 1, finalPrice: 1 });
ProductSchema.index({ isPublished: 1, brand: 1, finalPrice: 1 });
ProductSchema.index({ isPublished: 1, "attributes.color": 1 });
ProductSchema.index({ isPublished: 1, "attributes.material": 1 });
ProductSchema.index({ isPublished: 1, "attributes.seater": 1 });

// Performance indexes
ProductSchema.index({ isPublished: 1, isFeatured: -1, createdAt: -1 });
ProductSchema.index({ isPublished: 1, totalSold: -1 });
ProductSchema.index({ isPublished: 1, "reviews.average": -1 });
ProductSchema.index({ isPublished: 1, viewCount: -1 });

// Stock-aware index (partial index for performance)
ProductSchema.index(
    { isPublished: 1, inStockQuantity: 1 }, 
    { 
        partialFilterExpression: { inStockQuantity: { $gt: 0 } },
        name: "stock_available_products"
    }
);

// Price range search
ProductSchema.index({ isPublished: 1, finalPrice: 1 });
ProductSchema.index({ isPublished: 1, finalPrice: -1 });

// Category-specific indexes
ProductSchema.index({ categoryId: 1, isPublished: 1 });
ProductSchema.index({ subCategoryId: 1, isPublished: 1 });

// Unique indexes
ProductSchema.index({ slug: 1 }, { unique: true, sparse: true });
ProductSchema.index({ itemId: 1 }, { unique: true });

// ===== PRE-SAVE HOOKS =====

// Auto-generate slug and search optimizations
ProductSchema.pre<IProduct>('save', async function(next: (err?: CallbackError) => void) {
    try {
        // Generate slug if not exists
        if (!this.slug && this.name) {
            const baseSlug = this.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            
            // Ensure unique slug
            let slug = baseSlug;
            let counter = 1;
            
            const ProductModel = mongoose.models.Product as mongoose.Model<IProduct>;
            
            while (await ProductModel.findOne({ slug, _id: { $ne: this._id } })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }
            
            this.slug = slug;
        }
        
        // Populate category and subcategory slugs for faster search
        if (this.isModified('categoryId') || !this.categorySlug) {
            const CategoryModel = mongoose.models.Category as mongoose.Model<ICategory>;
            const category = await CategoryModel.findById(this.categoryId);
            if (category) {
                this.categorySlug = category.slug;
            }
        }
        
        if (this.isModified('subCategoryId') || !this.subcategorySlug) {
            const SubCategoryModel = mongoose.models.SubCategory as mongoose.Model<ISubCategory>;
            const subcategory = await SubCategoryModel.findById(this.subCategoryId);
            if (subcategory) {
                this.subcategorySlug = subcategory.slug;
            }
        }
        
        // Auto-generate search keywords
        const keywords = new Set<string>();
        
        // Add name tokens
        if (this.name) {
            this.name.toLowerCase().split(/\s+/).forEach(word => {
                if (word.length > 2) keywords.add(word);
            });
        }
        
        // Add brand
        if (this.brand) {
            keywords.add(this.brand.toLowerCase());
        }
        
        // Add material and color
        if (this.material) {
            keywords.add(this.material.toLowerCase());
        }
        
        if (this.colorOptions) {
            this.colorOptions.forEach(color => {
                keywords.add(color.toLowerCase());
            });
        }
        
        // Add attribute keywords
        if (this.attributes) {
            Object.values(this.attributes).forEach(value => {
                if (typeof value === 'string' && value.length > 2) {
                    keywords.add(value.toLowerCase());
                }
            });
        }
        
        // Add tags
        if (this.tags) {
            this.tags.forEach(tag => {
                keywords.add(tag.toLowerCase());
            });
        }
        
        this.searchKeywords = Array.from(keywords);
        
        // Normalize attributes for better search
        if (!this.attributes) {
            this.attributes = {};
        }
        
        // Extract seater info from name if not set
        if (!this.attributes.seater && this.name) {
            const seaterMatch = this.name.match(/(\d+)[-\s]*seater/i);
            if (seaterMatch) {
                this.attributes.seater = parseInt(seaterMatch[1]);
            }
        }
        
        // Normalize primary color
        if (this.colorOptions && this.colorOptions.length > 0 && !this.attributes.color) {
            this.attributes.color = this.colorOptions[0].toLowerCase();
        }
        
        // Normalize primary material
        if (this.material && !this.attributes.material) {
            this.attributes.material = this.material.toLowerCase();
        }
        
        next();
    } catch (error) {
        next(error as CallbackError);
    }
});

// Update search score periodically (can be run via cron job)
ProductSchema.methods.updateSearchScore = function(this: IProduct): number {
    // Calculate dynamic search score based on performance metrics
    const popularityScore = Math.log(1 + (this.totalSold || 0) * 0.7 + (this.viewCount || 0) * 0.3);
    const recencyScore = Math.exp(-(Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)); // 30-day decay
    const ratingScore = (this.reviews?.average || 0) / 5;
    const stockScore = (this.inStockQuantity || 0) > 0 ? 1 : 0.5;
    
    return popularityScore * 0.4 + recencyScore * 0.3 + ratingScore * 0.2 + stockScore * 0.1;
};

export default (mongoose.models.Product as mongoose.Model<IProduct>) || 
                mongoose.model<IProduct>('Product', ProductSchema);