"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fileToBase64 } from "@/lib/utils";
import { ChevronLeft, Copy, Mail, CheckCircle, AlertTriangle, Globe } from "lucide-react";

const AI_MESSAGES = [
  "Analysing your photos with AI...",
  "Identifying the civic issue type...",
  "Detecting severity level...",
  "Checking complaint genuineness...",
  "Searching for the right government department...",
  "Finding official contact information...",
  "Drafting your complaint email...",
  "Finalising the analysis...",
];

export default function ReviewPage() {
  const router = useRouter();
  const supabase = createClient();

  const [stage, setStage] = useState<"loading" | "result" | "error">("loading");
  const [msgIndex, setMsgIndex] = useState(0);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const [emailLang, setEmailLang] = useState<"en" | "local">("en");
  const [editingEmail, setEditingEmail] = useState(false);
  const [editedEmailBody, setEditedEmailBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Cycle through loading messages
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % AI_MESSAGES.length);
    }, 1800);

    runAnalysis();

    return () => clearInterval(interval);
  }, []);

  async function runAnalysis() {
    const draft = JSON.parse(sessionStorage.getItem("ns_complaint_draft") || "{}");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const evidence = (window as any).__nsEvidence || {};

    if (!draft.lat && !draft.locationAddress) {
      router.replace("/complaint/new/location");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();

      // Convert photos to base64
      const photoBase64s: string[] = [];
      if (evidence.photos) {
        for (const photo of evidence.photos.slice(0, 5)) {
          try {
            const b64 = await fileToBase64(photo);
            photoBase64s.push(b64);
          } catch {
            // skip
          }
        }
      }

      // Convert voice to base64
      let voiceBase64 = "";
      if (evidence.voiceBlob) {
        try {
          const reader = new FileReader();
          voiceBase64 = await new Promise((resolve) => {
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.readAsDataURL(evidence.voiceBlob);
          });
        } catch {
          //
        }
      }

      const response = await fetch("/api/complaint/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: photoBase64s,
          voiceBase64,
          textDescription: draft.textDescription || "",
          locationAddress: draft.locationAddress || "",
          city: profile?.city || "",
          state: profile?.state || "",
          ward: draft.ward || "",
          userLanguage: profile?.language_preference || "en",
          lat: draft.lat || 0,
          lng: draft.lng || 0,
          citizenId: session.user.id,
        }),
      });

      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();

      setAnalysis(data);
      setEditedEmailBody((data.geminiAnalysis as Record<string, unknown>)?.draft_email ? ((data.geminiAnalysis as Record<string, { body: string }>)?.draft_email?.body ?? "") : "");
      setStage("result");
    } catch (e) {
      console.error(e);
      setError("AI analysis failed. Please try again.");
      setStage("error");
    }
  }

  async function handleSendEmail() {
    if (!analysis) return;
    setSubmitting(true);
    try {
      await fetch("/api/complaint/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId: analysis.complaintId }),
      });
      router.push(`/complaint/success?id=${analysis.complaintId}&number=${analysis.complaintNumber}`);
    } catch {
      setError("Failed to send email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitOnly() {
    if (!analysis) return;
    router.push(`/complaint/success?id=${analysis.complaintId}&number=${analysis.complaintNumber}`);
  }

  function handleCopy() {
    const text = `
Department: ${(analysis?.geminiAnalysis as Record<string, unknown>)?.department}
Email: ${(analysis?.geminiAnalysis as Record<string, unknown>)?.dept_email}
Phone: ${(analysis?.geminiAnalysis as Record<string, unknown>)?.dept_phone}

Subject: ${(analysis?.geminiAnalysis as Record<string, { subject: string }>)?.draft_email?.subject}

${editedEmailBody || (analysis?.geminiAnalysis as Record<string, { body: string }>)?.draft_email?.body}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const gemini = analysis?.geminiAnalysis as Record<string, unknown> | undefined;

  const severityColors: Record<string, string> = {
    Low: "#34d399",
    Medium: "#fbbf24",
    High: "#fb7185",
    Critical: "#ef4444",
  };

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", paddingBottom: 40 }}>
      {/* Header */}
      <div className="page-header">
        {stage !== "loading" && (
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
        )}
        <div>
          <h1 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>AI Analysis</h1>
          <p style={{ color: "rgba(240,244,255,0.5)", fontSize: "0.8rem", margin: 0 }}>
            Step 3 of 3 — Review & Submit
          </p>
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: "12px 20px 0" }}>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: "100%" }} />
        </div>
      </div>

      {/* Loading State */}
      {stage === "loading" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 24px",
            textAlign: "center",
          }}
        >
          {/* Animated AI orb */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,186,8,0.3), rgba(247,148,29,0.1))",
              border: "2px solid rgba(255,186,8,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.5rem",
              marginBottom: 32,
              animation: "pulse-ring 2s ease-in-out infinite",
              boxShadow: "0 0 40px rgba(255,186,8,0.2)",
            }}
          >
            🤖
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 8 }}>
            NagarSeva AI is working...
          </h2>
          <p
            style={{
              color: "#ffba08",
              fontSize: "0.95rem",
              minHeight: 24,
              transition: "all 0.3s",
              marginBottom: 32,
            }}
          >
            {AI_MESSAGES[msgIndex]}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 }}>
            {AI_MESSAGES.slice(0, 5).map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  opacity: i <= msgIndex ? 1 : 0.25,
                  transition: "opacity 0.5s",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: i < msgIndex ? "#34d399" : i === msgIndex ? "#ffba08" : "rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    flexShrink: 0,
                  }}
                >
                  {i < msgIndex ? "✓" : i === msgIndex ? "●" : "○"}
                </div>
                <span style={{ fontSize: "0.82rem", color: "rgba(240,244,255,0.65)" }}>{msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {stage === "error" && (
        <div style={{ padding: 24 }}>
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
          <button
            className="btn-secondary"
            onClick={() => { setStage("loading"); setMsgIndex(0); runAnalysis(); }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Result State */}
      {stage === "result" && gemini && (
        <div style={{ padding: "20px" }}>
          {/* Issue detected */}
          <div className="ai-analysis-card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "rgba(255,186,8,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.3rem",
                }}
              >
                🤖
              </div>
              <div>
                <p style={{ fontSize: "0.72rem", color: "rgba(240,244,255,0.45)", margin: 0 }}>
                  ISSUE DETECTED
                </p>
                <p style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
                  {String(gemini.issue_type)}
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16,flexWrap: "wrap" }}>
              <div
                style={{
                  padding: "8px 14px",
                  background: `${severityColors[String(gemini.severity)]}15`,
                  border: `1px solid ${severityColors[String(gemini.severity)]}30`,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ color: severityColors[String(gemini.severity)], fontSize: "0.8rem", fontWeight: 700 }}>
                  ⚠️ {String(gemini.severity).toUpperCase()}
                </span>
              </div>

              <div
                style={{
                  padding: "8px 14px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  fontSize: "0.8rem",
                  color: "rgba(240,244,255,0.6)",
                }}
              >
                AI Confidence: <span style={{ color: "#f0f4ff", fontWeight: 700 }}>
                  {Math.round(Number(gemini.search_confidence) * 100)}%
                </span>
              </div>
            </div>

            {/* Fraud check */}
            <div
              className={`alert ${gemini.is_genuine ? "alert-success" : "alert-error"}`}
              style={{ marginBottom: 12 }}
            >
              {gemini.is_genuine ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
              <span>{gemini.is_genuine
                ? "✅ Complaint appears genuine"
                : `⚠️ Fraud indicators found: ${(gemini.fraud_indicators as string[])?.join(", ")}`}
              </span>
            </div>

            {/* Summary */}
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 10,
                fontSize: "0.85rem",
                color: "rgba(240,244,255,0.65)",
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: "rgba(240,244,255,0.45)", fontSize: "0.75rem" }}>AI SUMMARY: </span>
              {String(gemini.summary)}
            </div>
          </div>

          {/* Department Card */}
          {Number(gemini.search_confidence) >= 0.4 ? (
            <div
              style={{
                background: "rgba(15,32,64,0.7)",
                border: "1px solid rgba(255,186,8,0.2)",
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
              }}
            >
              <p style={{ fontSize: "0.72rem", color: "rgba(240,244,255,0.45)", marginBottom: 8 }}>
                ROUTED DEPARTMENT
              </p>
              <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 12, color: "#f0f4ff" }}>
                🏛️ {String(gemini.department)}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: "0.82rem", color: "rgba(240,244,255,0.45)", width: 50, flexShrink: 0 }}>Email</span>
                  <a
                    href={`mailto:${gemini.dept_email}`}
                    style={{ color: "#38bdf8", fontSize: "0.85rem", textDecoration: "none" }}
                  >
                    {String(gemini.dept_email)}
                  </a>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: "0.82rem", color: "rgba(240,244,255,0.45)", width: 50, flexShrink: 0 }}>Phone</span>
                  <a
                    href={`tel:${gemini.dept_phone}`}
                    style={{ color: "#34d399", fontSize: "0.85rem", textDecoration: "none" }}
                  >
                    {String(gemini.dept_phone)}
                  </a>
                </div>
                {gemini.dept_website != null && (
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: "0.82rem", color: "rgba(240,244,255,0.45)", width: 50, flexShrink: 0 }}>Web</span>
                    <a
                      href={`https://${gemini.dept_website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#a78bfa", fontSize: "0.85rem", textDecoration: "none" }}
                    >
                      {String(gemini.dept_website)}
                    </a>
                  </div>
                )}
              </div>
              <div
                style={{
                  marginTop: 12,
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 8,
                  fontSize: "0.78rem",
                  color: "rgba(240,244,255,0.45)",
                }}
              >
                ⏱️ Expected resolution: ~{Number(gemini.suggested_resolution_days)} days
              </div>
            </div>
          ) : (
            <div className="alert alert-warning" style={{ marginBottom: 16 }}>
              <AlertTriangle size={14} />
              <span>
                AI confidence is low. Please verify department details before sending.
              </span>
            </div>
          )}

          {/* Draft Email */}
          <div
            style={{
              background: "rgba(15,32,64,0.6)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ fontWeight: 600, fontSize: "0.92rem", margin: 0 }}>📧 Draft Email</p>
              <div style={{ display: "flex", gap: 8 }}>
                {gemini.draft_email_local != null && (
                  <button
                    onClick={() => setEmailLang(l => l === "en" ? "local" : "en")}
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "none",
                      borderRadius: 8,
                      padding: "4px 10px",
                      color: "rgba(240,244,255,0.7)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontFamily: "DM Sans, sans-serif",
                    }}
                  >
                    <Globe size={12} />
                    {emailLang === "en" ? "Translate" : "English"}
                  </button>
                )}
                <button
                  onClick={() => setEditingEmail(e => !e)}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "none",
                    borderRadius: 8,
                    padding: "4px 10px",
                    color: "rgba(240,244,255,0.7)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  {editingEmail ? "Preview" : "✏️ Edit"}
                </button>
              </div>
            </div>

            <div
              style={{
                padding: "10px 14px",
                background: "rgba(255,186,8,0.08)",
                border: "1px solid rgba(255,186,8,0.15)",
                borderRadius: 8,
                marginBottom: 10,
                fontSize: "0.85rem",
                color: "rgba(240,244,255,0.8)",
              }}
            >
              <span style={{ color: "rgba(240,244,255,0.45)", fontSize: "0.72rem" }}>SUBJECT: </span>
              {emailLang === "en"
                ? String((gemini.draft_email as Record<string, string>)?.subject)
                : String((gemini.draft_email_local as Record<string, string>)?.subject || (gemini.draft_email as Record<string, string>)?.subject)}
            </div>

            {editingEmail ? (
              <textarea
                id="edit-email-body"
                className="input-field"
                value={editedEmailBody}
                onChange={e => setEditedEmailBody(e.target.value)}
                style={{ minHeight: 200, fontSize: "0.82rem", lineHeight: 1.6 }}
              />
            ) : (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 8,
                  fontSize: "0.82rem",
                  color: "rgba(240,244,255,0.7)",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                {emailLang === "en"
                  ? editedEmailBody || String((gemini.draft_email as Record<string, string>)?.body)
                  : String((gemini.draft_email_local as Record<string, string>)?.body || (gemini.draft_email as Record<string, string>)?.body)}
              </div>
            )}
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              id="send-email-btn"
              className="btn-primary"
              onClick={handleSendEmail}
              disabled={submitting}
              style={{ opacity: submitting ? 0.7 : 1 }}
            >
              <Mail size={18} />
              {submitting ? "Sending..." : "📤 Send Email via NagarSeva"}
            </button>

            <button
              id="copy-btn"
              className="btn-secondary"
              onClick={handleCopy}
            >
              <Copy size={16} />
              {copied ? "✅ Copied!" : "📋 Copy Email + Contact Info"}
            </button>

            <button
              id="submit-only-btn"
              className="btn-secondary"
              onClick={handleSubmitOnly}
              style={{
                background: "rgba(52,211,153,0.1)",
                border: "1px solid rgba(52,211,153,0.25)",
                color: "#34d399",
              }}
            >
              ✅ Submit Complaint Officially
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
