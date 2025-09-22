'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight, ChevronDown, X } from 'lucide-react';
import { Avatar } from './Avatar';
import { usePathname } from 'next/navigation';
import AuthModal from '../models/AuthModal';
import { useProductStore } from '@/stores/productStore';
import { useHomeStore } from '@/stores/homeStore';

const quickLinkItems = [
  { href: '/orders', label: 'My Orders' },
  { href: '/wishlist', label: 'Wishlist' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact/Help' },
];

const categoriesSelector = (state) => state.categories;
const subcategoriesSelector = (state) => state.subcategories;
const loadingCategoriesSelector = (state) => state.loadingCategories;

export default function Sidebar({ isOpen, onClose }) {
  const { user, loading } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [expandedInspirations, setExpandedInspirations] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [activeInspiration, setActiveInspiration] = useState(null);
  const pathname = usePathname();

  const sidebarRef = useRef(null);
  const inspirationRefs = useRef({});
  const headerSectionRef = useRef(null);

  const categories = useProductStore(categoriesSelector);
  const subcategories = useProductStore(subcategoriesSelector);
  const loadingCategories = useProductStore(loadingCategoriesSelector);
  const { inspirations, loading: loadingInspirations, fetchInspirations } = useHomeStore();

  const initializeRef = useRef(false);
  useEffect(() => {
    if (!initializeRef.current) {
      useProductStore.getState().initializeProducts();
      fetchInspirations();
      initializeRef.current = true;
    }
  }, [fetchInspirations]);

  const transformedInspirations = useMemo(() => {
    if (!inspirations?.length) return [];
    return inspirations.map((insp) => ({
      name: insp.title,
      slug: insp.slug,
      categories: insp.categories || [],
    }));
  }, [inspirations]);

  const toggleInspiration = useCallback(
    (inspirationName) => {
      const wasExpanded = expandedInspirations[inspirationName];

      setExpandedInspirations((prev) => ({
        ...prev,
        [inspirationName]: !prev[inspirationName],
      }));

      setActiveInspiration(inspirationName);

      if (!wasExpanded) {
        const inspiration = transformedInspirations.find((insp) => insp.name === inspirationName);
        if (inspiration?.categories) {
          const newExpandedCategories = {};
          inspiration.categories.forEach((category) => {
            newExpandedCategories[category._id] = true;
          });
          setExpandedCategories((prev) => ({
            ...prev,
            ...newExpandedCategories,
          }));
        }

        setTimeout(() => {
          const inspirationElement = inspirationRefs.current[inspirationName];
          const sidebarElement = sidebarRef.current;
          const headerElement = headerSectionRef.current;

          if (inspirationElement && sidebarElement && headerElement) {
            const headerHeight = headerElement.offsetHeight;
            const inspirationRect = inspirationElement.getBoundingClientRect();
            const sidebarRect = sidebarElement.getBoundingClientRect();

            const relativeTop = inspirationRect.top - sidebarRect.top + sidebarElement.scrollTop;

            sidebarElement.scrollTo({
              top: relativeTop - headerHeight + 108,
              behavior: 'smooth',
            });
          }
        }, 200);
      }
    },
    [transformedInspirations, expandedInspirations],
  );
  const toggleCategory = useCallback((categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  }, []);

  const handleLinkClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const InspirationsList = useMemo(() => {
    if (loadingInspirations) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-2">
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="">
        {transformedInspirations.map((inspiration) => {
          const isExpanded = expandedInspirations[inspiration.name];
          const isActive = activeInspiration === inspiration.name;
          const inspirationCategories = inspiration.categories || [];

          return (
            <div
              key={inspiration.name}
              ref={(el) => {
                if (el) {
                  inspirationRefs.current[inspiration.name] = el;
                }
              }}
              className={`border-b px-2 border-gray-300 last:border-b-0 ${
                isActive && isExpanded ? 'bg-white' : ''
              }`}
            >
              {/* Inspiration Header */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleInspiration(inspiration.name)}
                  className={`w-full text-left py-[14px] px-3 text-sm font-semibold rounded transition-colors duration-150
                    ${
                      isActive && isExpanded
                        ? 'text-[#C62878] bg-white'
                        : 'text-gray-800 hover:text-black hover:bg-gray-200'
                    }`}
                >
                  {inspiration.name.replace(/inspiration/i, '').trim()}
                </button>

                {inspirationCategories.length > 0 && (
                  <button
                    onClick={() => toggleInspiration(inspiration.name)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-150"
                    aria-label={`Toggle ${inspiration.name} categories`}
                  >
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                      <ChevronRight size={16} />
                    </motion.div>
                  </button>
                )}
              </div>

              {/* Categories List */}
              <AnimatePresence>
                {isExpanded && inspirationCategories.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pl-4 pb-2 space-y-1">
                      {inspirationCategories.map((category) => {
                        const categorySubcategories =
                          subcategories?.filter((sub) => {
                            const categoryId =
                              typeof sub.categoryId === 'object'
                                ? sub.categoryId?._id
                                : sub.categoryId;
                            return categoryId === category._id;
                          }) || [];

                        const isCategoryExpanded = expandedCategories[category._id];

                        return (
                          <div key={category._id} className="border-l-2 border-gray-100 pl-2">
                            {/* Category Header */}
                            <div className="flex items-center justify-between">
                              <Link
                                href={`/${category.slug || ''}`}
                                onClick={handleLinkClick}
                                className="flex-1 py-2 px-2 text-xs font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded transition-colors duration-150"
                              >
                                {category.name}
                              </Link>

                              {categorySubcategories.length > 0 && (
                                <button
                                  onClick={() => toggleCategory(category._id)}
                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-150"
                                  aria-label={`Toggle ${category.name} subcategories`}
                                >
                                  <motion.div
                                    animate={{
                                      rotate: isCategoryExpanded ? 180 : 0,
                                    }}
                                    transition={{
                                      duration: 0.15,
                                      ease: 'easeInOut',
                                    }}
                                  >
                                    <ChevronDown size={12} />
                                  </motion.div>
                                </button>
                              )}
                            </div>

                            {/* Subcategories List */}
                            <AnimatePresence>
                              {isCategoryExpanded && categorySubcategories.length > 0 && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{
                                    duration: 0.25,
                                    ease: 'easeInOut',
                                  }}
                                  className="overflow-hidden"
                                >
                                  <div className="pl-3 space-y-1 border-l border-gray-100 ml-2">
                                    {categorySubcategories.map((subcategory) => (
                                      <Link
                                        key={subcategory._id}
                                        href={`/${subcategory.slug}`}
                                        onClick={handleLinkClick}
                                        className="block py-1.5 px-2 text-xs text-gray-600 hover:text-black hover:bg-gray-50 rounded transition-colors duration-150"
                                      >
                                        {subcategory.name}
                                      </Link>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    );
  }, [
    loadingInspirations,
    transformedInspirations,
    expandedInspirations,
    expandedCategories,
    activeInspiration,
    subcategories,
    toggleInspiration,
    toggleCategory,
    handleLinkClick,
  ]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/70 z-[999]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Sidebar */}
            <motion.aside
              ref={sidebarRef}
              className={`fixed top-0 left-0 h-full w-[60%] max-w-[300px] bg-gray-200 z-[1000] overflow-y-auto shadow-2xl`}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
            >
              <div className="">
                <div ref={headerSectionRef} className="p-4">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold tracking-tight">
                      <span className="text-[#2B2F42]">V</span>
                      <span className="text-[#C62878]">Furniture</span>
                    </span>
                    <button onClick={onClose}>
                      <X className="text-gray-600 hover:text-black transition" />
                    </button>
                  </div>
                  {/* Auth Block */}
                  <div className="mb-6">
                    {!loading && user ? (
                      <Link
                        href="/account"
                        onClick={handleLinkClick}
                        className="flex items-center justify-between bg-gray-50 rounded-xs px-3 py-2 hover:bg-gray-100 transition-colors duration-150"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <Avatar
                            src={user?.photoURL || ''}
                            alt="User Avatar"
                            fallbackText={user?.name?.[0]?.toUpperCase() || 'U'}
                          />
                          <div className="overflow-hidden">
                            <div className="text-sm font-semibold text-gray-800 truncate">
                              {user?.name || 'User'}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          setIsAuthOpen(true);
                          onClose();
                        }}
                        className="w-full py-2 text-sm bg-black text-white rounded-xs font-medium hover:bg-gray-900 transition-colors duration-150"
                      >
                        Login / Signup
                      </button>
                    )}
                  </div>
                </div>

                {/* Inspirations Section */}
                <div className="mb-6">
                  <div className={`border-t border-gray-300`}>{InspirationsList}</div>
                </div>

                {/* Quick Links */}
                <div className="border-t border-gray-300 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h3>
                  <div className="space-y-1">
                    {quickLinkItems.map(({ href, label }) => {
                      const isActive = pathname === href;
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={handleLinkClick}
                          className={`relative group flex items-center justify-between px-1 py-2 rounded-lg transition-all duration-150 text-sm font-medium ${
                            isActive
                              ? 'bg-black text-white'
                              : 'text-gray-700 hover:text-black hover:bg-gray-50'
                          }`}
                        >
                          <span>{label}</span>
                          <ChevronRight
                            size={14}
                            className={`transition-colors duration-150 ${
                              isActive ? 'text-white' : 'text-gray-400'
                            }`}
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
