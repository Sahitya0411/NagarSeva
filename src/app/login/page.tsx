"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Mail, Lock, ChevronLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  async function handleLogin() {
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true);
    setError("");

    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) throw authErr;

      // Check if admin
      const { data: adminData } = await supabase.from("admin_users").select("id").eq("id", (await supabase.auth.getUser()).data.user?.id).single();
      if (adminData) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) { setError("Enter your email address first"); return; }
    setLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetErr) throw resetErr;
      setResetSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          onClick={() => router.push("/")}
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
        <h1 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Welcome Back</h1>
      </div>

      <div style={{ padding: 24 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            fontSize: 48,
            marginBottom: 12,
          }}>🏙️</div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 4 }}>
            Login to <span style={{ color: "#ffba08" }}>NagarSeva</span>
          </h2>
          <p style={{ color: "rgba(240,244,255,0.5)", fontSize: "0.88rem" }}>
            आपकी आवाज़, आपका शहर
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {resetSent && (
          <div className="alert alert-success" style={{ marginBottom: 20 }}>
            <span>✅</span>
            <span>Password reset link sent to {email}</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(240,244,255,0.4)" }} />
              <input
                id="login-email"
                type="email"
                className="input-field"
                style={{ paddingLeft: 42 }}
                placeholder="your@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(240,244,255,0.4)" }} />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="input-field"
                style={{ paddingLeft: 42, paddingRight: 48 }}
                placeholder="Your password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(240,244,255,0.4)", padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: "right", marginTop: -8 }}>
            <button
              id="forgot-password-btn"
              onClick={handleForgotPassword}
              style={{
                background: "none", border: "none", color: "#ffba08",
                fontSize: "0.85rem", cursor: "pointer", padding: 0,
              }}
            >
              Forgot password?
            </button>
          </div>

          <button
            id="login-btn"
            className="btn-primary"
            onClick={handleLogin}
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, marginTop: 8 }}
          >
            {loading ? "Logging in..." : "🔐 Login"}
          </button>

          <div className="divider" />

          <p style={{ textAlign: "center", color: "rgba(240,244,255,0.5)", fontSize: "0.88rem" }}>
            New to NagarSeva?{" "}
            <a
              href="/register"
              style={{ color: "#ffba08", fontWeight: 600, textDecoration: "none" }}
            >
              Create Account
            </a>
          </p>
        </div>

        {/* Features */}
        <div
          style={{
            marginTop: 40,
            padding: "16px",
            background: "rgba(255,186,8,0.05)",
            border: "1px solid rgba(255,186,8,0.1)",
            borderRadius: 12,
          }}
        >
          <p style={{ fontSize: "0.8rem", color: "rgba(240,244,255,0.5)", textAlign: "center" }}>
            🔒 Secured by Supabase Auth · Your data is safe and private
          </p>
        </div>
      </div>
    </main>
  );
}
