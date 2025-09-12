"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import ProductCard from "../product/ProductCard";
import { Product } from "@/types/Product";
import { handleApiResponse } from "@/utils/fetchWithCredentials";

interface ProductShowcaseProps {
  productsData?: Product[];
}

const ProductShowcase = ({ productsData }: ProductShowcaseProps) => {
  const [products, setProducts] = useState<Product[]>(productsData || []);
  const [loading, setLoading] = useState(!productsData);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const getItemsPerView = () => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 768) return 2;
    if (window.innerWidth < 1024) return 3;
    return 4;
  };

  const [itemsPerView, setItemsPerView] = useState(4);
  const scrollStep = isMobile ? 1 : 3;

  const [row1Index, setRow1Index] = useState<number>(0);
  const [row2Index, setRow2Index] = useState<number>(0);

  useEffect(() => {
    const handleResize = () => {
      const newItemsPerView = getItemsPerView();
      const mobile = window.innerWidth < 768;
      
      setItemsPerView(newItemsPerView);
      setIsMobile(mobile);
      setRow1Index(0);
      setRow2Index(0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!productsData) {
      const fetchShowcaseProducts = async () => {
        try {
          setError(null);
          const res = await fetch("/api/products/showcase");
          
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          
          const data = await handleApiResponse(res);
          setProducts(data.products || []);
        } catch (err) {
          console.error("Failed to fetch showcase products:", err);
          setError(err instanceof Error ? err.message : "Failed to load products");
          setProducts([]);
        } finally {
          setLoading(false);
        }
      };
      fetchShowcaseProducts();
    }
  }, [productsData]);

  const midPoint = Math.ceil(products.length / 2);
  const row1Products = products.slice(0, midPoint);
  const row2Products = products.slice(midPoint);

  const ProductSkeleton = () => (
    <div className="flex-shrink-0 animate-pulse w-full">
      <div className="bg-gray-200 aspect-square mb-3"></div>
      <div className="h-4 bg-gray-200 mb-2"></div>
      <div className="h-3 bg-gray-200 w-3/4"></div>
    </div>
  );

  const renderSkeletonRow = () => (
    <div className="relative mb-8 overflow-hidden">
      <div className={`grid gap-2 sm:gap-3 md:gap-4 ${
        itemsPerView === 1 ? 'grid-cols-1' :
        itemsPerView === 2 ? 'grid-cols-2' :
        itemsPerView === 3 ? 'grid-cols-3' :
        'grid-cols-5'
      }`}>
        {Array.from({ length: itemsPerView }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    </div>
  );

  const renderProductRow = (
    products: Product[],
    currentIndex: number,
    setIndex: React.Dispatch<React.SetStateAction<number>>,
    rowLabel: string
  ) => {
    const maxIndex = Math.max(0, products.length - itemsPerView);
    const isAtStart = currentIndex === 0;
    const isAtEnd = currentIndex >= maxIndex;
    
    const nextSlide = () =>
      setIndex((prev) => Math.min(prev + scrollStep, maxIndex));
    const prevSlide = () => setIndex((prev) => Math.max(prev - scrollStep, 0));

    const showViewMoreButton = products.length > itemsPerView;
    let itemsToShow: (Product | 'view-more')[] = [];
    
    if (showViewMoreButton) {
      if (isAtEnd && !isMobile) {
        const slotsForProducts = itemsPerView - 1;
        const lastProducts = products.slice(-slotsForProducts);
        itemsToShow = [...lastProducts, 'view-more'];
      } else {
        itemsToShow = products.slice(currentIndex, currentIndex + itemsPerView);
        if (isMobile && itemsToShow.length < itemsPerView) {
          itemsToShow.push('view-more');
        }
      }
    } else {
      itemsToShow = products;
    }

    const gridClass = `grid gap-2 sm:gap-3 md:gap-4 ${
      itemsPerView === 1 ? 'grid-cols-1' :
      itemsPerView === 2 ? 'grid-cols-2' :
      itemsPerView === 3 ? 'grid-cols-3' :
      'grid-cols-4'
    }`;

    return (
      <div className=" max-w-6xl mx-auto">
        <div className="relative overflow-hidden p-2">
          <div className={gridClass} >
            {itemsToShow.map((item, index) => {
              if (item === 'view-more') {
                return (
                  <div key="view-more" className="flex justify-center items-center min-h-[200px] sm:min-h-[250px]">
                    <div className="w-full h-full flex flex-col gap-2">
                      <Link
                        href="/products"
                        className="flex-1 flex flex-col items-center justify-center border border-white/20 text-xs sm:text-sm font-medium bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg p-4"
                      >
                        <svg
                          className="w-6 h-6 sm:w-8 sm:h-8 mb-2 text-gray-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24" 
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        <span className="text-gray-700 text-center">View More</span>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setIndex(0);
                        }}
                        className="w-full py-2 border border-gray-300 text-xs font-medium bg-white hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                );
              }
              
              return (
                <div key={(item as Product)._id} >
                  <ProductCard product={item as Product} />
                </div>
              );
            })}
            
            {Array.from({ length: Math.max(0, itemsPerView - itemsToShow.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="invisible">
                <div className="w-full aspect-square"></div>
              </div>
            ))}
          </div>

          {!isAtStart && showViewMoreButton && (
            <button
              onClick={prevSlide}
              className={`rounded-full absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 backdrop-blur border border-gray-300 flex items-center justify-center hover:bg-white transition-all shadow-lg ${
                isMobile ? 'touch-manipulation' : ''
              }`}
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {!isAtEnd && showViewMoreButton && (
            <button
              onClick={nextSlide}
              className={`rounded-full absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 backdrop-blur border border-gray-300 flex items-center justify-center hover:bg-white transition-all shadow-lg ${
                isMobile ? 'touch-manipulation' : ''
              }`}
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>

        {isMobile && showViewMoreButton && (
          <div className="flex justify-center mt-4 gap-2">
            {Array.from({ length: Math.ceil(products.length / itemsPerView) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i * itemsPerView)}
                className={`w-2 h-2 transition-all ${
                  Math.floor(currentIndex / itemsPerView) === i
                    ? 'bg-gray-800'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <section className="px-4 mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light">Featured Products</h2>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-2">
            Handpicked pieces for discerning taste
          </p>
        </div>
        <div className="space-y-4 mx-auto">
          <div>
            <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-gray-800 px-2 sm:px-0">
              Featured Collection
            </h3>
            {renderSkeletonRow()}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-gray-800 px-2 sm:px-0">
              Trending Now
            </h3>
            {renderSkeletonRow()}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-4 mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light">Featured Products</h2>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-2">
            Handpicked pieces for discerning taste
          </p>
        </div>
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">Unable to load products right now</p>
            <p className="text-xs text-gray-400 mt-1">Please try again later</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="border border-black text-black px-6 py-2 text-sm font-medium hover:bg-black hover:text-white transition-colors"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="px-4 mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light">Featured Products</h2>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-2">
            Handpicked pieces for discerning taste
          </p>
        </div>
        <div className="text-center py-12">
          <div className="text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm">No products available</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mx-auto">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-light">Our Top Picks</h2>
        <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-2">
          Showcasing our finest designs, crafted to perfection
        </p>
      </div>

      <div className="space-y-4">
        {row1Products.length > 0 &&
          renderProductRow(row1Products, row1Index, setRow1Index, "Featured Collection")}
        {row2Products.length > 0 &&
          renderProductRow(row2Products, row2Index, setRow2Index, "Trending Now")}
      </div>
    </section>
  );
};

export default ProductShowcase;