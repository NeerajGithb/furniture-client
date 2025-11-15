import { getImageEmbedding, getTextEmbedding } from "@/lib/ai/embeddings";
import { generateResponse, isCasualGreeting } from "@/lib/ai/llmClient";
import { queryVector } from "@/lib/ai/vectorClient";
import { connectDB } from "@/lib/dbConnect";
import ChatSession from "@/models/ai/ChatSession";
import Product from "@/models/product";
import Category from "@/models/category";
import SubCategory from "@/models/subcategory";
import { NextRequest, NextResponse } from "next/server";

interface ChatRequest {
  text?: string;
  imageUrl?: string;
  sessionId?: string;
  filters?: {
    category?: string;
    subcategory?: string;
    minPrice?: number;
    maxPrice?: number;
    material?: string;
    inStock?: boolean;
  };
}

function requiresProductSearch(text: string): boolean {
  const searchKeywords = /\b(show|find|search|looking for|want|need|buy|get|compare|sofa|chair|table|bed|desk|cabinet|furniture|couch|dresser|under|price|cheap|expensive|luxury|modern|wooden|comfortable)\b/i;
  return searchKeywords.test(text);
}

// Fast responses for casual chat - no AI model needed
const casualResponses: Record<string, string[]> = {
  greeting: [
    "Hi! 👋 I'm here to help you find the perfect furniture. What are you looking for today?",
    "Hello! 😊 Welcome to our furniture store. How can I assist you?",
    "Hey there! Looking for something specific? I can help you find sofas, chairs, tables, and more!",
  ],
  thanks: [
    "You're welcome! 😊 Feel free to ask if you need anything else!",
    "Happy to help! Let me know if you'd like to see more products.",
    "Anytime! Is there anything else I can show you?",
  ],
  bye: [
    "Goodbye! Come back soon if you need more furniture recommendations! 👋",
    "Take care! We're here whenever you need us!",
    "Bye! Happy shopping! 🛋️",
  ],
};

function getQuickCasualResponse(text: string): string | null {
  const lower = text.toLowerCase().trim();
  
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(lower)) {
    const responses = casualResponses.greeting;
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (/^(thanks|thank you|thx|ty)$/i.test(lower)) {
    const responses = casualResponses.thanks;
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (/^(bye|goodbye|see you|later)$/i.test(lower)) {
    const responses = casualResponses.bye;
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  return null;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    await connectDB();
    const { text, imageUrl, sessionId, filters } = (await req.json()) as ChatRequest;

    if (!text && !imageUrl) {
      return NextResponse.json({ error: "Text or image required" }, { status: 400 });
    }
    console.log(`[AI CHAT] New request received. Text length: ${text ? text.length : 0}, Image URL: ${imageUrl ? 'provided' : 'none'}`);
    // ⚡ FAST PATH: Handle casual greetings immediately without AI
    if (text && !imageUrl) {
      const quickResponse = getQuickCasualResponse(text);
      if (quickResponse) {
        console.log(`💬 [QUICK CHAT] ${text} -> ${quickResponse} (${Date.now() - startTime}ms)`);
        
        // Still save to session for context
        if (sessionId) {
          await ChatSession.findOneAndUpdate(
            { sessionId },
            {
              $push: {
                messages: [
                  { role: "user", text },
                  { role: "assistant", text: quickResponse },
                ],
              },
            },
            { upsert: true, new: true }
          );
        }

        return NextResponse.json({
          reply: quickResponse,
          intent: "chat",
          filters: {},
          products: [],
          meta: {
            fetchTime: Date.now() - startTime,
            totalFound: 0,
            fastPath: true,
          },
        });
      }
    }

    // Load chat history only if needed
    let chatHistory: { role: "user" | "assistant"; content: string }[] = [];
    if (sessionId) {
      const session = await ChatSession.findOne({ sessionId });
      if (session) {
        chatHistory = session.messages.slice(-6).map((m: any) => ({
          role: m.role,
          content: m.text,
        }));
      }
    }

    const query = text || "Find similar products to this image";
    let products: any[] = [];

    // Only search products if needed
    if (imageUrl || (text && requiresProductSearch(text))) {
      const productQuery: any = { isPublished: { $ne: false } };
      let embedding: number[] | undefined;

      if (imageUrl) {
        embedding = await getImageEmbedding(imageUrl);
      } else if (text) {
        embedding = await getTextEmbedding(text);
      }
      console.log("Embedding generated for product search.",embedding);
      if (embedding) {
        const similarProducts = await queryVector(embedding, 10);
        if (similarProducts.length > 0) {
          productQuery._id = { $in: similarProducts.map((p) => p.id) };
        }
      }

      if (filters?.category) {
        const categoryDoc = await Category.findOne({ slug: filters.category }).lean();
        if (categoryDoc && '_id' in categoryDoc) productQuery.categoryId = categoryDoc._id;
      }
      if (filters?.subcategory) {
        const subCategoryDoc = await SubCategory.findOne({ slug: filters.subcategory }).lean();
        if (subCategoryDoc && '_id' in subCategoryDoc) productQuery.subCategoryId = subCategoryDoc._id;
      }
      if (filters?.minPrice || filters?.maxPrice) {
        productQuery.finalPrice = {};
        if (filters.minPrice) productQuery.finalPrice.$gte = filters.minPrice;
        if (filters.maxPrice) productQuery.finalPrice.$lte = filters.maxPrice;
      }
      if (filters?.material) productQuery.material = { $regex: filters.material, $options: 'i' };
      if (filters?.inStock) productQuery.inStockQuantity = { $gt: 0 };

      products = await Product.find(productQuery)
        .populate('categoryId', 'name slug')
        .populate('subCategoryId', 'name slug')
        .limit(10)
        .sort({ createdAt: -1 })
        .lean();
    }

    const aiResponse = await generateResponse(query, products, chatHistory);

    if (sessionId) {
      await ChatSession.findOneAndUpdate(
        { sessionId },
        {
          $push: {
            messages: [
              { role: "user", text: query },
              { role: "assistant", text: aiResponse.reply },
            ],
          },
        },
        { upsert: true, new: true }
      );
    }

    const responseData = {
      reply: aiResponse.reply,
      intent: aiResponse.intent,
      filters: aiResponse.filters || {},
      products: products.map((p: any) => ({
        _id: p._id.toString(),
        name: p.name,
        price: p.price,
        finalPrice: p.finalPrice,
        discountPercent: p.discountPercent,
        category: p.categoryId?.name || null,
        categorySlug: p.categoryId?.slug || null,
        subcategory: p.subCategoryId?.name || null,
        subcategorySlug: p.subCategoryId?.slug || null,
        image: p.images?.[0] || "/placeholder.jpg",
        images: p.images || [],
        description: p.description,
        material: p.material,
        inStockQuantity: p.inStockQuantity,
        ratings: p.ratings,
      })),
      meta: {
        fetchTime: Date.now() - startTime,
        totalFound: products.length,
        fastPath: false,
      },
    };

    console.log(`✅ [AI CHAT] Processed in ${Date.now() - startTime}ms`);

    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

    return response;
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[AI CHAT ERROR]', { message: errorMessage, duration: Date.now() - startTime });

    return NextResponse.json(
      {
        error: "Failed to process request",
        message: process.env.NODE_ENV === 'development' ? errorMessage : 'Something went wrong',
        reply: "Sorry, I'm having trouble right now. Please try again.",
        products: [],
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}