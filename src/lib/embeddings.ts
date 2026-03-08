
/**
 * Simple chunking utility that splits text into overlapping segments.
 */
export function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
        chunks.push(text.slice(i, i + chunkSize));
        i += chunkSize - overlap;
    }
    return chunks;
}

/**
 * Generates embeddings using Hugging Face (Free Tier).
 * Note: For production, a paid OpenAI/Cohere key is recommended for better reliability.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        // Using a reliable free model from Hugging Face
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2",
            {
                headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY || ""}` },
                method: "POST",
                body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
            }
        );

        if (!response.ok) {
            // Fallback or error handling
            const err = await response.text();
            throw new Error(`Embedding failed: ${err}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Embedding Error:", error);
        // Return a zero-vector if everything fails (not ideal, but prevents crash)
        return new Array(384).fill(0);
    }
}
