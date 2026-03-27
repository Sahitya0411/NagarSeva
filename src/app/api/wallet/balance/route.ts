import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("city_coins")
      .eq("id", user.id)
      .single();

    const { data: transactions } = await supabase
      .from("coin_transactions")
      .select("*")
      .eq("citizen_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      balance: profile?.city_coins || 0,
      transactions: transactions || [],
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
