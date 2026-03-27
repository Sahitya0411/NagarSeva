import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendNotificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminUser } = await adminSupabase.from("admin_users").select("id").eq("id", user.id).single();
    if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { message, city } = await request.json();

    // Get all active users
    let query = adminSupabase.from("profiles").select("email, full_name").eq("account_status", "active");
    if (city) query = query.eq("city", city);
    const { data: users } = await query;

    // Send emails (in production, use batch/queue)
    let sent = 0;
    for (const u of (users || []).slice(0, 50)) { // Limit to 50 for demo
      try {
        await sendNotificationEmail({
          to: u.email,
          subject: "NagarSeva — Important Announcement",
          message: `Dear ${u.full_name},\n\n${message}`,
        });
        sent++;
      } catch { /* continue */ }
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
