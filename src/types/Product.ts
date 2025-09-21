import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react';

// types/Product.ts
export interface Product {
  _id: string;
  name: string;
  itemId: string;
  sku?: string;
  originalPrice: number;
  finalPrice: number;
  createdAt: Date;
  updatedAt: Date;

  // ✅ Optional / descriptive fields
  description?: string;
  brand?: string;
  warranty?: string;
  returnPolicy?: string;

  // ✅ Categories
  categoryId?: {
    _id: string;
    name: string;
    slug: string;
  };
  subCategoryId?: {
    _id: string;
    name: string;
    slug: string;
  };

  // ✅ Pricing / stock
  emiPrice?: number;
  discountPercent?: number;
  inStockQuantity?: number;

  // ✅ Options
  colorOptions?: string[];
  size?: string[];
  material?: string;
  tags?: string[];

  // ✅ Media
  galleryImages?: Array<{
    url: string;
    alt?: string;
    publicId: string;
  }>;
  mainImage?: {
    url: string;
    alt?: string;
    publicId: string;
  };
  badge?: string;

  // ✅ Dimensions & weight
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  weight?: number;

  // ✅ Status
  isPublished?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;

  // ✅ Ratings & reviews
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
    list?: Array<{
      user: string;
      rating: number;
      comment: string;
      date: Date;
    }>;
  };

  // ✅ Shipping
  shippingInfo?: {
    freeShipping?: boolean;
    estimatedDays?: number;
    shippingCost?: number;
  };

  // ✅ Variants
  variants?: Array<{
    color?: string;
    size?: string;
    sku?: string;
    price?: number;
    inStock?: number;
  }>;

  // ✅ SEO
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;

  // ✅ NEW LIGHT SEO / FRONTEND FIELDS
  keywords?: string[];
  bulletPoints?: string[];
  highlights?: string[];
  faq?: Array<{ question: string; answer: string }>;

  // ✅ Business / sales data
  totalSold?: number;
  viewCount?: number;
  wishlistCount?: number;

  // ✅ SEARCH-SPECIFIC ENHANCEMENTS
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

  // ✅ Frontend compatibility fields
  images?: string;
  onSale?: string;
  price?: number;
  stock?: number;
}

// 🎯 Lightweight type for cards
export interface ProductCardData
  extends Pick<
    Product,
    | '_id'
    | 'name'
    | 'itemId'
    | 'finalPrice'
    | 'originalPrice'
    | 'discountPercent'
    | 'badge'
    | 'mainImage'
    | 'ratings'
    | 'reviews'
    | 'inStockQuantity'
  > {}

// 🎯 Filters type
export interface ProductFilters {
  categories: Array<{
    _id: string;
    name: string;
    slug: string;
  }>;
  subcategories: Array<{
    _id: string;
    name: string;
    slug: string;
    categoryId: string;
  }>;
  materialTypes: string[];
  maxMinPrice: {
    minPrice: number;
    maxPrice: number;
  };
  maxPrice: number;
  minPrice: number;
  inStock: boolean;
  onSale: boolean;
  sortOptions: string[];
  sort: string;
  page: number;
  limit: number;
  material: string | null;
  brand: string | null;
  color: string | null;
  seater: number | null;
  style: string | null;
  room: string | null;
  materials: string[];
  brands: string[];
  colors: string[];
  attributes: {
    seater?: number[];
    style?: string[];
    room?: string[];
  };
  priceRange: {
    minPrice: number;
    maxPrice: number;
  };
}

// 🎯 API response type
export interface ProductsApiResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: ProductFilters;
  appliedFilters: {
    category: string | null;
    subcategory: string | null;
    material: string | null;
    brand: string | null;
    color: string | null;
    seater: number | null;
    style: string | null;
    room: string | null;
    priceRange: { min: number | null; max: number | null } | null;
    inStock: boolean | null;
    onSale: boolean | null;
    sort: string;
  };
  meta: {
    fetchTime: number;
    cached: boolean;
    hasMore?: boolean;
  };
}

export interface Category {
  _id: Key | null | undefined;
  slug: string;
  name:
    | string
    | number
    | bigint
    | boolean
    | ReactElement<unknown, string | JSXElementConstructor<any>>
    | Iterable<ReactNode>
    | ReactPortal
    | Promise<
        | string
        | number
        | bigint
        | boolean
        | ReactPortal
        | ReactElement<unknown, string | JSXElementConstructor<any>>
        | Iterable<ReactNode>
        | null
        | undefined
      >
    | null
    | undefined;
  description: string;
  mainImage: {
    url: string;
    alt: string;
  };
  products?: Product[];
}

export interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  mainImage?: {
    url?: string;
    alt?: string;
  };
  categoryId: {
    _id: string;
    name: string;
    slug: string;
  };
}

export interface IInspiration {
  _id: string;
  title: string;
  slug: string;
  description: string;
  heroImage: { url: string; alt: string; publicId: string };
  tags: string[];
  keywords: string[];
  categories:
    | string[]
    | Array<{
        _id: string;
        name: string;
        slug: string;
        mainImage?: { url: string; alt: string; publicId: string };
      }>;
  createdAt: string;
  updatedAt: string;
}
