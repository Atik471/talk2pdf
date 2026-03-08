import { supabase } from "@/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const { data: user, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 is "no rows returned"
      throw error;
    }

    console.log("user exists check:", user);
    return NextResponse.json({ user });
  } catch (error) {
    console.error("UserExist error:", error);
    return NextResponse.json({ error: "Failed to check user existence" }, { status: 500 });
  }
}
