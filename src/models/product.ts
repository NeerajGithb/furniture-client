import mongoose, { Schema, Document, CallbackError } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description?: string;
  categoryId: Schema.Types.ObjectId;
  subCategoryId: Schema.Types.ObjectId;
  itemId: string;
  sku?: string;
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
  isActive?: boolean;
  ratings?: number;

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

  keywords?: string[];
  bulletPoints?: string[];
  highlights?: string[];
  faq?: { question: string; answer: string }[];

  totalSold?: number;
  viewCount?: number;
  wishlistCount?: number;

  brand?: string;
  warranty?: string;
  returnPolicy?: string;

  categorySlug?: string;
  subcategorySlug?: string;
  searchKeywords?: string[];
  attributes?: {
    seater?: number;
    color?: string;
    material?: string;
    style?: string;
    room?: string;
    [key: string]: any;
  };

  createdAt: Date;
  updatedAt: Date;

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
    sku: { type: String, unique: true, sparse: true },
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
        publicId: { type: String },
      },
    ],
    mainImage: {
      url: { type: String },
      alt: { type: String },
      publicId: { type: String },
    },
    badge: { type: String },
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
    weight: { type: Number },
    isPublished: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    ratings: { type: Number, min: 0, max: 5, default: 0 },

    reviews: {
      average: { type: Number, min: 0, max: 5, default: 0 },
      count: { type: Number, default: 0 },
      breakdown: {
        5: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        1: { type: Number, default: 0 },
      },
    },

    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },

    shippingInfo: {
      freeShipping: { type: Boolean, default: true },
      estimatedDays: { type: Number, default: 3 },
      shippingCost: { type: Number, default: 0 },
    },

    variants: [
      {
        color: { type: String },
        size: { type: String },
        sku: { type: String },
        price: { type: Number },
        inStock: { type: Number },
      },
    ],

    slug: { type: String, unique: true, sparse: true },
    metaTitle: { type: String },
    metaDescription: { type: String },

    keywords: [{ type: String }],
    bulletPoints: [{ type: String }],
    highlights: [{ type: String }],
    faq: [{ question: { type: String }, answer: { type: String } }],

    totalSold: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },

    brand: { type: String },
    warranty: { type: String },
    returnPolicy: { type: String, default: '30 days return' },

    categorySlug: { type: String, index: true },
    subcategorySlug: { type: String, index: true },
    searchKeywords: [{ type: String }],
    attributes: {
      seater: { type: Number, index: true },
      color: { type: String, index: true },
      material: { type: String, index: true },
      style: { type: String, index: true },
      room: { type: String, index: true },
    },
  },
  { timestamps: true },
);

ProductSchema.index(
  {
    name: 'text',
    description: 'text',
    tags: 'text',
    brand: 'text',
    searchKeywords: 'text',
  },
  {
    weights: {
      name: 10,
      brand: 5,
      tags: 3,
      searchKeywords: 3,
      description: 1,
    },
    name: 'product_text_search',
  },
);

ProductSchema.index({ isPublished: 1, categorySlug: 1, finalPrice: 1 });
ProductSchema.index({ isPublished: 1, subcategorySlug: 1, finalPrice: 1 });
ProductSchema.index({ isPublished: 1, brand: 1, finalPrice: 1 });
ProductSchema.index({ isPublished: 1, 'attributes.color': 1 });
ProductSchema.index({ isPublished: 1, 'attributes.material': 1 });
ProductSchema.index({ isPublished: 1, 'attributes.seater': 1 });

ProductSchema.index({ isPublished: 1, isFeatured: -1, createdAt: -1 });
ProductSchema.index({ isPublished: 1, totalSold: -1 });
ProductSchema.index({ isPublished: 1, 'reviews.average': -1 });
ProductSchema.index({ isPublished: 1, viewCount: -1 });

ProductSchema.index({ categoryId: 1, subCategoryId: 1 });
ProductSchema.index({ isPublished: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ isNewArrival: 1 });
ProductSchema.index({ isBestSeller: 1 });
ProductSchema.index({ 'reviews.average': -1 });
ProductSchema.index({ totalSold: -1 });
ProductSchema.index({ brand: 1 });

ProductSchema.index(
  { isPublished: 1, inStockQuantity: 1 },
  {
    partialFilterExpression: { inStockQuantity: { $gt: 0 } },
    name: 'stock_available_products',
  },
);

ProductSchema.index({ isPublished: 1, finalPrice: 1 });
ProductSchema.index({ isPublished: 1, finalPrice: -1 });

ProductSchema.index({ categoryId: 1, isPublished: 1 });
ProductSchema.index({ subCategoryId: 1, isPublished: 1 });

ProductSchema.index({ itemId: 1 }, { unique: true });

ProductSchema.pre<IProduct>('save', async function (next: (err?: CallbackError) => void) {
  try {
    if (!this.slug && this.name) {
      const baseSlug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      let slug = baseSlug;
      let counter = 1;

      const ProductModel = mongoose.models.Product as mongoose.Model<IProduct>;

      while (await ProductModel.findOne({ slug, _id: { $ne: this._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      this.slug = slug;
    }

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

    const keywords = new Set<string>();

    if (this.name) {
      this.name
        .toLowerCase()
        .split(/\s+/)
        .forEach((word) => {
          if (word.length > 2) keywords.add(word);
        });
    }

    if (this.brand) {
      keywords.add(this.brand.toLowerCase());
    }

    if (this.material) {
      keywords.add(this.material.toLowerCase());
    }

    if (this.colorOptions) {
      this.colorOptions.forEach((color) => {
        keywords.add(color.toLowerCase());
      });
    }

    if (this.attributes) {
      Object.values(this.attributes).forEach((value) => {
        if (typeof value === 'string' && value.length > 2) {
          keywords.add(value.toLowerCase());
        }
      });
    }

    if (this.tags) {
      this.tags.forEach((tag) => {
        keywords.add(tag.toLowerCase());
      });
    }

    this.searchKeywords = Array.from(keywords);

    if (!this.attributes) {
      this.attributes = {};
    }

    if (!this.attributes.seater && this.name) {
      const seaterMatch = this.name.match(/(\d+)[-\s]*seater/i);
      if (seaterMatch) {
        this.attributes.seater = parseInt(seaterMatch[1]);
      }
    }

    if (this.colorOptions && this.colorOptions.length > 0 && !this.attributes.color) {
      this.attributes.color = this.colorOptions[0].toLowerCase();
    }

    if (this.material && !this.attributes.material) {
      this.attributes.material = this.material.toLowerCase();
    }

    next();
  } catch (error) {
    next(error as CallbackError);
  }
});

ProductSchema.pre<IProduct>('validate', function (next: (err?: CallbackError) => void) {
  if (!this.sku) {
    const namePart = this.name ? this.name.toUpperCase().replace(/\s+/g, '-') : 'PRODUCT';
    const randomPart = Math.random().toString(36).substring(2, 18).toUpperCase();
    this.sku = `${namePart}-${randomPart}`;
  }
  next();
});

ProductSchema.methods.updateSearchScore = function (this: IProduct): number {
  const popularityScore = Math.log(1 + (this.totalSold || 0) * 0.7 + (this.viewCount || 0) * 0.3);
  const recencyScore = Math.exp(
    -(Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30),
  );
  const ratingScore = (this.reviews?.average || 0) / 5;
  const stockScore = (this.inStockQuantity || 0) > 0 ? 1 : 0.5;

  return popularityScore * 0.4 + recencyScore * 0.3 + ratingScore * 0.2 + stockScore * 0.1;
};

export default (mongoose.models.Product as mongoose.Model<IProduct>) ||
  mongoose.model<IProduct>('Product', ProductSchema);
