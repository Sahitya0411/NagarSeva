import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminUser } = await adminSupabase.from("admin_users").select("id").eq("id", user.id).single();
    if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { complaintId, reason } = await request.json();

    const { data: complaint } = await adminSupabase
      .from("complaints")
      .select("citizen_id")
      .eq("id", complaintId)
      .single();

    if (!complaint) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Update complaint status
    await adminSupabase
      .from("complaints")
      .update({ status: "fraud", fraud_flag: true, fraud_reason: reason })
      .eq("id", complaintId);

    // Timeline
    await adminSupabase.from("complaint_timeline").insert({
      complaint_id: complaintId,
      status: "fraud",
      note: `Marked as fraud by admin: ${reason}`,
      updated_by: "admin",
    });

    // Check fraud count for this user
    const { count: fraudCount } = await adminSupabase
      .from("complaints")
      .select("*", { count: "exact", head: true })
      .eq("citizen_id", complaint.citizen_id)
      .eq("status", "fraud");

    if ((fraudCount ?? 0) >= 3) {
      // Auto-disable account
      await adminSupabase
        .from("profiles")
        .update({ account_status: "disabled" })
        .eq("id", complaint.citizen_id);
    } else if ((fraudCount ?? 0) >= 1) {
      await adminSupabase
        .from("profiles")
        .update({ account_status: "warned" })
        .eq("id", complaint.citizen_id);
    }

    return NextResponse.json({ success: true, fraudCount });
  } catch (error) {
    console.error("Flag fraud error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
