"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";

export default function NewComplaintPage() {
  const router = useRouter();
  const supabase = createClient();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace("/login");
      else setChecking(false);
    });
  }, []);

  if (checking) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="spinner" />
    </div>
  );

  const steps = [
    { step: "1", text: "Add evidence — photo, voice &/or text", icon: "📸" },
    { step: "2", text: "Pin the location on map", icon: "📍" },
    { step: "3", text: "AI analyses and finds the right department", icon: "🤖" },
    { step: "4", text: "Complaint email sent on your behalf", icon: "📧" },
    { step: "5", text: "Earn 100 CityCoins when resolved!", icon: "🪙" },
  ];

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
        <div>
          <h1 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Report an Issue</h1>
          <p style={{ color: "rgba(240,244,255,0.5)", fontSize: "0.8rem", margin: 0 }}>
            AI-powered civic complaint
          </p>
        </div>
      </div>

      <div style={{ padding: "24px 20px" }}>
        {/* Hero */}
        <div
          style={{
            textAlign: "center",
            padding: "28px 24px",
            background: "linear-gradient(135deg, rgba(247,148,29,0.12), rgba(255,186,8,0.06))",
            border: "1px solid rgba(247,148,29,0.2)",
            borderRadius: 24,
            marginBottom: 28,
          }}
        >
          <p style={{ fontSize: "3rem", marginBottom: 10 }}>🤖</p>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 8 }}>
            AI-Powered Routing
          </h2>
          <p style={{ color: "rgba(240,244,255,0.55)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 20 }}>
            Capture a photo/video, record your voice, or type your complaint — or combine all three for stronger evidence.
          </p>

          {/* Evidence type chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 24 }}>
            {[
              { icon: "📷", label: "Real-time Photo", color: "#38bdf8" },
              { icon: "🎥", label: "Live Video", color: "#a78bfa" },
              { icon: "🎙️", label: "Voice Note", color: "#34d399" },
              { icon: "✍️", label: "Text", color: "#ffba08" },
            ].map((chip) => (
              <span
                key={chip.label}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  background: `${chip.color}15`,
                  border: `1px solid ${chip.color}30`,
                  color: chip.color,
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {chip.icon} {chip.label}
              </span>
            ))}
          </div>

          <button
            id="start-complaint-btn"
            onClick={() => router.push("/complaint/new/evidence")}
            style={{
              background: "linear-gradient(135deg, #f7941d, #ffba08)",
              border: "none",
              borderRadius: 14,
              padding: "14px 32px",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#050d1a",
              cursor: "pointer",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 20px rgba(255,186,8,0.3)",
              transition: "all 0.2s",
            }}
          >
            🚨 Report Issue Now
          </button>
        </div>

        {/* Info tip */}
        <div className="alert alert-info" style={{ marginBottom: 24 }}>
          <span>📍</span>
          <span>
            Photos &amp; videos are captured live with GPS location and timestamp — no uploads allowed.
          </span>
        </div>

        {/* What happens next */}
        <div>
          <p className="section-title">WHAT HAPPENS NEXT</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {steps.map((item) => (
              <div
                key={item.step}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 10,
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    background: "rgba(255,186,8,0.15)",
                    border: "1px solid rgba(255,186,8,0.3)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#ffba08",
                    flexShrink: 0,
                  }}
                >
                  {item.step}
                </span>
                <span style={{ fontSize: "0.88rem", color: "rgba(240,244,255,0.65)" }}>
                  {item.icon} {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
