import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

function safeText(res: any): string {
  if (!res) return "";
  if (typeof res.text === "function") return res.text?.() ?? "";
  if (typeof res.text === "string") return res.text;
  return "";
}

export type ChatIntent = {
  action:
    | "navigate"
    | "filter"
    | "search"
    | "info"
    | "stats"
    | "cart_add"
    | "cart_view"
    | "wishlist"
    | "wishlist_view"
    | "order_status"
    | "order_view"
    | "inspiration"
    | "orders_view"
    | "profile"
    | "profile_address"
    | "products_all"
    | "product_view";
  category?: string;
  subcategory?: string;
  filters?: {
    price_min?: number;
    price_max?: number;
    material?: string;
    color?: string;
    brand?: string;
    inStock?: boolean;
    onSale?: boolean;
  };
  query?: string;
  response?: string;
};

export async function parseUserIntent(
  userMessage: string,
  conversationHistory: any[]
): Promise<ChatIntent> {
  const systemPrompt = `
You are an AI for a furniture e-commerce store with direct database access.

CRITICAL: Return ONLY valid JSON. No text before or after. No markdown. No explanations.

Format:
{
  "action": "stats",
  "query": "products"
}

✅ Category mapping (singular slug):
- sofas → "sofa"
- beds → "bed"
- chairs → "chair"
- tables → "table"
- wardrobes → "wardrobe"
- dining tables/sets → "dining-table"
- cabinets → "cabinet"
- storage → "storage"
- decor → "decor"

✅ Subcategory detection:
"rounded sofa" → subcategory: "rounded-sofa"
"king size bed" → subcategory: "king-size-bed"
"small sofa" → subcategory: "small-sofa"
"modern chair" → subcategory: "modern-chair"

✅ Stats queries (use "stats" action):
"how many products" → action: "stats", query: "products"
"how many sofas" → action: "stats", category: "sofa", query: "category_count"
"how many categories" → action: "stats", query: "categories"
"list all products" → action: "stats", query: "product_list"
"what brands do you have" → action: "stats", query: "brands"
"show me materials" → action: "stats", query: "materials"
"how many subcategories" → action: "stats", query: "subcategories"

✅ Filters:
price_min, price_max, material, color, brand, inStock, onSale

✅ Price parsing:
"under 20000" → price_max: 20000
"below ₹15k" → price_max: 15000
"between 10000 and 25000" → price_min: 10000, price_max: 25000
"above 50000" → price_min: 50000

✅ Actions:
navigate, filter, search, stats, info, cart_add, cart_view, wishlist, wishlist_view, order_status, order_view, profile, profile_address, products_all, product_view, inspiration

✅ Examples:
{
  "action": "stats",
  "query": "products"
}

{
  "action": "stats",
  "category": "sofa",
  "query": "category_count"
}

{
  "action": "filter",
  "category": "sofa",
  "subcategory": "small-sofa",
  "filters": { "price_max": 20000 },
  "response": "Showing small sofas under ₹20,000"
}

Return JSON only.
`.trim();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        ...conversationHistory.map((msg) => ({
          role: "user",
          parts: [{ text: msg.content }],
        })),
        { role: "user", parts: [{ text: userMessage }] },
      ],
    });

    const raw = safeText(response).trim();
    
    // Remove markdown code blocks
    let cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    
    // Find JSON object between { and }
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }
    
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("parseUserIntent failed:", err);
    console.error("Raw response:", safeText(await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: userMessage }] },
      ],
    })));
    
    return {
      action: "info",
      response: "I can help you find furniture. Try asking about beds, sofas, or chairs!",
    };
  }
}

export async function generateResponse(
  userMessage: string,
  conversationHistory: any[]
): Promise<string> {
  const systemPrompt = `
You are a helpful furniture store assistant.
Keep replies short, friendly, and conversational.
When answering about quantities, be enthusiastic and natural.
Examples:
- "We have 150 amazing products!"
- "Right now we have 45 beautiful sofas"
- "We carry 8 categories to choose from"
`.trim();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        ...conversationHistory.map((msg) => ({
          role: "user",
          parts: [{ text: msg.content }],
        })),
        { role: "user", parts: [{ text: userMessage }] },
      ],
    });

    return safeText(response).trim() || "How can I help you find furniture today?";
  } catch (err) {
    console.error("generateResponse failed:", err);
    return "Sorry, I'm having trouble right now. Please try again.";
  }
}