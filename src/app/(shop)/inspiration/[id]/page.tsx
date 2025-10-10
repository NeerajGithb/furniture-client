'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useHomeStore } from '@/stores/homeStore';
import InspirationBanner from '@/components/inspiration/InspirationBanner';
import CategoryGrid from '@/components/inspiration/CategoryGrid';
import RelatedProducts from '@/components/inspiration/RelatedProducts';
import NewArrivals from '@/components/inspiration/NewArrivals';
import MoreInspirationIdeas from '@/components/inspiration/MoreInspirationIdeas';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Loading from '@/components/ui/Loader';

const InspirationDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const inspirationSlug = params?.id as string;

  const {
    currentInspiration,
    fetchInspirationBySlug,
    fetchInspirations,
    inspirationLoading,
    inspirationError,
    clearInspirationError,
    initialized,
  } = useHomeStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      if (!inspirationSlug || isInitialized) return;

      try {
        setIsInitialized(true);
        clearInspirationError();

        if (!initialized) {
          await fetchInspirations();
        }

        await fetchInspirationBySlug(inspirationSlug);
      } catch (error) {
        console.error('Error initializing inspiration page:', error);
      } finally {
        setHasFetched(true);
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
    return <Loading fullScreen variant="spinner" size="lg" />;
  }

  if (inspirationError) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="min-h-screen flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-md mx-auto"
            >
              <div className="bg-gray-50 rounded-2xl p-8 sm:p-12">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  {inspirationError === 'Inspiration not found'
                    ? 'Inspiration Not Found'
                    : 'Something Went Wrong'}
                </h1>
                <p className="text-gray-600 mb-8">
                  {inspirationError === 'Inspiration not found'
                    ? "The inspiration you're looking for doesn't exist or has been moved."
                    : 'We encountered an error while loading this inspiration. Please try again.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.back()}
                    className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                  >
                    Go Back
                  </button>
                  <Link
                    href="/inspiration"
                    className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium text-center"
                  >
                    Browse Inspirations
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (hasFetched && !currentInspiration) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="min-h-screen flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-md mx-auto"
            >
              <div className="bg-gray-50 rounded-2xl p-8 sm:p-12">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  Inspiration Not Found
                </h1>
                <p className="text-gray-600 mb-8">
                  The inspiration you're looking for doesn't exist.
                </p>
                <Link
                  href="/inspiration"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
                >
                  Browse All Inspirations
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {currentInspiration && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <InspirationBanner inspiration={currentInspiration} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <CategoryGrid inspiration={currentInspiration} loading={false} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <RelatedProducts inspirationSlug={currentInspiration.slug} limit={20} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <NewArrivals inspirationSlug={currentInspiration.slug} limit={20} sort="newest" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <MoreInspirationIdeas currentInspirationId={currentInspiration._id} />
          </motion.div>
        </>
      )}
    </div>
  );
};

export default InspirationDetailPage;
