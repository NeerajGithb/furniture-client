import { Pinecone, RecordMetadata } from "@pinecone-database/pinecone";

let pineconeClient: Pinecone | null = null;

function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      console.error("[PINECONE ERROR] Missing PINECONE_API_KEY in environment variables");
      throw new Error("PINECONE_API_KEY not configured");
    }

    console.log("[PINECONE INIT] Initializing Pinecone client...");
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient;
}

interface ProductEmbedding {
  _id: string;
  embedding: number[];
  name: string;
  price: number;
  category: string;
  description: string;
}

interface VectorMatch {
  id: string;
  score: number;
  name?: string;
  price?: number;
  category?: string;
  description?: string;
}

export async function queryVector(
  embedding: number[],
  topK: number = 5
): Promise<VectorMatch[]> {
  console.log("🔍 [PINECONE QUERY] Searching for similar products...");
  try {
    const pc = getPineconeClient();
    const indexName = process.env.PINECONE_INDEX || "furniture";
    console.log(`📁 [PINECONE INDEX] Using index: ${indexName}`);

    const index = pc.index(indexName);

    const result = await index.query({
      vector: embedding,
      topK,
      includeMetadata: true,
    });

    console.log(`✅ [PINECONE QUERY RESULT] Found ${result.matches?.length || 0} matches`);

    return (result.matches || []).map((m) => ({
      id: m.id,
      score: m.score || 0,
      ...(m.metadata as Record<string, any>),
    }));
  } catch (error) {
    console.error("❌ [PINECONE QUERY ERROR]:", error);
    return [];
  }
}

export async function upsertProducts(
  products: ProductEmbedding[]
): Promise<void> {
  console.log(`⬆️ [PINECONE UPSERT] Preparing to upsert ${products.length} products...`);

  if (!Array.isArray(products) || products.length === 0) {
    console.warn("⚠️ [PINECONE UPSERT WARNING] No products provided for upsert.");
    return;
  }

  try {
    const pc = getPineconeClient();
    const indexName = process.env.PINECONE_INDEX || "furniture";
    console.log(`📁 [PINECONE INDEX] Using index: ${indexName}`);

    const index = pc.index(indexName);

    const vectors = products.map((p) => ({
      id: p._id.toString(),
      values: p.embedding,
      metadata: {
        name: p.name,
        price: p.price,
        category: p.category,
        description: p.description,
      },
    }));

    console.log("📦 [PINECONE UPSERT DATA SAMPLE]:", vectors[0]);
    await index.upsert(vectors);

    console.log(`✅ [PINECONE UPSERT SUCCESS] ${vectors.length} products uploaded successfully.`);
  } catch (error) {
    console.error("❌ [PINECONE UPSERT ERROR]:", error);
    throw new Error("Failed to upsert products to vector database");
  }
}
