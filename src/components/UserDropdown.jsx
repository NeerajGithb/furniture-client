"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { Settings, User, ShoppingBag, MapPin, LayoutDashboard, LogOut, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { useOrderStore } from "@/stores/orderStore";
import { fetchWithCredentials } from "@/utils/fetchWithCredentials";
import { resetApp } from "@/stores/globalStoreManager";

const Avatar = ({ src, alt, fallbackText }) => {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className='w-8 h-8 bg-gray-900 flex items-center justify-center text-sm font-bold text-white border border-gray-700'
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
      className='w-8 h-8 border border-gray-700'
    >
      <Image
        src={src}
        alt={alt}
        width={32}
        height={32}
        className='w-8 h-8 object-cover'
        onError={() => setImageError(true)}
      />
    </motion.div>
  );
};

export default function UserDropdown({ isOpen, onClose }) {
  const dropdownRef = useRef(null);
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [loadingStates, setLoadingStates] = useState({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { orders, fetchOrders } = useOrderStore();
  const pathname = usePathname();
  const [navigatingTo, setNavigatingTo] = useState(null);

  const userMenuItems = [
    {
      id: "profile",
      label: "My Profile",
      icon: User,
      href: "/profile",
    },
    {
      id: "orders",
      label: "My Orders",
      icon: ShoppingBag,
      href: "/orders",
      badge: orders.length > 0 && orders.some(order => order.status !== "completed")
        ? orders.filter(order => order.status !== "completed").length
        : undefined,
    },
    {
      id: "addresses",
      label: "Addresses",
      icon: MapPin,
      href: "/profile/address",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/profile/settings",
    },
  ];

  // Add admin item if user is admin
  const allMenuItems = user?.role === "admin"
    ? [...userMenuItems, {
      id: "admin",
      label: "Admin Dashboard",
      icon: LayoutDashboard,
      href: "/admin",
    }]
    : userMenuItems;

  // Check if current path matches any menu item
  const isActiveItem = (item) => pathname === item.href;
  
  // Clear loading states when navigation completes
  useEffect(() => {
    if (navigatingTo) {
      const targetItem = allMenuItems.find(item => item.id === navigatingTo);
      if (targetItem && (pathname === targetItem.href || pathname.startsWith(targetItem.href + "/"))) {
        setLoadingStates(prev => ({ ...prev, [navigatingTo]: false }));
        setNavigatingTo(null);
      }
    }
  }, [pathname, navigatingTo, allMenuItems]);

  // Clear all loading states when component mounts (in case of page refresh)
  useEffect(() => {
    setLoadingStates({});
    setNavigatingTo(null);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !event.target.closest("[data-dropdown-trigger]")
      ) {
        onClose();
      }
    };

    const handleScroll = () => {
      if (dropdownRef.current && isOpen) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const isOutOfViewport =
          rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth;

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
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleMenuClick = async (item) => {
    if (isActiveItem(item)) {
      onClose();
      return;
    }

    setLoadingStates(prev => ({ ...prev, [item.id]: true }));
    setNavigatingTo(item.id);

    try {
      await router.push(item.href);
      // Don't close here, wait for pathname update
    } catch (error) {
      console.error("Navigation error:", error);
      setLoadingStates(prev => ({ ...prev, [item.id]: false }));
      setNavigatingTo(null);
      toast.error("Navigation failed");
    }
  };

  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      onClose();
      prevPathRef.current = pathname;
    }
  }, [pathname]); // Remove onClose from dependencies

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const res = await fetchWithCredentials("/api/auth/logout", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Logout failed");
        setIsLoggingOut(false);
        return;
      }

      setUser(null);
      await resetApp();
      toast.success("Logged out successfully");
      router.push("/");
    } catch (err) {
      toast.error("Something went wrong");
      setIsLoggingOut(false);
    }
  };

  const containerVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: -20,
      filter: "blur(4px)",
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      filter: "blur(2px)",
      transition: {
        duration: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
      },
    },
  };

  useEffect(() => {
    if (user?._id) fetchOrders(1, 100);
  }, [user, fetchOrders]);

  return (
    <div className='relative'>
      <AnimatePresence mode='wait'>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            variants={containerVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
            className='absolute right-0 top-full mt-2 w-full sm:w-62 bg-white shadow-2xl border-2 border-gray-900 overflow-hidden z-[60]'
          >
            {/* User Profile Section */}
            <motion.div variants={itemVariants} className='p-1 bg-gray-900 text-white border-b border-gray-800'>
              <div className='flex items-center gap-3'>
                <Avatar
                  src={user?.photoURL || user?.avatar}
                  alt={user?.name || user?.displayName}
                  fallbackText={
                    user?.name?.charAt(0)?.toUpperCase() || user?.displayName?.charAt(0)?.toUpperCase() || "U"
                  }
                />
                <div className='flex-1 min-w-0'>
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className='text-sm font-bold text-white truncate'
                  >
                    {user?.name || user?.displayName || "User"}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className='text-xs text-gray-300 truncate'
                  >
                    {user?.email || "user@example.com"}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            {/* Menu Items */}
            <div className='py-1 bg-white'>
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
                    whileHover={
                      !isLoading && !isActive
                        ? {
                          backgroundColor: "#f8f9fa", // Use hex instead of rgb()
                          x: 4,
                          transition: { duration: 0.2 },
                        }
                        : {}
                    }
                    whileTap={!isLoading && !isActive ? { scale: 0.98 } : {}}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm border-b border-gray-100 transition-colors duration-200 relative ${isLoading
                      ? "cursor-not-allowed opacity-60"
                      : isActive
                        ? "bg-blue-50 border-l-4 border-l-blue-500 cursor-default"
                        : "cursor-pointer"
                      }`}
                  >
                    <motion.div
                      className='relative w-4 h-4'
                      animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
                      transition={isLoading ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
                    >
                      {isLoading ? (
                        <Loader2 className='w-4 h-4 text-blue-600 animate-spin' />
                      ) : (
                        <IconComponent className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-900"}`} />
                      )}
                    </motion.div>

                    <span className={`flex-1 font-medium ${isLoading
                      ? "opacity-75 text-gray-600"
                      : isActive
                        ? "text-blue-600 font-semibold"
                        : "text-gray-900"
                      }`}>
                      {item.label}
                    </span>

                    {item.badge && !isLoading && (
                      <motion.span
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        whileHover={{ scale: 1.1 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                          delay: 0.3 + index * 0.1,
                        }}
                        className={`text-xs px-1.5 py-0.5 font-bold min-w-[20px] text-center ${isActive
                          ? "bg-blue-600 text-white"
                          : "bg-gray-900 text-white"
                          }`}
                      >
                        {item.badge}
                      </motion.span>
                    )}

                    {isLoading && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        className='absolute bottom-0 left-0 h-0.5 bg-blue-600'
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Logout Section */}
            <motion.div variants={itemVariants} className='border-t-2 border-gray-900 bg-gray-900'>
              <motion.button
                onClick={handleLogout}
                disabled={isLoggingOut}
                whileHover={
                  !isLoggingOut
                    ? {
                        backgroundColor: "#1f2937", // Use hex instead of rgb()
                        x: 4,
                        transition: { duration: 0.2 },
                      }
                    : {}
                }
                whileTap={!isLoggingOut ? { scale: 0.98 } : {}}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors duration-200 relative overflow-hidden ${isLoggingOut ? "cursor-not-allowed text-gray-400" : "text-white cursor-pointer"
                  }`}
              >
                <motion.div
                  className='relative w-4 h-4 z-10'
                  animate={isLoggingOut ? { rotate: 360 } : { rotate: 0 }}
                  transition={isLoggingOut ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
                >
                  {isLoggingOut ? <Loader2 className='w-4 h-4 animate-spin' /> : <LogOut className='w-4 h-4' />}
                </motion.div>
                <span className='z-10 relative'>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
                {isLoggingOut && (
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent'
                  />
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}