import { OpenRouter } from "@openrouter/sdk";
import { Product } from "@/types/Product";

const client = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

interface AIResponse {
  reply: string;
  intent: "search" | "info" | "compare" | "chat";
  filters?: {
    category?: string;
    color?: string;
    priceRange?: string;
  };
}

export function isCasualGreeting(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return /^(hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you|bye|goodbye|see you)$/i.test(lower);
}

export async function generateResponse(
  userQuery: string,
  products: Product[] = [],
  history: ChatHistoryItem[] = []
): Promise<AIResponse> {
  const queryLower = userQuery.toLowerCase();
  const intent = detectIntent(queryLower);
  const filters = extractFilters(queryLower);

  if (intent === "chat" && isCasualGreeting(queryLower)) {
    return { reply: getSimpleChatResponse(queryLower), intent: "chat" };
  }

  let reply = "";

  if (products.length === 0) {
    if (needsAIGeneration(queryLower)) {
      reply = await generateDynamicNoProductsResponse(userQuery, history);
    } else {
      reply = getSimpleNoProductsResponse(userQuery);
    }
  } else if (intent === "search") {
    reply = generateSearchResponse(products, filters);
  } else if (intent === "compare") {
    reply = generateCompareResponse(products);
  } else if (intent === "info") {
    reply = generateInfoResponse(products[0]);
  } else {
    reply = generateChatWithProducts(userQuery, products);
  }

  return { reply, intent, filters };
}

function needsAIGeneration(query: string): boolean {
  return query.length > 50 || /tell me about|explain|describe|recommend|suggest/i.test(query);
}

async function generateDynamicNoProductsResponse(query: string, history: ChatHistoryItem[]) {
  try {
    const response = await client.chat.send({
      model: "google/gemini-pro",
      messages: [
        ...history,
        {
          role: "user",
          content: `User searched "${query}" but no furniture found. Suggest useful ideas.`,
        },
      ],
    });

    return (
      response.choices[0].message.content +
      " Try searching 'modern sofa', 'wooden table', or 'office chair'."
    );
  } catch (err) {
    console.error("⚠️ [GEMINI CHAT ERROR]", err);
    return getSimpleNoProductsResponse(query);
  }
}

// ✅ All your other helpers stay unchanged: detectIntent, filter extraction, etc.
function getSimpleChatResponse(q: string) {
  if (/hi|hello|hey/.test(q)) return "Hi! 👋 What furniture can I help you find?";
  if (/thanks|thank/.test(q)) return "You're welcome! 😊";
  if (/bye|goodbye/.test(q)) return "Goodbye! 👋";
  return "How can I help you with furniture today?";
}

function getSimpleNoProductsResponse(q: string) {
  return `I couldn't find matches for "${q}". Try 'sofa', 'wooden table', or 'office chair' to see ideas.`;
}

// --- unchanged search, compare, info methods ---
function detectIntent(query: string): AIResponse["intent"] {
  if (/show|find|search|looking for|want|need|get me|buy/i.test(query)) return "search";
  if (/compare|difference|vs|versus|better|which one/i.test(query)) return "compare";
  if (/tell me|what is|describe|details|about|info|specifications/i.test(query)) return "info";
  return "chat";
}

function extractFilters(query: string): AIResponse["filters"] {
  const filters: AIResponse["filters"] = {};
  const category = query.match(/(sofa|chair|table|bed|cabinet|desk|couch|dresser)/i);
  const color = query.match(/(red|blue|white|black|brown|grey|gray|beige|green)/i);

  if (category) filters.category = category[1];
  if (color) filters.color = color[1];
  if (/under|below|less than|cheap|affordable/i.test(query)) filters.priceRange = "low";
  if (/premium|expensive|luxury|high-end/i.test(query)) filters.priceRange = "high";

  return filters;
}

function generateSearchResponse(products: Product[], filters?: AIResponse["filters"]) {
  const count = products.length;
  if (count === 0) return "No matches. Try 'modern sofa' or 'office chair'.";
  const price = products[0].finalPrice || products[0].price;
  return `I found ${count} ${filters?.category || "furniture"} items. The ${products[0].name} is ₹${price}. Interested?`;
}

function generateCompareResponse(products: Product[]) {
  if (products.length < 2)
    return "I need two products to compare. Please specify another one.";

  const [a, b] = products;
  // Ensure prices are numeric and default to 0 if undefined/null
  const p1 = a.finalPrice ?? a.price ?? 0;
  const p2 = b.finalPrice ?? b.price ?? 0;

  // If both prices are equal, mention they are similar; otherwise show the better value
  if (p1 === p2) {
    return `Let's compare:\n- ${a.name} (₹${p1})\n- ${b.name} (₹${p2})\nBoth items have similar pricing.`;
  }

  return `Let's compare:\n- ${a.name} (₹${p1})\n- ${b.name} (₹${p2})\n${
    p1 < p2 ? a.name : b.name
  } is better value!`;
}

function generateInfoResponse(product: Product) {
  return `🪑 ${product.name}\n💰 ₹${product.finalPrice || product.price}\n${product.description || ""}`;
}

function generateChatWithProducts(query: string, products: Product[]) {
  const product = products[0];
  return `Great choice! The ${product.name} is ₹${product.finalPrice || product.price}. Want to see similar options?`;
}
