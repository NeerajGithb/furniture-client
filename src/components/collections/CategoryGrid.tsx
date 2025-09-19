'use client';

import { Category } from '@/types/Product';
import Image from 'next/image';
import Link from 'next/link';

interface CategoryGridProps {
  inspiration: any;
  loading: boolean;
}

const categoryImages: Record<string, string> = {
  'living-room':
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
  bedroom: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop',
  'dining-room':
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop',
  office: 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400&h=300&fit=crop',
  kitchen: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
  bathroom: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop',
  outdoor: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  'kids-room': 'https://images.unsplash.com/photo-1586227740560-8cf2732c1531?w=400&h=300&fit=crop',
  default: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
};

const CategoryGrid = ({ inspiration, loading }: CategoryGridProps) => {
  const categories: Category[] = (inspiration?.categories || []).map((c: any) =>
    typeof c === 'string'
      ? {
          _id: c,
          name: 'Unknown',
          slug: c,
          description: '',
          mainImage: { url: categoryImages['default'], alt: 'Category' },
        }
      : {
          _id: c._id,
          name: c.name,
          slug: c.slug,
          description: c.description || '',
          mainImage: {
            url: c.mainImage?.url || categoryImages[c.slug] || categoryImages['default'],
            alt: c.mainImage?.alt || c.name,
          },
        },
  );

  const shouldShowEmpty = !loading && (!categories || categories.length === 0);

  if (loading) {
    return (
      <section className="px-4 py-8 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-2 animate-pulse" />
        </div>

        <div className="flex justify-center">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 max-w-fit">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="flex flex-col items-center space-y-3">
                <div className="w-32 h-32 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (shouldShowEmpty) {
    return (
      <section className="px-4 py-12 max-w-7xl mx-auto">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-black mb-2">No Categories Available</h3>
          <p className="text-gray-600">
            Categories for this collection are currently being updated.
          </p>
        </div>
      </section>
    );
  }

  const itemsPerRow = {
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    '2xl': 6,
  };
  const showViewAllButton = categories.length > itemsPerRow.md * 2;

  return (
    <section className="px-4 py-8 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-3xl font-semibold text-black">Shop by Category</h2>
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8 max-w-fit">
          {categories.map((category) => {
            const imageUrl =
              category.mainImage?.url || categoryImages[category.slug] || categoryImages['default'];

            return (
              <div key={category._id} className="w-full max-w-[260px]">
                <Link href={`/${category.slug}`}>
                  <div className="group cursor-pointer w-full flex flex-col items-center">
                    <div className="relative w-32 h-32 mb-4 overflow-hidden rounded-full border border-gray-200 group-hover:border-gray-400 transition-colors duration-200">
                      <Image
                        src={imageUrl}
                        alt={category.mainImage?.alt || `${category.name} category`}
                        fill
                        className="object-cover rounded-full group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 640px) 150px, 128px"
                        priority={false}
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="text-base font-medium text-black group-hover:text-gray-600 transition-colors duration-200 leading-tight">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {showViewAllButton && (
        <div className="text-center mt-8">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors font-medium"
          >
            View All Categories
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </section>
  );
};

export default CategoryGrid;
