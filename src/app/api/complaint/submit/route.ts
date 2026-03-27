import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyseComplaint, transcribeVoice } from "@/lib/gemini";
import { generateComplaintNumber } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      images = [],
      voiceBase64,
      textDescription,
      locationAddress,
      city,
      state,
      ward,
      userLanguage = "en",
      lat,
      lng,
      citizenId,
    } = body;

    // Check rate limit: max 5 complaints per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("complaints")
      .select("*", { count: "exact", head: true })
      .eq("citizen_id", user.id)
      .gte("created_at", today.toISOString());

    if ((count ?? 0) >= 5) {
      return NextResponse.json(
        { error: "Daily limit reached. Maximum 5 complaints per day." },
        { status: 429 }
      );
    }

    // Transcribe voice if provided
    let voiceTranscript = "";
    if (voiceBase64) {
      voiceTranscript = await transcribeVoice(voiceBase64);
    }

    // Check for duplicate complaints within 50m radius in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: nearby } = await supabase
      .from("complaints")
      .select("id, complaint_number, issue_type, status, location_lat, location_lng")
      .gte("created_at", thirtyDaysAgo)
      .not("status", "eq", "fraud");

    // Simple radius check (we skip haversine for now, use rough box)
    const duplicates = (nearby || []).filter(c => {
      if (!c.location_lat || !c.location_lng || !lat || !lng) return false;
      const dlat = Math.abs(c.location_lat - lat);
      const dlng = Math.abs(c.location_lng - lng);
      return dlat < 0.0005 && dlng < 0.0005; // ~50m radius approx
    });

    // Run Gemini analysis
    const geminiResult = await analyseComplaint({
      images,
      voiceTranscript,
      textDescription,
      locationAddress,
      city,
      state,
      ward,
      userLanguage,
      lat,
      lng,
    });

    // Generate complaint number
    const complaintNumber = generateComplaintNumber();

    // Upload photos to Supabase Storage (in production)
    // For now we skip storage upload to simplify - photos were already uploaded
    const photoUrls: string[] = []; // Would be populated from Supabase Storage in production

    // Determine initial status
    let status = "ai_verified";
    if (geminiResult.fraud_indicators?.length > 0) {
      status = "fraud";
    } else if (geminiResult.is_genuine && geminiResult.dept_email) {
      status = "routed";
    }

    // Insert complaint
    const { data: complaint, error: insertErr } = await supabase
      .from("complaints")
      .insert({
        complaint_number: complaintNumber,
        citizen_id: user.id,
        issue_type: geminiResult.issue_type,
        severity: geminiResult.severity,
        description: textDescription,
        voice_note_url: null,
        photo_urls: photoUrls,
        location_lat: lat,
        location_lng: lng,
        location_address: locationAddress,
        city,
        ward,
        dept_name: geminiResult.department,
        dept_email: geminiResult.dept_email,
        dept_phone: geminiResult.dept_phone,
        ai_draft_email_subject: geminiResult.draft_email?.subject,
        ai_draft_email_body: geminiResult.draft_email?.body,
        ai_confidence: geminiResult.search_confidence,
        gemini_analysis: geminiResult,
        status,
        fraud_flag: geminiResult.fraud_indicators?.length > 0,
        coins_awarded: false,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Add to timeline
    await supabase.from("complaint_timeline").insert([
      {
        complaint_id: complaint.id,
        status: "submitted",
        note: "Complaint submitted by citizen",
        updated_by: "citizen",
      },
      {
        complaint_id: complaint.id,
        status: "ai_verified",
        note: `AI Analysis complete. Issue: ${geminiResult.issue_type}, Severity: ${geminiResult.severity}`,
        updated_by: "system",
      },
    ]);

    if (status === "routed") {
      await supabase.from("complaint_timeline").insert({
        complaint_id: complaint.id,
        status: "routed",
        note: `Routed to ${geminiResult.department}`,
        updated_by: "system",
      });
    }

    return NextResponse.json({
      complaintId: complaint.id,
      complaintNumber,
      geminiAnalysis: geminiResult,
      status,
      duplicates: duplicates.length > 0 ? duplicates.slice(0, 2) : [],
    });
  } catch (error) {
    console.error("Complaint submit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
