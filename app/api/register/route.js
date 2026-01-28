import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";

// Initialize Supabase Client (Server-Side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            studentName,
            studentClass,
            parentName,
            phone,
            email,
            address
        } = body;

        // Insert data into Supabase
        const { data, error } = await supabase
            .from('students')
            .insert([
                {
                    student_name: studentName,
                    class: studentClass,
                    parent_name: parentName,
                    phone: phone,
                    email: email,
                    address: address
                },
            ])
            .select();

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw error;
        }

        return NextResponse.json({ success: true, message: "Registration saved successfully!" });
    } catch (error) {
        console.error("Server Error:", error);
        return NextResponse.json(
            { error: "Failed to save data. Please try again." },
            { status: 500 }
        );
    }
}
