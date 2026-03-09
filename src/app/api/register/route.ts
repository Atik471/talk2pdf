import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json();

        const hashedPassword = await bcrypt.hash(password, 10);

        const { error } = await supabase
            .from("users")
            .insert([
                { name, email, password: hashedPassword }
            ]);

        if (error) throw error;

        return NextResponse.json(
            { message: "User registered." },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create user" },
            { status: 500 }
        );
    }
}
