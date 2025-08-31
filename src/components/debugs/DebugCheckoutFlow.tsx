"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCheckoutStore } from "@/stores/checkoutStore";
import { useCartStore } from "@/stores/cartStore";

// Add this component temporarily to debug the flow
const DebugCheckoutFlow = () => {
  const { user } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams?.get("orderNumber");
  
  const checkoutStore = useCheckoutStore();
  const cartStore = useCartStore();

  useEffect(() => {
    console.log("=== CHECKOUT FLOW DEBUG ===");
    console.log("Current URL:", window.location.href);
    console.log("Order Number from URL:", orderNumber);
    console.log("User:", user ? { id: user._id, email: user.email } : "Not logged in");
    
    const checkoutData = checkoutStore.getCheckoutData();
    console.log("Checkout Data:", checkoutData);
    console.log("Has Valid Checkout:", checkoutStore.hasValidCheckout());
    
    const cartData = cartStore.cart;
    console.log("Cart Data:", cartData);
    
    console.log("=== END DEBUG ===");
  }, [user, orderNumber, checkoutStore, cartStore]);

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-sm text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="space-y-1">
        <div>User: {user ? "Logged in" : "Not logged in"}</div>
        <div>Order Number: {orderNumber || "None"}</div>
        <div>Has Valid Checkout: {checkoutStore.hasValidCheckout() ? "Yes" : "No"}</div>
        <div>Current Path: {window.location.pathname}</div>
      </div>
    </div>
  );
};

export default DebugCheckoutFlow;