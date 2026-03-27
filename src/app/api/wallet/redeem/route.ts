import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { upiId, amount } = await request.json(); // amount in rupees

    if (amount < 10) {
      return NextResponse.json({ error: "Minimum redemption is ₹10 (1000 coins)" }, { status: 400 });
    }

    const coinsRequired = amount * 100;

    const { data: profile } = await supabase
      .from("profiles")
      .select("city_coins")
      .eq("id", user.id)
      .single();

    if (!profile || profile.city_coins < coinsRequired) {
      return NextResponse.json({ error: "Insufficient CityCoins balance" }, { status: 400 });
    }

    // In production: trigger Razorpay payout here
    // const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    // await razorpay.payouts.create({ account_number, fund_account: { ... }, amount: amount * 100, currency: "INR" });

    // Deduct coins
    await supabase
      .from("profiles")
      .update({ city_coins: profile.city_coins - coinsRequired })
      .eq("id", user.id);

    // Record transaction
    await supabase.from("coin_transactions").insert({
      citizen_id: user.id,
      type: "redeemed",
      amount: coinsRequired,
      description: `Redeemed ₹${amount} via UPI (${upiId})`,
    });

    return NextResponse.json({
      success: true,
      message: `₹${amount} will be credited to ${upiId} within 24 hours`,
    });
  } catch (error) {
    console.error("Redeem error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
