import { NextResponse } from "next/server";
import { getAIResponse } from "@/lib/ai-chat";
import { supabase } from "@/lib/supabaseClient";
import { ChatMessage } from "@/lib/openrouter";

export async function POST(req: Request) {
  try {
    const { message, chatId } = await req.json();
    if (!message || !chatId) {
      return NextResponse.json({ error: "Message and Chat ID are required" }, { status: 400 });
    }

    // 1. Get the PDF text stored in the chats table for context
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("pdf_text, pdf_name")
      .eq("id", chatId)
      .single();

    if (chatError) {
      console.error("Chat fetch error:", chatError);
    }

    // Use first 8000 chars of PDF as context (model context limit)
    const pdfContext = chat?.pdf_text
      ? `PDF: "${chat.pdf_name || 'Uploaded PDF'}"\n\n${chat.pdf_text.slice(0, 8000)}`
      : "No PDF content available.";

    // 2. Fetch recent message history
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(10);

    const formattedHistory: ChatMessage[] = (history || [])
      .filter(m => m.content !== message)
      .reverse()
      .map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
      }));

    // 3. Construct messages with system prompt + history + current message
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are a helpful PDF assistant. Answer questions based on the following PDF content:\n\n${pdfContext}\n\nIf the answer is not clearly in the document, say so honestly.`
      },
      ...formattedHistory,
      { role: "user", content: message }
    ];

    // 4. Get AI Response
    const aiReply = await getAIResponse(messages);

    // 5. Save AI message to Supabase
    await supabase.from("messages").insert({
      chat_id: chatId,
      role: "assistant",
      content: aiReply
    });

    return NextResponse.json({ reply: aiReply });
  } catch (error: unknown) {
    console.error("API Error:", error);
    const details = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json({ error: "Internal Server Error", details }, { status: 500 });
  }
}