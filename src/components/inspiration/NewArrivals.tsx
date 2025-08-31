"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/Product";

interface NewArrivalsProps {
  categoryName: string;
  products: Product[];
  loading: boolean;
}

const NewArrivals = ({ categoryName, products, loading }: NewArrivalsProps) => {
    console.log("New Arrivals Props:", { categoryName, products, loading });
  
  // Dummy products for when products array is empty
  const dummyProducts = [
    {
      _id: "dummy1",
      name: `Premium ${categoryName} Collection Item`,
      price: 2999,
      originalPrice: 3999,
      onSale: true,
      images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"],
      stock: 10
    },
    {
      _id: "dummy2", 
      name: `Essential ${categoryName} Accessory`,
      price: 1599,
      onSale: false,
      images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop"],
      stock: 5
    },
    {
      _id: "dummy3",
      name: `Modern ${categoryName} Design`,
      price: 4499,
      originalPrice: 5499,
      onSale: true,
      images: ["https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop"],
      stock: 0
    },
    {
      _id: "dummy4",
      name: `Classic ${categoryName} Style`,
      price: 3299,
      onSale: false,
      images: ["https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop"],
      stock: 15
    }
  ];

  // Use dummy products if no products available
  const displayProducts = products.length > 0 ? products.slice(0, 8) : dummyProducts;

  if (loading) {
    return (
      <section className="px-4 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-4">
            New Arrivals in {categoryName}
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, idx) => (
            <div key={idx} className="animate-pulse">
              <div className="aspect-square bg-neutral-200 rounded-lg mb-3"></div>
              <div className="h-4 bg-neutral-200 rounded mb-2"></div>
              <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-16 max-w-7xl mx-auto">
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-4">
          New Arrivals in {categoryName}
        </h2>
        <p className="text-neutral-600">
          Discover the latest additions to our {categoryName.toLowerCase()} collection
        </p>
      </motion.div>

      {/* 2-row product grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
        {displayProducts.map((product, idx) => (
          <motion.div
            key={product._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
          >
            <Link href={`/products/${product._id}`}>
              <div className="group cursor-pointer">
                <div className="relative aspect-square overflow-hidden bg-neutral-100 rounded-lg">
                  <Image
                    src={product.images?.[0] || "/placeholder-product.jpg"}
                    alt={product.name}
                    fill
                    className="object-cover transition duration-500 ease-out group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                  
                  {/* Sale badge */}
                  {product.onSale && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      Sale
                    </div>
                  )}

                  {/* Quick view overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition duration-300 flex items-center justify-center">
                    <motion.div
                      className="opacity-0 group-hover:opacity-100 text-white"
                      initial={{ scale: 0.9 }}
                      whileHover={{ scale: 1 }}
                    >
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                        <span className="text-sm font-medium">Quick View</span>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-neutral-900 group-hover:text-neutral-700 transition line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    {product.onSale && product.originalPrice ? (
                      <>
                        <span className="text-sm font-medium text-neutral-900">
                          ₹{(product?.price||0).toLocaleString() }
                        </span>
                        <span className="text-xs text-neutral-500 line-through">
                          ₹{product.originalPrice.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-neutral-900">
                        ₹{(product?.price||0).toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  {/* Stock status */}
                  <div className="mt-1">
                    {(product?.stock ?? 0) > 0 ?  (
                      <span className="text-xs text-green-600">In Stock</span>
                    ) : (
                      <span className="text-xs text-red-500">Out of Stock</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* View All CTA */}
      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Link 
          href={`/products?category=${categoryName.toLowerCase()}&sort=newest`}
          className="border border-neutral-900 text-neutral-900 px-8 py-3 font-medium hover:bg-neutral-900 hover:text-white transition"
        >
          View All New {categoryName} Products
        </Link>
      </motion.div>
    </section>
  );
};

export default NewArrivals;