import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendComplaintEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { complaintId } = await request.json();

    // Fetch complaint
    const { data: complaint, error } = await supabase
      .from("complaints")
      .select("*, profiles!citizen_id(*)")
      .eq("id", complaintId)
      .single();

    if (error || !complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    if (!complaint.dept_email) {
      return NextResponse.json({ error: "No department email found" }, { status: 400 });
    }

    // Send email via Resend
    await sendComplaintEmail({
      to: complaint.dept_email,
      subject: complaint.ai_draft_email_subject || `Complaint #${complaint.complaint_number}`,
      body: complaint.ai_draft_email_body || "Please see the attached complaint.",
      complaintNumber: complaint.complaint_number,
      citizenEmail: complaint.profiles?.email,
    });

    // Update complaint
    await supabase
      .from("complaints")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", complaintId);

    // Timeline
    await supabase.from("complaint_timeline").insert({
      complaint_id: complaintId,
      status: "under_review",
      note: `Complaint email sent to ${complaint.dept_name} (${complaint.dept_email})`,
      updated_by: "system",
    });

    await supabase.from("complaints").update({ status: "under_review" }).eq("id", complaintId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
