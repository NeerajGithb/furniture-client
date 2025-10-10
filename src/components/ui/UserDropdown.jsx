'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import {
  Settings,
  User,
  ShoppingBag,
  MapPin,
  LayoutDashboard,
  LogOut,
  Loader2,
  ShoppingCart,
  Heart,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useOrderStore } from '@/stores/orderStore';
import { fetchWithCredentials, handleApiResponse } from '@/utils/fetchWithCredentials';
import { resetApp } from '@/stores/globalStoreManager';

const Avatar = ({ src, alt, fallbackText }) => {
  const [imageError, setImageError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !src || imageError) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-8 h-8 bg-black flex items-center justify-center text-sm font-medium text-white rounded-full"
      >
        {fallbackText}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-8 h-8 rounded-full overflow-hidden border border-gray-200"
    >
      <Image
        src={src}
        alt={alt}
        width={32}
        height={32}
        className="w-8 h-8 object-cover"
        onError={() => setImageError(true)}
      />
    </motion.div>
  );
};

export default function UserDropdown({ isOpen, onClose }) {
  const dropdownRef = useRef(null);
  const { user, setUser, storesInitialized } = useAuth();
  const router = useRouter();
  const [loadingStates, setLoadingStates] = useState({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { orders, fetchOrders } = useOrderStore();
  const pathname = usePathname();
  const [navigatingTo, setNavigatingTo] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userMenuItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      href: '/profile',
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      href: '/orders',
      badge:
        mounted && orders.length > 0 && orders.some((order) => order.status !== 'completed')
          ? orders.filter((order) => order.status !== 'completed').length
          : undefined,
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingCart,
      href: '/cart',
    },
    {
      id: 'wishlist',
      label: 'Wishlist',
      icon: Heart,
      href: '/wishlist',
    },
    {
      id: 'addresses',
      label: 'Addresses',
      icon: MapPin,
      href: '/profile/address',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/profile/settings',
    },
  ];

  const allMenuItems =
    mounted && user?.role === 'admin'
      ? [
          ...userMenuItems,
          {
            id: 'admin',
            label: 'Dashboard',
            icon: LayoutDashboard,
            href: '/admin',
          },
        ]
      : userMenuItems;

  const isActiveItem = (item) => pathname === item.href;

  useEffect(() => {
    if (navigatingTo) {
      const targetItem = allMenuItems.find((item) => item.id === navigatingTo);
      if (
        targetItem &&
        (pathname === targetItem.href || pathname.startsWith(targetItem.href + '/'))
      ) {
        setLoadingStates((prev) => ({ ...prev, [navigatingTo]: false }));
        setNavigatingTo(null);
      }
    }
  }, [pathname, navigatingTo, allMenuItems]);

  useEffect(() => {
    setLoadingStates({});
    setNavigatingTo(null);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleOutsideInteraction = (event) => {
      if (!dropdownRef.current || !isOpen) return;

      const isOutsideDropdown = !dropdownRef.current.contains(event.target);

      const isNotOnTrigger = !event.target.closest('[data-dropdown-trigger]');

      if (isOutsideDropdown && isNotOnTrigger) {
        event.stopPropagation();
        onClose();
      }
    };

    const handleScroll = () => {
      if (dropdownRef.current && isOpen) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const isOutOfViewport =
          rect.bottom < 0 ||
          rect.top > window.innerHeight ||
          rect.right < 0 ||
          rect.left > window.innerWidth;

        if (isOutOfViewport) {
          onClose();
        }
      }
    };

    const handleResize = () => {
      if (isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideInteraction, true);

      document.addEventListener('touchstart', handleOutsideInteraction, true);

      document.addEventListener('click', handleOutsideInteraction, true);

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction, true);
      document.removeEventListener('touchstart', handleOutsideInteraction, true);
      document.removeEventListener('click', handleOutsideInteraction, true);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, onClose, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, mounted]);

  const handleMenuClick = async (item) => {
    if (isActiveItem(item)) {
      onClose();
      return;
    }

    setLoadingStates((prev) => ({ ...prev, [item.id]: true }));
    setNavigatingTo(item.id);

    try {
      await router.push(item.href);
    } catch (error) {
      console.error('Navigation error:', error);
      setLoadingStates((prev) => ({ ...prev, [item.id]: false }));
      setNavigatingTo(null);
      toast.error('Navigation failed');
    }
  };

  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      onClose();
      prevPathRef.current = pathname;
    }
  }, [pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const res = await fetchWithCredentials('/api/auth/logout', {
        method: 'POST',
      });
      const data = await handleApiResponse(res);

      if (!res.ok) {
        toast.error(data?.error || 'Logout failed');
        setIsLoggingOut(false);
        return;
      }

      setUser(null);
      await resetApp();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (err) {
      toast.error('Something went wrong');
      setIsLoggingOut(false);
    }
  };

  const containerVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
        staggerChildren: 0.02,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -5,
      transition: {
        duration: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 30,
      },
    },
  };

  useEffect(() => {
    if (mounted && storesInitialized && user?._id) {
      fetchOrders(1, 100);
    }
  }, [user, fetchOrders, mounted, storesInitialized]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute right-0 top-full mt-1 w-48 bg-white shadow-lg border border-gray-200 rounded-xs overflow-hidden z-[60]"
          >
            {/* User Profile Section */}
            <motion.div
              variants={itemVariants}
              className="px-3 py-1 border-b border-gray-100 bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={user?.photoURL || user?.avatar}
                  alt={user?.name || user?.displayName}
                  fallbackText={
                    user?.name?.charAt(0)?.toUpperCase() ||
                    user?.displayName?.charAt(0)?.toUpperCase() ||
                    'U'
                  }
                />
                <div className="flex-1 min-w-0">
                  <motion.p
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="text-sm font-medium text-gray-900 truncate"
                  >
                    {user?.name || user?.displayName || 'User'}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xs text-gray-500 truncate"
                  >
                    {user?.email || 'user@example.com'}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            {/* Menu Items */}
            <div className="py-1">
              {allMenuItems.map((item, index) => {
                const IconComponent = item.icon;
                const isLoading = loadingStates[item.id];
                const isActive = isActiveItem(item);

                return (
                  <motion.button
                    key={item.id}
                    variants={itemVariants}
                    custom={index}
                    onClick={() => handleMenuClick(item)}
                    disabled={isLoading}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-none ${
                      isLoading
                        ? 'cursor-not-allowed opacity-60'
                        : isActive
                        ? 'bg-gray-100 text-black font-medium cursor-default'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer'
                    }`}
                  >
                    <motion.div
                      className="w-3.5 h-3.5 flex items-center justify-center"
                      animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
                      transition={
                        isLoading
                          ? { duration: 1, repeat: Infinity, ease: 'linear' }
                          : { duration: 0.2 }
                      }
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 text-gray-600" />
                      ) : (
                        <IconComponent
                          className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-gray-600'}`}
                        />
                      )}
                    </motion.div>

                    <span className="flex-1 font-medium">{item.label}</span>

                    {item.badge && !isLoading && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                          delay: 0.1 + index * 0.02,
                        }}
                        className="text-xs px-1.5 py-1 bg-black text-white rounded-full min-w-[16px] text-center leading-none font-medium"
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Logout Section */}
            <motion.div variants={itemVariants} className="border-t border-gray-100 pt-1">
              <motion.button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-none ${
                  isLoggingOut
                    ? 'cursor-not-allowed text-gray-400'
                    : 'text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer'
                }`}
              >
                <motion.div
                  className="w-4 h-4 flex items-center justify-center"
                  animate={isLoggingOut ? { rotate: 360 } : { rotate: 0 }}
                  transition={
                    isLoggingOut
                      ? { duration: 1, repeat: Infinity, ease: 'linear' }
                      : { duration: 0.2 }
                  }
                >
                  {isLoggingOut ? <Loader2 className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                </motion.div>
                <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
