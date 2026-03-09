import { NextResponse } from "next/server";
import { getAIResponse } from "@/lib/ai-chat";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // 1. Test Supabase Connection
        const { error: dbError } = await supabase.from("users").select("id").limit(1);

        // 2. Test OpenRouter Connection
        const aiTestMsg = [{ role: "user" as const, content: "Hello, this is a test. Reply with exactly 'TEST_OK'." }];
        let aiResponse = "Failed";
        let aiError = null;
        try {
            aiResponse = await getAIResponse(aiTestMsg);
        } catch (e: Error | unknown) {
            aiError = e instanceof Error ? e.message : String(e);
        }

        return NextResponse.json({
            status: "Test Completed",
            supabase: dbError ? `Error: ${dbError.message}` : "Connected Successfully",
            openrouter: aiError ? `Error: ${aiError}` : `Connected, Response: ${aiResponse}`,
        });

    } catch (error: Error | unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
