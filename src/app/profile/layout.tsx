// app/profile/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  MapPin,
  CreditCard,
  Heart,
  Star,
  Bell,
  Gift,
  HelpCircle,
  LogOut,
  Loader2,
  User,
  Settings,
  Menu,
  X,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { fetchWithCredentials, handleApiResponse } from "@/utils/fetchWithCredentials";
import { resetApp } from "@/stores/globalStoreManager";

const navItems = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Addresses", href: "/profile/address", icon: MapPin },
  { label: "Orders", href: "/orders", icon: Package },
  { label: "Cart", href: "/Cart", icon: ShoppingBag },
  { label: "Wishlist", href: "/wishlist", icon: Heart },
  { label: "Reviews", href: "/profile/reviews", icon: Star },
  { label: "Support", href: "/support", icon: HelpCircle },
];

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();
  const { setUser } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setIsMobileMenuOpen(false);

    try {
      const res = await fetchWithCredentials("/api/auth/logout", { method: "POST" });
      const data = await handleApiResponse(res);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center mx-auto">
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          </div>
          <p className="text-sm text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const SidebarContent = () => (
    <>
      {/* User Info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white text-sm font-medium">
              {(user.name || "").split(' ').map((n  : any) => n.charAt(0)).join('').slice(0, 2)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </h3>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-2">
        <div className="space-y-1">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xs text-sm mb-1 font-medium transition-all duration-200 ${
                    active
                      ? "bg-black text-white"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
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

      {/* Logout */}
      <div className="p-2 border-t border-gray-100 mt-auto">
        <motion.button
          onClick={handleLogout}
          disabled={isLoggingOut}
          whileHover={!isLoggingOut ? { x: 2 } : {}}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xs text-sm font-medium transition-all duration-200 ${
            isLoggingOut
              ? "cursor-not-allowed text-gray-400 bg-gray-50"
              : "text-red-600 hover:text-red-700 hover:bg-red-50"
          }`}
        >
          {isLoggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
          ) : (
            <LogOut className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="truncate">
            {isLoggingOut ? "Signing Out..." : "Sign Out"}
          </span>
        </motion.button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-semibold text-gray-900">Account</h1>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -m-2 text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-5 h-5" />
          </button>
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
              className="lg:hidden fixed inset-0 bg-black/20  z-50"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 bg-white z-50 flex flex-col shadow-xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 -m-1 text-gray-600 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                <SidebarContent />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-xs shadow-sm border border-gray-200 sticky top-8 flex flex-col max-h-[calc(100vh-4rem)]">
              <SidebarContent />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
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