"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useHomeStore } from "@/stores/homeStore";
import CategoryGrid from "@/components/collections/CategoryGrid";
import RelatedProducts from "@/components/inspiration/RelatedProducts";
import NewArrivals from "@/components/inspiration/NewArrivals";
import MoreInspirationIdeas from "@/components/inspiration/MoreInspirationIdeas";
import Link from "next/link";

import { ArrowLeft, Home, Search } from "lucide-react";

const Page = () => {
  const params = useParams();
  const router = useRouter();
  const category = params?.slug as string; 
  const inspirationSlug = category.replace("-collection", "-inspiration");
  const {
    currentInspiration,
    fetchInspirations,
    fetchInspirationBySlug,
    inspirationLoading,
    inspirationError,
    clearInspirationError,
    initialized,
  } = useHomeStore();

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      if (!inspirationSlug || isInitialized) return;

      try {
        setIsInitialized(true);
        clearInspirationError();

        // Ensure inspirations are loaded first
        if (!initialized) {
          await fetchInspirations();
        }

        // Fetch by slug now
        await fetchInspirationBySlug(inspirationSlug);
      } catch (error) {
        console.error("Error initializing inspiration page:", error);
      }
    };

    initializePage();
  }, [
    inspirationSlug,
    fetchInspirationBySlug,
    fetchInspirations,
    isInitialized,
    clearInspirationError,
    initialized,
  ]);

  
  

  if (inspirationLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-black mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-black mb-2">
                Loading Collection
              </h2>
              <p className="text-gray-600">
                Please wait...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (inspirationError) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="min-h-screen flex items-center justify-center py-12">
            <div className="text-center max-w-lg mx-auto">
              <div className="bg-white border border-gray-200 rounded-lg p-8 sm:p-12">
                <h2 className="text-2xl font-bold text-black mb-4">
                  Collection Not Found
                </h2>
                <p className="text-gray-600 mb-8">
                  We couldn't find the collection you're looking for.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => router.back()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2 text-black bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                  </button>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors font-medium"
                  >
                    <Home className="w-4 h-4" />
                    Go Home
                  </Link>
                  <Link
                    href="/collections"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors font-medium"
                  >
                    <Search className="w-4 h-4" />
                    Browse Collections
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentInspiration && !inspirationLoading && isInitialized) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="min-h-screen flex items-center justify-center py-12">
            <div className="text-center max-w-lg mx-auto">
              <div className="bg-white border border-gray-200 rounded-lg p-8 sm:p-12">
                <h2 className="text-2xl font-bold text-black mb-4">
                  Collection Not Available
                </h2>
                <p className="text-gray-600 mb-8">
                  The collection you're looking for is currently not available.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => router.back()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2 text-black bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                  </button>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors font-medium"
                  >
                    <Home className="w-4 h-4" />
                    Go Home
                  </Link>
                  <Link
                    href="/collections"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors font-medium"
                  >
                    <Search className="w-4 h-4" />
                    Browse All Collections
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {currentInspiration && (
        <div className="w-full">
          {/* Category Grid Section */}
          <div className="mb-8">
            <CategoryGrid inspiration={currentInspiration} loading={false} />
          </div>

          {/* Related Products Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <RelatedProducts
              inspirationSlug={currentInspiration.slug}
              limit={20}
            />
          </div>

          {/* New Arrivals Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <NewArrivals
              inspirationSlug={currentInspiration.slug}
              limit={20}
              sort="newest"
            />
          </div>

          {/* More Inspiration Ideas Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <MoreInspirationIdeas
              currentInspirationId={currentInspiration._id}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
