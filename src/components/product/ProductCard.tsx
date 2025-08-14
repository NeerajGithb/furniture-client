'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Star, StarIcon } from 'lucide-react';

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

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
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
          <Star key={i} className="w-3 h-3 fill-black text-black" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-3 h-3">
            <Star className="w-3 h-3 text-gray-300 absolute" />
            <div className="overflow-hidden w-1/2">
              <Star className="w-3 h-3 fill-black text-black" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="w-3 h-3 text-gray-300" />
        );
      }
    }
    return stars;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Link href={`/products/${product._id}`}>
        <div className="group bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg rounded-sm overflow-hidden">
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden bg-gray-50">
            {product.images && product.images.length > 0 && (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              {!product.inventory.available && (
                <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded-sm font-medium">
                  Out of Stock
                </span>
              )}
              {hasDiscount && (
                <span className="bg-black text-white text-xs px-2 py-1 rounded-sm font-medium">
                  -{discountPercentage}%
                </span>
              )}
              {product.featured && (
                <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-sm font-medium">
                  Featured
                </span>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="p-4 space-y-2">
            {/* Brand */}
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              {product.brand}
            </div>

            {/* Product Name */}
            <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-black transition-colors">
              {product.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {renderStars(product.reviews.average)}
              </div>
              <span className="text-xs text-gray-500 ml-1">
                ({product.reviews.count})
              </span>
            </div>

            {/* Pricing */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg text-black">
                ₹{product.pricing.finalPrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-500 line-through">
                  ₹{product.pricing.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="text-xs">
              {product.inventory.available ? (
                <span className="text-green-600 font-medium">
                  {product.inventory.stock > 10
                    ? 'In Stock'
                    : `Only ${product.inventory.stock} left`
                  }
                </span>
              ) : (
                <span className="text-red-600 font-medium">Out of Stock</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;