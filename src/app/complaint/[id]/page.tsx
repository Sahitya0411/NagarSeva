"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Complaint, ComplaintTimeline } from "@/types";
import { getStatusLabel, getIssueTypeIcon, formatFullDate, formatDate } from "@/lib/utils";
import { ChevronLeft, Mail, Phone, Globe, CheckCircle, Clock, Circle } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";

const TIMELINE_STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "ai_verified", label: "AI Verified" },
  { key: "routed", label: "Routed to Dept." },
  { key: "under_review", label: "Under Review" },
  { key: "resolved", label: "Resolved" },
];

function getStepIndex(status: string): number {
  const map: Record<string, number> = {
    submitted: 0,
    ai_verified: 1,
    routed: 2,
    under_review: 3,
    resolved: 4,
    fraud: 4,
    disputed: 3,
  };
  return map[status] ?? 0;
}

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [timeline, setTimeline] = useState<ComplaintTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: c } = await supabase
        .from("complaints")
        .select("*")
        .eq("id", id)
        .single();
      setComplaint(c);

      const { data: t } = await supabase
        .from("complaint_timeline")
        .select("*")
        .eq("complaint_id", id)
        .order("created_at", { ascending: true });
      setTimeline(t || []);
      setLoading(false);
    };
    load();
  }, [id]);

  async function resendEmail() {
    setResending(true);
    await fetch("/api/complaint/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaintId: id }),
    });
    setResending(false);
    alert("Email resent successfully!");
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <p>Complaint not found.</p>
        <button className="btn-secondary" onClick={() => router.back()} style={{ marginTop: 16 }}>Go Back</button>
      </div>
    );
  }

  const currentStep = getStepIndex(complaint.status);
  const gemini = complaint.gemini_analysis as Record<string, unknown> | undefined;

  return (
    <main className="page-container">
      {/* Header */}
      <div className="page-header">
        <button
          onClick={() => router.back()}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "none",
            borderRadius: 10,
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#f0f4ff",
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>#{complaint.complaint_number}</h1>
          <p style={{ color: "rgba(240,244,255,0.5)", fontSize: "0.78rem", margin: 0 }}>
            {formatDate(complaint.created_at)}
          </p>
        </div>
        <span className={`badge badge-${complaint.status}`}>{getStatusLabel(complaint.status)}</span>
      </div>

      <div style={{ padding: "20px" }}>
        {/* Issue info */}
        <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: "2rem" }}>{getIssueTypeIcon(complaint.issue_type)}</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: "1.05rem", margin: 0 }}>{complaint.issue_type}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <span className={`badge badge-${complaint.severity?.toLowerCase()}`}>
                  {complaint.severity}
                </span>
              </div>
            </div>
          </div>
          {complaint.location_address && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ color: "#ffba08", fontSize: "0.9rem", flexShrink: 0 }}>📍</span>
              <p style={{ fontSize: "0.85rem", color: "rgba(240,244,255,0.65)", lineHeight: 1.4, margin: 0 }}>
                {complaint.location_address}
              </p>
            </div>
          )}
          {complaint.description && (
            <div style={{ marginTop: 8, padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
              <p style={{ fontSize: "0.82rem", color: "rgba(240,244,255,0.6)", lineHeight: 1.6, margin: 0 }}>
                {complaint.description}
              </p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div style={{ marginBottom: 16 }}>
          <p className="section-title">TIMELINE</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {TIMELINE_STEPS.map((step, i) => {
              const isCompleted = i < currentStep;
              const isCurrent = i === currentStep && complaint.status !== "fraud";
              const isPending = i > currentStep;

              return (
                <div key={step.key} className={`timeline-item ${isCompleted ? "completed" : ""}`}>
                  <div className={`timeline-dot ${isCompleted ? "completed" : isCurrent ? "current" : "pending"}`}>
                    {isCompleted ? (
                      <CheckCircle size={18} color="#34d399" />
                    ) : isCurrent ? (
                      <Clock size={18} color="#ffba08" />
                    ) : (
                      <Circle size={18} color="rgba(240,244,255,0.2)" />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingTop: 8 }}>
                    <p
                      style={{
                        fontWeight: isCurrent ? 700 : 500,
                        fontSize: "0.92rem",
                        color: isCompleted ? "#34d399" : isCurrent ? "#ffba08" : "rgba(240,244,255,0.4)",
                        margin: 0,
                      }}
                    >
                      {step.label}
                      {isCurrent && " (Current)"}
                    </p>
                    {/* Find matching timeline event */}
                    {timeline.find(t => t.status === step.key) && (
                      <p style={{ fontSize: "0.78rem", color: "rgba(240,244,255,0.4)", margin: "2px 0 0" }}>
                        {timeline.find(t => t.status === step.key)?.note}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {complaint.status === "fraud" && (
              <div className="timeline-item">
                <div className="timeline-dot" style={{ background: "rgba(244,63,94,0.2)", border: "2px solid #f43f5e" }}>
                  <span style={{ fontSize: "0.9rem" }}>🚫</span>
                </div>
                <div style={{ flex: 1, paddingTop: 8 }}>
                  <p style={{ fontWeight: 700, fontSize: "0.92rem", color: "#fb7185", margin: 0 }}>
                    Marked as Fraud
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "rgba(240,244,255,0.4)", margin: "2px 0 0" }}>
                    {complaint.fraud_reason}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Department Card */}
        {complaint.dept_name && (
          <div
            style={{
              background: "rgba(15,32,64,0.7)",
              border: "1px solid rgba(255,186,8,0.15)",
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <p className="section-title">ASSIGNED DEPARTMENT</p>
            <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 12 }}>
              🏛️ {complaint.dept_name}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {complaint.dept_email && (
                <a
                  href={`mailto:${complaint.dept_email}`}
                  style={{ display: "flex", gap: 10, alignItems: "center", textDecoration: "none" }}
                >
                  <Mail size={14} color="#38bdf8" />
                  <span style={{ color: "#38bdf8", fontSize: "0.85rem" }}>{complaint.dept_email}</span>
                </a>
              )}
              {complaint.dept_phone && (
                <a
                  href={`tel:${complaint.dept_phone}`}
                  style={{ display: "flex", gap: 10, alignItems: "center", textDecoration: "none" }}
                >
                  <Phone size={14} color="#34d399" />
                  <span style={{ color: "#34d399", fontSize: "0.85rem" }}>{complaint.dept_phone}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* AI Analysis */}
        {gemini && (
          <div className="ai-analysis-card" style={{ marginBottom: 16 }}>
            <p className="section-title">AI ANALYSIS</p>
            <p style={{ fontSize: "0.85rem", color: "rgba(240,244,255,0.65)", lineHeight: 1.6, marginBottom: 8 }}>
              {String(gemini.summary)}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="chip">
                🤖 {Math.round(Number(gemini.search_confidence) * 100)}% confidence
              </span>
              {gemini.suggested_resolution_days != null && (
                <span className="chip">
                  ⏱️ Est. {Number(gemini.suggested_resolution_days)} days
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {complaint.status !== "resolved" && complaint.status !== "fraud" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              id="resend-email-btn"
              className="btn-secondary"
              onClick={resendEmail}
              disabled={resending}
              style={{ opacity: resending ? 0.7 : 1 }}
            >
              <Mail size={16} />
              {resending ? "Sending..." : "📤 Resend Complaint Email"}
            </button>

            {/* Dispute button shown only if complaint is not resolved - show separately below */}
          </div>
        )}

        {/* Resolved celebration */}
        {complaint.status === "resolved" && (
          <div
            style={{
              textAlign: "center",
              padding: "24px",
              background: "linear-gradient(135deg, rgba(52,211,153,0.1), rgba(16,185,129,0.05))",
              border: "1px solid rgba(52,211,153,0.25)",
              borderRadius: 16,
              marginBottom: 16,
            }}
          >
            <p style={{ fontSize: "2.5rem", marginBottom: 8 }}>🎉</p>
            <p style={{ fontWeight: 700, color: "#34d399", fontSize: "1.1rem", marginBottom: 4 }}>
              Complaint Resolved!
            </p>
            {complaint.coins_awarded && (
              <p style={{ color: "#ffba08", fontWeight: 600 }}>
                <span className="coin-icon">🪙</span> +100 CityCoins Awarded!
              </p>
            )}
            <p style={{ color: "rgba(240,244,255,0.45)", fontSize: "0.82rem", marginTop: 4 }}>
              Resolved on {complaint.resolved_at ? formatFullDate(complaint.resolved_at) : ""}
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
