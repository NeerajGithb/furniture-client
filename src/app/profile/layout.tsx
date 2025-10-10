'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  MapPin,
  Heart,
  Star,
  HelpCircle,
  LogOut,
  Loader2,
  User,
  Menu,
  X,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { fetchWithCredentials, handleApiResponse } from '@/utils/fetchWithCredentials';
import { resetApp } from '@/stores/globalStoreManager';
import ErrorMessage from '@/components/ui/ErrorMessage';

const navItems = [
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Addresses', href: '/profile/address', icon: MapPin },
  { label: 'Orders', href: '/orders', icon: Package },
  { label: 'Cart', href: '/Cart', icon: ShoppingBag },
  { label: 'Wishlist', href: '/wishlist', icon: Heart },
  { label: 'Reviews', href: '/profile/reviews', icon: Star },
  { label: 'Support', href: '/support', icon: HelpCircle },
];

interface ProfileLayoutProps {
  children: React.ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();
  const { setUser } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  // Handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if not authenticated (only after mounting)
  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router, mounted]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setIsMobileMenuOpen(false);

    try {
      const res = await fetchWithCredentials('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await handleApiResponse(res);

      if (!res.ok) {
        setError(data?.error || 'Logout failed');
        setIsLoggingOut(false);
        return;
      }

      // Clear user state and reset app
      setUser(null);
      await resetApp();

      toast.success('Logged out successfully');
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Something went wrong during logout');
      setIsLoggingOut(false);
    }
  };

  // Show loading state until mounted and auth is resolved
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-gray-600 mx-auto" />
          <p className="text-sm text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if redirecting to login
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string): string => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n: string) => n.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* User Info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={`${user.name || 'User'} profile`}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div
            className={`w-10 h-10 bg-gradient-to-br from-gray-800 to-black rounded-full flex items-center justify-center text-white text-sm font-medium ${
              user.photoURL ? 'hidden' : ''
            }`}
          >
            {getInitials(user.name || '')}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-900 truncate">{user.name || 'User'}</h3>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xs text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-2 border-t border-gray-100">
        <motion.button
          onClick={handleLogout}
          disabled={isLoggingOut}
          whileHover={!isLoggingOut ? { x: 2 } : {}}
          whileTap={!isLoggingOut ? { scale: 0.98 } : {}}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xs text-sm font-medium transition-all duration-200 ${
            isLoggingOut
              ? 'cursor-not-allowed text-gray-400 bg-gray-50'
              : 'text-red-600 hover:text-red-700 hover:bg-red-50'
          }`}
        >
          {isLoggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
          ) : (
            <LogOut className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="truncate">{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>
        </motion.button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-2">
          <ErrorMessage message={error} onClose={() => setError(null)} />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">Account</h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -m-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Menu className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 200,
                mass: 0.8,
              }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 bg-white z-50 flex flex-col shadow-2xl"
            >
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 -m-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Mobile Menu Content */}
              <div className="flex-1 overflow-hidden">
                <SidebarContent />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-xs shadow-sm border border-gray-200 sticky top-8 overflow-hidden max-h-[calc(100vh-4rem)]">
              <SidebarContent />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="bg-white rounded-xs shadow-sm border border-gray-200 min-h-[500px] overflow-hidden"
            >
              {children}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
