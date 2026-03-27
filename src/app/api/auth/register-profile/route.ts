import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      full_name,
      email,
      phone,
      city,
      full_address,
      state,
      pincode,
      aadhaar_hash,
      language_preference,
    } = body;

    if (!id || !full_name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use admin client — bypasses RLS so profile can be inserted even before email is verified
    const adminSupabase = await createAdminClient();

    const { error } = await adminSupabase.from("profiles").insert({
      id,
      full_name,
      email,
      phone,
      city,
      full_address,
      state,
      pincode,
      aadhaar_hash,
      language_preference: language_preference || "en",
      city_coins: 0,
      account_status: "active",
    });

    if (error) {
      console.error("Profile insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Register profile error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
