"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id");
  const number = params.get("number");

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", width: "100%" }}>
        {/* Success animation */}
        <div
          className="success-icon"
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.1))",
            border: "3px solid #34d399",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 28px",
            fontSize: "3rem",
          }}
        >
          ✅
        </div>

        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#34d399", marginBottom: 8 }}>
          Complaint Submitted!
        </h1>
        <p style={{ color: "rgba(240,244,255,0.55)", marginBottom: 28 }}>
          Your complaint has been successfully registered and routed.
        </p>

        {/* Complaint ID */}
        <div
          style={{
            background: "rgba(255,186,8,0.08)",
            border: "1px solid rgba(255,186,8,0.2)",
            borderRadius: 16,
            padding: "20px",
            marginBottom: 28,
          }}
        >
          <p style={{ fontSize: "0.78rem", color: "rgba(240,244,255,0.45)", marginBottom: 4 }}>
            COMPLAINT NUMBER
          </p>
          <p style={{ fontSize: "2rem", fontWeight: 800, color: "#ffba08", marginBottom: 8 }}>
            #{number || "C1000"}
          </p>
          <p style={{ color: "rgba(240,244,255,0.5)", fontSize: "0.85rem" }}>
            Save this number to track your complaint
          </p>
        </div>

        {/* What's next */}
        <div
          style={{
            background: "rgba(15,32,64,0.5)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 20,
            marginBottom: 28,
            textAlign: "left",
          }}
        >
          <p style={{ fontSize: "0.78rem", color: "rgba(240,244,255,0.45)", marginBottom: 12 }}>
            WHAT HAPPENS NEXT
          </p>
          {[
            { icon: "📧", text: "Complaint email sent to government department" },
            { icon: "📱", text: "You'll get notified on every status update" },
            { icon: "🪙", text: "Earn 100 CityCoins when complaint is resolved" },
            { icon: "📋", text: "Track progress anytime in 'My Cases'" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
              <span style={{ fontSize: "0.85rem", color: "rgba(240,244,255,0.65)" }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {id && (
            <Link href={`/complaint/${id}`} style={{ textDecoration: "none" }}>
              <button id="track-complaint-btn" className="btn-primary">
                📊 Track This Complaint
              </button>
            </Link>
          )}
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <button id="back-home-btn" className="btn-secondary">
              🏠 Back to Home
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><div className="spinner" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
