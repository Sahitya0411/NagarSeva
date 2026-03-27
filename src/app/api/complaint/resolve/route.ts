import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { verifyResolution } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check admin
    const { data: adminUser } = await adminSupabase.from("admin_users").select("id").eq("id", user.id).single();
    if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { complaintId, resolutionPhotoBase64 } = await request.json();

    const { data: complaint } = await adminSupabase
      .from("complaints")
      .select("*")
      .eq("id", complaintId)
      .single();

    if (!complaint) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });

    // Verify with Gemini
    const verification = await verifyResolution({
      originalPhotos: [], // Would load from Supabase Storage
      resolutionPhoto: resolutionPhotoBase64 || "",
      issueType: complaint.issue_type,
    });

    if (verification.verified && verification.confidence > 0.6) {
      // Mark resolved + award coins
      await adminSupabase
        .from("complaints")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
          coins_awarded: true,
        })
        .eq("id", complaintId);

      // Award 100 CityCoins
      await adminSupabase
        .from("profiles")
        .update({ city_coins: complaint.coins_balance + 100 })
        .eq("id", complaint.citizen_id);

      // Coin transaction
      await adminSupabase.from("coin_transactions").insert({
        citizen_id: complaint.citizen_id,
        complaint_id: complaintId,
        type: "earned",
        amount: 100,
        description: `Complaint resolved: ${complaint.complaint_number}`,
      });

      // Timeline
      await adminSupabase.from("complaint_timeline").insert({
        complaint_id: complaintId,
        status: "resolved",
        note: `Resolved and verified by AI (confidence: ${Math.round(verification.confidence * 100)}%). ${verification.reason}`,
        updated_by: "admin",
      });

      return NextResponse.json({ success: true, coinsAwarded: 100, verification });
    } else {
      return NextResponse.json({
        success: false,
        message: "AI could not verify resolution. Manual admin review required.",
        verification,
      });
    }
  } catch (error) {
    console.error("Resolve error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
