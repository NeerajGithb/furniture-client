// app/api/inspiration/relatedProduct/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Inspiration from "@/models/Inspiration";
import product from "@/models/product";
import { SortOrder } from "mongoose";

// Define a minimal Category type (only the fields you populated)
interface PopulatedCategory {
  _id: string;
  name: string;
  slug: string;
}

// Define Inspiration doc shape after populate
interface InspirationDoc {
  _id: string;
  slug: string;
  title: string;
  categories: PopulatedCategory[];
}

export async function GET(request: Request) {
  
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sort = searchParams.get("sort") || "newest";

    if (!slug) {
      return NextResponse.json(
        { error: "Missing inspiration slug" },
        { status: 400 }
      );
    }

    // 1️⃣ Fetch the inspiration with populated categories
    const inspiration = (await Inspiration.findOne({ slug })
      .populate("categories", "name slug _id")
      .lean()) as InspirationDoc | null;

    if (!inspiration) {
      return NextResponse.json(
        { error: "Inspiration not found" },
        { status: 404 }
      );
    }

    const categories = inspiration.categories || [];
    if (!categories.length) {
      return NextResponse.json({ products: [] });
    }

    // 2️⃣ Calculate products per category
    const perCategoryLimit = Math.ceil(limit / categories.length);
    const sortOption: Record<string, SortOrder> =
      sort === "newest"
        ? { createdAt: -1 as SortOrder }
        : sort === "oldest"
          ? { createdAt: 1 as SortOrder }
          : { name: 1 as SortOrder };

    // 4️⃣ Fetch products from each category
    const productsPromises = categories.map((cat) =>
      product.find({ "categoryId._id": cat._id })
        .sort(sortOption)
        .limit(perCategoryLimit)
        .lean()
    );

    const productsByCategory = await Promise.all(productsPromises);

    // 5️⃣ Flatten and trim to overall limit
    const products = productsByCategory.flat().slice(0, limit);

    return NextResponse.json({ products });
  } catch (err) {
    console.error("GET relatedProduct error:", err);
    return NextResponse.json(
      { error: "Failed to fetch related products" },
      { status: 500 }
    );
  }
}
