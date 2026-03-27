"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function VerifyPage() {
  const router = useRouter();
  const supabase = createClient();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const e = localStorage.getItem("ns_verify_email") || "";
    setEmail(e);
  }, []);

  function handleInput(index: number, value: string) {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = v;
    setOtp(next);
    setError("");

    if (v && index < 5) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });

      if (verifyErr) throw verifyErr;
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (e: unknown) {
      // For email+password signup, verification happens via email link
      // If no OTP flow, just redirect to login
      setError("Invalid OTP. Please check your email for the verification link.");
      // Fallback: if user is already verified via email link, go to dashboard
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    setTimer(30);
    setError("");
    try {
      await supabase.auth.resend({ type: "signup", email });
      const interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) { clearInterval(interval); return 0; }
          return t - 1;
        });
      }, 1000);
    } catch {
      setError("Failed to resend. Please try again.");
    }
  }

  if (success) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <div className="success-icon" style={{ fontSize: 64, marginBottom: 24 }}>✅</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 8 }}>Account Verified!</h2>
          <p style={{ color: "rgba(240,244,255,0.6)" }}>Taking you to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", padding: 24 }}>
      <div style={{ paddingTop: 60, textAlign: "center" }}>
        {/* Icon */}
        <div style={{
          width: 72,
          height: 72,
          background: "rgba(255,186,8,0.12)",
          border: "2px solid rgba(255,186,8,0.3)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: 28,
        }}>
          📧
        </div>

        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 8 }}>Verify Your Email</h1>
        <p style={{ color: "rgba(240,244,255,0.55)", fontSize: "0.9rem", marginBottom: 8 }}>
          We sent a 6-digit code to
        </p>
        <p style={{ color: "#ffba08", fontWeight: 600, marginBottom: 40 }}>
          {email || "your email"}
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 24, textAlign: "left" }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* OTP Boxes */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 32 }}>
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              ref={el => { refs.current[i] = el; }}
              className="otp-box"
              type="tel"
              maxLength={1}
              value={digit}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              inputMode="numeric"
            />
          ))}
        </div>

        <button
          id="verify-btn"
          className="btn-primary"
          onClick={handleVerify}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Verifying..." : "✅ Verify OTP"}
        </button>

        <div style={{ marginTop: 24, fontSize: "0.88rem", color: "rgba(240,244,255,0.5)" }}>
          {timer > 0 ? (
            <p>Resend in {timer}s</p>
          ) : (
            <p>
              Didn't receive it?{" "}
              <button
                id="resend-btn"
                onClick={resendOtp}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ffba08",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.88rem",
                  padding: 0,
                }}
              >
                Resend OTP
              </button>
            </p>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <p style={{ color: "rgba(240,244,255,0.4)", fontSize: "0.82rem" }}>
            💡 Check your spam folder if you don't see the email
          </p>
        </div>

        {/* Already verified link */}
        <div style={{ marginTop: 32 }}>
          <button
            onClick={() => router.push("/login")}
            style={{
              background: "none",
              border: "none",
              color: "rgba(240,244,255,0.5)",
              fontSize: "0.88rem",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Already verified? Login
          </button>
        </div>
      </div>
    </main>
  );
}
