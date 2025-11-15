import { ChatIntent } from "./ai-service";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export async function executeAction(
  intent: ChatIntent,
  router: AppRouterInstance,
  categories: { slug: string }[] = [],
  subcategories: { slug: string }[] = []
): Promise<string> {
  console.log("Executing action:", intent);

  const { category, subcategory, filters, query, response } = intent;

  const resolveSlug = (slug: string | null) => {
    if (!slug) return null;

    const subExists = subcategories.some((s) => s.slug === slug);
    if (subExists) return { slug, type: "subcategory" };

    const catExists = categories.some((c) => c.slug === slug);
    if (catExists) return { slug, type: "category" };

    return null;
  };

  switch (intent.action) {
    case "navigate": {
      const resolved = resolveSlug(subcategory || category || null);

      if (resolved) {
        router.push(`/${resolved.slug}`);
        return `Navigating to ${resolved.slug}`;
      }

      router.push("/products");
      return "We don't have that exact category, showing similar products instead.";
    }

    case "filter": {
      const subResolved = resolveSlug(subcategory || null);
      const catResolved = resolveSlug(category || null);

      let targetSlug: string | null = null;

      if (subResolved) {
        targetSlug = subResolved.slug;
      } else if (catResolved) {
        targetSlug = catResolved.slug;
      }

      if (!targetSlug) {
        router.push("/products");
        return "This category doesn't exist, showing similar products instead.";
      }

      const params = new URLSearchParams();

      if (filters?.price_min)
        params.set("minPrice", filters.price_min.toString());
      if (filters?.price_max)
        params.set("maxPrice", filters.price_max.toString());
      if (filters?.material) params.set("material", filters.material);
      if (filters?.color) params.set("color", filters.color);
      if (filters?.brand) params.set("brand", filters.brand);
      if (filters?.inStock !== undefined)
        params.set("inStock", filters.inStock ? "true" : "false");
      if (filters?.onSale !== undefined)
        params.set("onSale", filters.onSale ? "true" : "false");

      const url = params.toString()
        ? `/${targetSlug}?${params.toString()}`
        : `/${targetSlug}`;

      router.push(url);
      return `Applying filters on ${targetSlug}`;
    }

    case "search": {
      if (!query) return "What should I search?";

      const qValue = subcategory || category || query.split(" ")[0];

      const searchParams = new URLSearchParams();
      searchParams.set("q", qValue);

      if (filters?.price_min)
        searchParams.set("minPrice", filters.price_min.toString());
      if (filters?.price_max)
        searchParams.set("maxPrice", filters.price_max.toString());
      if (filters?.material) searchParams.set("material", filters.material);
      if (filters?.color) searchParams.set("color", filters.color);

      router.push(`/search?${searchParams.toString()}`);
      return `Searching for "${qValue}"`;
    }

    case "product_view": {
      const resolved = resolveSlug(subcategory || category || null);

      if (!resolved) {
        router.push("/products");
        return "We couldn't find that product, showing similar items instead.";
      }

      router.push(`/products/${resolved.slug}`);
      return `Opening product: ${resolved.slug}`;
    }

    case "cart_view":
      router.push("/cart");
      return "Opening your cart";

    case "cart_add":
      return "Adding item to your cart";

    case "wishlist":
      return "Added to your wishlist";

    case "wishlist_view":
      router.push("/wishlist");
      return "Opening your wishlist";

    case "order_status":
    case "order_view":
      router.push("/orders");
      return "Showing your orders";

    case "products_all":
      router.push("/products");
      return "Showing all products";

    case "profile":
      router.push("/profile");
      return "Opening your profile";

    case "profile_address":
      router.push("/profile/address");
      return "Showing your saved addresses";

    case "inspiration": {
      const resolved = resolveSlug(subcategory || category || null);

      if (!resolved) {
        router.push("/inspiration");
        return "Showing inspiration ideas";
      }

      router.push(`/inspiration/${resolved.slug}`);
      return `Showing room inspiration: ${resolved.slug}`;
    }

    case "info":
      return response || "How can I help you today?";

    case "stats":
      return response || "Stats are being fetched...";

    default:
      return 'I can help you find furniture. Try: "show me sofas under ₹20,000"';
  }
}