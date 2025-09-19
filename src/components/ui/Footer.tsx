'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useProductStore } from '@/stores/productStore';
interface AccordionState {
  shop: boolean;
  categories: boolean;
  customerCare: boolean;
}

const Footer: React.FC = () => {
  const storeSelectors = {
    categories: (state: { categories: any[] }) => state.categories,
    loading: (state: { loading: boolean }) => state.loading,
    error: (state: { error: string | null }) => state.error,
  };
  const categories = useProductStore(storeSelectors.categories);
  const loading = useProductStore(storeSelectors.loading);

  const [accordionState, setAccordionState] = useState<AccordionState>({
    shop: false,
    categories: false,
    customerCare: false,
  });

  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const currentYear = new Date().getFullYear();
  const maxDisplayCategories = 5;
  const displayedCategories = categories.slice(0, maxDisplayCategories);
  const remainingCount = categories.length - maxDisplayCategories;

  const toggleAccordion = (section: keyof AccordionState) => {
    setAccordionState((prev) => ({
      shop: false,
      categories: false,
      customerCare: false,
      [section]: !prev[section],
    }));
  };

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setEmailStatus('error');
      return;
    }
    setEmailStatus('success');
    setEmail('');
  };

  return (
    <footer className="bg-white text-gray-900 border-t border-gray-300">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="mb-6">
                <Image
                  src="/logo.png"
                  alt="Premium Furniture Logo"
                  width={40}
                  height={40}
                  className="mb-4"
                />
                <p className="text-gray-600 text-sm leading-relaxed">
                  Crafting exceptional furniture
                  <br />
                  for discerning homes since 1985
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-500">
                  <svg
                    className="w-4 h-4 mr-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>123 Furniture Ave, NY 10001</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <svg
                    className="w-4 h-4 mr-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <svg
                    className="w-4 h-4 mr-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>hello@premiumfurniture.com</span>
                </div>
              </div>

              <div className="flex space-x-3">
                {[
                  {
                    name: 'Instagram',
                    path: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.624 5.367 11.99 11.988 11.99s11.987-5.366 11.987-11.99C23.004 5.367 17.641.001 12.017.001zm0 21.417c-5.185 0-9.43-4.246-9.43-9.43s4.245-9.43 9.43-9.43 9.43 4.245 9.43 9.43-4.245 9.43-9.43 9.43z',
                  },
                  {
                    name: 'Facebook',
                    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
                  },
                  {
                    name: 'Pinterest',
                    path: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.739.097.118.11.221.081.343-.09.383-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.766-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.366 11.99-11.988C24.007 5.367 18.641.001 12.017.001z',
                  },
                ].map((social) => (
                  <button
                    key={social.name}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-50"
                    aria-label={`Follow us on ${social.name}`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d={social.path} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation - Desktop */}
            <div className="hidden lg:block lg:col-span-2">
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <h3 className="text-gray-900 font-medium mb-4 text-sm">Shop</h3>
                  <ul className="space-y-3">
                    {['All Products', 'New Arrivals', 'Best Sellers', 'Sale', 'Gift Cards'].map(
                      (item) => (
                        <li key={item}>
                          <a
                            href="#"
                            className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                          >
                            {item}
                          </a>
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="text-gray-900 font-medium mb-4 text-sm">Categories</h3>
                  <ul className="space-y-3">
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <li key={i}>
                          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </li>
                      ))
                    ) : (
                      <>
                        {displayedCategories.map((category) => (
                          <li key={category._id}>
                            <Link
                              href={`/products?c=${category.slug}`}
                              className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                            >
                              {category.name}
                            </Link>
                          </li>
                        ))}
                        {remainingCount > 0 && (
                          <li>
                            <Link
                              href="/categories"
                              className="text-gray-900 hover:text-gray-700 transition-colors text-sm font-medium"
                            >
                              Explore All ({remainingCount} more)
                            </Link>
                          </li>
                        )}
                      </>
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="text-gray-900 font-medium mb-4 text-sm">Customer Care</h3>
                  <ul className="space-y-3">
                    {[
                      'Contact Us',
                      'Track Order',
                      'Returns',
                      'Shipping',
                      'Warranty',
                      'Size Guide',
                      'FAQs',
                    ].map((item) => (
                      <li key={item}>
                        <a
                          href="#"
                          className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Mobile Accordions */}
            <div className="lg:hidden space-y-4">
              <div className="border-b border-gray-100 pb-4">
                <button
                  onClick={() => toggleAccordion('shop')}
                  className="w-full flex justify-between items-center py-2 text-left"
                >
                  <span className="text-gray-900 font-medium text-sm">Shop</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      accordionState.shop ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    accordionState.shop ? 'max-h-64 pb-4' : 'max-h-0'
                  }`}
                >
                  <ul className="space-y-3 pl-4">
                    {['All Products', 'New Arrivals', 'Best Sellers', 'Sale', 'Gift Cards'].map(
                      (item) => (
                        <li key={item}>
                          <a
                            href="#"
                            className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                          >
                            {item}
                          </a>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>

              <div className="border-b border-gray-100 pb-4">
                <button
                  onClick={() => toggleAccordion('categories')}
                  className="w-full flex justify-between items-center py-2 text-left"
                >
                  <span className="text-gray-900 font-medium text-sm">Categories</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      accordionState.categories ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    accordionState.categories ? 'max-h-64 pb-4' : 'max-h-0'
                  }`}
                >
                  <ul className="space-y-3 pl-4">
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <li key={i}>
                          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </li>
                      ))
                    ) : (
                      <>
                        {displayedCategories.map((category) => (
                          <li key={category._id}>
                            <Link
                              href={`/products?c=${category.slug}`}
                              className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                            >
                              {category.name}
                            </Link>
                          </li>
                        ))}
                        {remainingCount > 0 && (
                          <li>
                            <Link
                              href="/categories"
                              className="text-gray-900 hover:text-gray-700 transition-colors text-sm font-medium"
                            >
                              Explore All ({remainingCount} more)
                            </Link>
                          </li>
                        )}
                      </>
                    )}
                  </ul>
                </div>
              </div>

              <div className="border-b border-gray-100 pb-4">
                <button
                  onClick={() => toggleAccordion('customerCare')}
                  className="w-full flex justify-between items-center py-2 text-left"
                >
                  <span className="text-gray-900 font-medium text-sm">Customer Care</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      accordionState.customerCare ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    accordionState.customerCare ? 'max-h-64 pb-4' : 'max-h-0'
                  }`}
                >
                  <ul className="space-y-3 pl-4">
                    {[
                      'Contact Us',
                      'Track Order',
                      'Returns',
                      'Shipping',
                      'Warranty',
                      'Size Guide',
                      'FAQs',
                    ].map((item) => (
                      <li key={item}>
                        <a
                          href="#"
                          className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Newsletter & Trust */}
            <div className="lg:col-span-1 space-y-8">
              <div>
                <h3 className="text-gray-900 font-medium mb-4 text-sm">Newsletter</h3>
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent rounded-lg"
                  />
                  <button
                    type="submit"
                    className="w-full bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors rounded-lg"
                  >
                    Subscribe
                  </button>
                </form>
                {emailStatus === 'success' && (
                  <p className="text-green-600 text-xs mt-2">Thank you for subscribing!</p>
                )}
                {emailStatus === 'error' && (
                  <p className="text-red-600 text-xs mt-2">Please enter a valid email address.</p>
                )}
              </div>

              <div>
                <h4 className="text-gray-900 font-medium mb-3 text-xs">We Accept</h4>
                <div className="flex gap-2">
                  <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg">
                    <svg width="28" height="18" viewBox="0 0 32 20" className="text-blue-600">
                      <path fill="currentColor" d="M13.3 7.9h-2.7l-1.7 8.2h2.7l1.7-8.2z" />
                    </svg>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg">
                    <svg width="28" height="18" viewBox="0 0 32 20">
                      <circle cx="12" cy="10" r="6" fill="#eb001b" />
                      <circle cx="20" cy="10" r="6" fill="#f79e1b" />
                    </svg>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg">
                    <div className="text-blue-600 text-xs font-bold">PayPal</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="bg-green-50 border border-green-200 p-2 rounded-lg">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg">
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="text-center lg:text-left">
              <p className="text-gray-500 text-sm">
                © {currentYear} Premium Furniture. All rights reserved.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-6">
              <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors text-sm">
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
