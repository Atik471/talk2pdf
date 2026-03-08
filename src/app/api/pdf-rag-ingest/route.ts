import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { chunkText, generateEmbedding } from "@/lib/embeddings";

export async function POST(req: NextRequest) {
    try {
        const { pdfUrl, pdfName, userId } = await req.json();

        if (!pdfUrl || !userId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Extract Text (Reusing logic from extract-text)
        const response = await fetch(encodeURI(pdfUrl));
        if (!response.ok) throw new Error("Failed to fetch PDF");
        const pdfBuffer = await response.arrayBuffer();

        // Dynamically import pdf-parse
        const { default: PdfParse } = await import('pdf-parse/lib/pdf-parse.js');
        const pdfData = await PdfParse(pdfBuffer);
        const fullText = pdfData.text;

        // 2. Create Chat Entry
        const { data: chatData, error: chatError } = await supabase
            .from("chats")
            .insert([{
                user_id: userId,
                pdf_url: pdfUrl,
                pdf_text: fullText, // Still keep full text as fallback
                pdf_name: pdfName
            }])
            .select()
            .single();

        if (chatError) throw chatError;
        const chatId = chatData.id;

        // 3. Chunk and Embed
        const chunks = chunkText(fullText);

        // Process chunks in batches to avoid overwhelming the API
        for (const chunk of chunks) {
            if (!chunk.trim()) continue;

            const embedding = await generateEmbedding(chunk);

            const { error: chunkError } = await supabase
                .from("pdf_chunks")
                .insert({
                    chat_id: chatId,
                    content: chunk,
                    embedding: embedding
                });

            if (chunkError) console.error("Error saving chunk:", chunkError);
        }

        return NextResponse.json({ success: true, chatId });

    } catch (error) {
        console.error("PDF Ingestion Error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Failed to process PDF"
        }, { status: 500 });
    }
}
