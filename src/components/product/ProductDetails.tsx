'use client';

import { motion } from 'framer-motion';
import { Star, Truck, Shield, RotateCcw } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  subCategory: string;
  brand: string;
  material: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  weight: number;
  images: string[];
  pricing: {
    originalPrice: number;
    finalPrice: number;
    discount?: number;
  };
  inventory: {
    stock: number;
    available: boolean;
  };
  reviews: {
    average: number;
    count: number;
    list: Array<{
      user: string;
      rating: number;
      comment: string;
      date: Date;
    }>;
  };
  featured: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface ProductDetailsProps {
  product: Product;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  const hasDiscount = product.pricing.discount && product.pricing.discount > 0;
  const discountPercentage = hasDiscount
    ? Math.round(((product.pricing.originalPrice - product.pricing.finalPrice) / product.pricing.originalPrice) * 100)
    : 0;

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-black text-black" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-4 h-4">
            <Star className="w-4 h-4 text-gray-300 absolute" />
            <div className="overflow-hidden w-1/2">
              <Star className="w-4 h-4 fill-black text-black" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="w-4 h-4 text-gray-300" />
        );
      }
    }
    return stars;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Brand */}
      <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">
        {product.brand}
      </div>

      {/* Product Name */}
      <h1 className="text-3xl font-semibold text-gray-900 leading-tight">
        {product.name}
      </h1>

      {/* Rating and Reviews */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {renderStars(product.reviews.average)}
          <span className="ml-2 text-sm font-medium text-gray-900">
            {product.reviews.average.toFixed(1)}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          ({product.reviews.count} {product.reviews.count === 1 ? 'review' : 'reviews'})
        </span>
      </div>

      {/* Pricing */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-black">
            ₹{product.pricing.finalPrice.toLocaleString()}
          </span>
          {hasDiscount && (
            <>
              <span className="text-xl text-gray-500 line-through">
                ₹{product.pricing.originalPrice.toLocaleString()}
              </span>
              <span className="bg-black text-white text-sm px-2 py-1 rounded-sm font-medium">
                {discountPercentage}% OFF
              </span>
            </>
          )}
        </div>
        <p className="text-sm text-gray-600">Inclusive of all taxes</p>
      </div>

      {/* Stock Status */}
      <div className="space-y-2">
        {product.inventory.available ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-700 font-medium">
              {product.inventory.stock > 10
                ? 'In Stock'
                : `Only ${product.inventory.stock} left in stock`
              }
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-red-700 font-medium">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Description</h3>
        <p className="text-gray-600 leading-relaxed">
          {product.description}
        </p>
      </div>

      {/* Specifications */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Specifications</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Category</span>
              <span className="font-medium text-gray-900">{product.category}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Sub Category</span>
              <span className="font-medium text-gray-900">{product.subCategory}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Material</span>
              <span className="font-medium text-gray-900">{product.material}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Weight</span>
              <span className="font-medium text-gray-900">{product.weight} kg</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Length</span>
              <span className="font-medium text-gray-900">{product.dimensions.length} cm</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Width</span>
              <span className="font-medium text-gray-900">{product.dimensions.width} cm</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Height</span>
              <span className="font-medium text-gray-900">{product.dimensions.height} cm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-sm text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-4 pt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!product.inventory.available}
          className={`w-full py-4 px-6 rounded-sm font-semibold text-lg transition-all duration-200 ${product.inventory.available
              ? 'bg-black text-white hover:bg-gray-800 shadow-md hover:shadow-lg'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
        >
          {product.inventory.available ? 'Add to Cart' : 'Out of Stock'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 px-6 rounded-sm font-semibold text-lg border-2 border-gray-200 text-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
        >
          Add to Wishlist
        </motion.button>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-3 text-sm">
          <Truck className="w-5 h-5 text-gray-600" />
          <div>
            <div className="font-medium text-gray-900">Free Shipping</div>
            <div className="text-gray-600">On orders over ₹999</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <RotateCcw className="w-5 h-5 text-gray-600" />
          <div>
            <div className="font-medium text-gray-900">Easy Returns</div>
            <div className="text-gray-600">30-day return policy</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Shield className="w-5 h-5 text-gray-600" />
          <div>
            <div className="font-medium text-gray-900">Warranty</div>
            <div className="text-gray-600">1-year manufacturer warranty</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductDetails;