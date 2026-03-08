import { NextResponse } from "next/server";
import { getAIResponse } from "@/lib/ai-chat";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // 1. Test Supabase Connection
        const { data: dbData, error: dbError } = await supabase.from("users").select("id").limit(1);

        // 2. Test OpenRouter Connection
        const aiTestMsg = [{ role: "user" as const, content: "Hello, this is a test. Reply with exactly 'TEST_OK'." }];
        let aiResponse = "Failed";
        let aiError = null;
        try {
            aiResponse = await getAIResponse(aiTestMsg);
        } catch (e: any) {
            aiError = e.message;
        }

        // 3. Test RPC Function (search_pdf_json)
        const dummyEmbedding = new Array(384).fill(0);
        const { error: rpcError } = await supabase.rpc("search_pdf_json", {
            payload: {
                query_embedding: dummyEmbedding,
                match_threshold: 0.5,
                match_count: 5,
                chat_id: "00000000-0000-0000-0000-000000000000" // dummy uuid
            }
        });

        return NextResponse.json({
            status: "Test Completed",
            supabase: dbError ? `Error: ${dbError.message}` : "Connected Successfully",
            openrouter: aiError ? `Error: ${aiError}` : `Connected, Response: ${aiResponse}`,
            db_rpc_check: rpcError ? `RPC Error: ${rpcError.message} (Code: ${rpcError.code})` : "RPC 'find_relevant_chunks' Successfully Configured!"
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
