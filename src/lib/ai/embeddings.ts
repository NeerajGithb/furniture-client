import { OpenRouter } from "@openrouter/sdk";

const client = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function getTextEmbedding(text: string): Promise<number[]> {
  try {
    const response = await (client as any).embeddings.create({
      model: "google/gemini-pro",
      input: text,
    });

    return response.data[0].embedding;
  } catch (err) {
    console.error("❌ [TEXT EMBEDDING ERROR]", err);
    throw new Error("Failed to generate text embedding");
  }
}

export async function getImageEmbedding(imageUrl: string): Promise<number[]> {
  try {
    const response = await (client as any).embeddings.create({
      model: "google/gemini-pro-vision",
      input: { image: imageUrl },
    });

    return response.data[0].embedding;
  } catch (err) {
    console.error("❌ [IMAGE EMBEDDING ERROR]", err);
    throw new Error("Failed to generate image embedding");
  }
}
