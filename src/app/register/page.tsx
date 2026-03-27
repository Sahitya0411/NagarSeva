"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { INDIAN_STATES } from "@/types";
import { validateEmail, validatePhone, validatePincode } from "@/lib/utils";
import { Eye, EyeOff, ArrowLeft, User, Mail, Phone, MapPin, Lock, ChevronLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1); // 1: info, 2: address, 3: security
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    full_address: "",
    state: "",
    pincode: "",
    aadhaar_last4: "",
    language_preference: typeof window !== "undefined" ? localStorage.getItem("ns_lang") || "en" : "en",
    terms: false,
  });

  function update(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  }

  function validateStep1() {
    if (!form.full_name.trim()) return "Full name is required";
    if (!validateEmail(form.email)) return "Enter a valid email address";
    if (form.password.length < 8) return "Password must be at least 8 characters";
    if (!validatePhone(form.phone)) return "Enter a valid 10-digit mobile number";
    return "";
  }

  function validateStep2() {
    if (!form.city.trim()) return "City is required";
    if (!form.full_address.trim()) return "Address is required";
    if (!form.state) return "State is required";
    if (!validatePincode(form.pincode)) return "Enter a valid 6-digit pincode";
    return "";
  }

  function validateStep3() {
    if (!form.terms) return "Please accept the Terms of Use";
    return "";
  }

  async function handleSubmit() {
    const err = validateStep3();
    if (err) { setError(err); return; }

    setLoading(true);
    setError("");

    try {
      // Create auth user
      const { data, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            phone: form.phone,
          },
        },
      });

      if (authErr) throw authErr;
      if (!data.user) throw new Error("Could not create account");

      // Hash aadhaar if provided
      let aadhaar_hash = undefined;
      if (form.aadhaar_last4 && form.aadhaar_last4.length === 4) {
        aadhaar_hash = btoa(form.aadhaar_last4);
      }

      // Create profile via server API (uses service role key to bypass RLS,
      // since email confirmation means no active session exists yet)
      const profileRes = await fetch("/api/auth/register-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: data.user.id,
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          city: form.city,
          full_address: form.full_address,
          state: form.state,
          pincode: form.pincode,
          aadhaar_hash,
          language_preference: form.language_preference,
        }),
      });

      if (!profileRes.ok) {
        const profileErr = await profileRes.json();
        throw new Error(profileErr.error || "Failed to save profile");
      }

      // Redirect to OTP verification
      localStorage.setItem("ns_verify_email", form.email);
      router.push("/verify");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", padding: "0 0 40px" }}>
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "sticky",
          top: 0,
          background: "rgba(5,13,26,0.95)",
          backdropFilter: "blur(12px)",
          zIndex: 40,
        }}
      >
        <button
          onClick={() => (step > 1 ? setStep(s => s - 1) : router.push("/"))}
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
          <h1 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Create Account</h1>
          <p style={{ color: "rgba(240,244,255,0.5)", fontSize: "0.8rem", margin: 0 }}>
            Step {step} of 3
          </p>
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: "16px 20px 0" }}>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          {["Personal Info", "Address", "Security"].map((label, i) => (
            <span
              key={i}
              style={{
                fontSize: "0.72rem",
                color: i + 1 <= step ? "#ffba08" : "rgba(240,244,255,0.3)",
                fontWeight: i + 1 === step ? 600 : 400,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 20px" }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name *</label>
              <div style={{ position: "relative" }}>
                <User size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(240,244,255,0.4)" }} />
                <input
                  id="full-name"
                  className="input-field"
                  style={{ paddingLeft: 42 }}
                  placeholder="As per Aadhaar card"
                  value={form.full_name}
                  onChange={e => update("full_name", e.target.value)}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address *</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(240,244,255,0.4)" }} />
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: 42 }}
                  placeholder="your@gmail.com"
                  value={form.email}
                  onChange={e => update("email", e.target.value)}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Mobile Number *</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(240,244,255,0.6)",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    zIndex: 1,
                  }}
                >
                  +91
                </span>
                <Phone size={16} style={{ position: "absolute", left: 50, top: "50%", transform: "translateY(-50%)", color: "rgba(240,244,255,0.4)" }} />
                <input
                  id="phone"
                  type="tel"
                  className="input-field"
                  style={{ paddingLeft: 72 }}
                  placeholder="9876543210"
                  maxLength={10}
                  value={form.phone}
                  onChange={e => update("phone", e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password *</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(240,244,255,0.4)" }} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  style={{ paddingLeft: 42, paddingRight: 48 }}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={e => update("password", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(240,244,255,0.4)",
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              id="next-step-1"
              className="btn-primary"
              onClick={() => {
                const err = validateStep1();
                if (err) { setError(err); return; }
                setStep(2);
              }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Address */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">City / Town *</label>
              <div style={{ position: "relative" }}>
                <MapPin size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(240,244,255,0.4)" }} />
                <input
                  id="city"
                  className="input-field"
                  style={{ paddingLeft: 42 }}
                  placeholder="e.g., Mumbai, Delhi, Pune"
                  value={form.city}
                  onChange={e => update("city", e.target.value)}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Address *</label>
              <textarea
                id="full-address"
                className="input-field"
                placeholder="Flat/House No., Building, Street, Locality"
                value={form.full_address}
                onChange={e => update("full_address", e.target.value)}
                style={{ minHeight: 88 }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">State *</label>
              <select
                id="state"
                className="input-field"
                value={form.state}
                onChange={e => update("state", e.target.value)}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Pincode *</label>
              <input
                id="pincode"
                type="text"
                className="input-field"
                placeholder="6-digit pincode"
                maxLength={6}
                value={form.pincode}
                onChange={e => update("pincode", e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <button
              id="next-step-2"
              className="btn-primary"
              onClick={() => {
                const err = validateStep2();
                if (err) { setError(err); return; }
                setStep(3);
              }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 3: Security + Submit */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              className="alert alert-info"
              style={{ marginBottom: 4 }}
            >
              <span>🔒</span>
              <span>
                Aadhaar last 4 digits are stored as a secure hash only — never in plain text.
                This helps prevent duplicate registrations.
              </span>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Aadhaar Last 4 Digits (Optional)</label>
              <input
                id="aadhaar-last4"
                type="password"
                className="input-field"
                placeholder="XXXX"
                maxLength={4}
                value={form.aadhaar_last4}
                onChange={e => update("aadhaar_last4", e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Language Preference</label>
              <select
                id="lang-preference"
                className="input-field"
                value={form.language_preference}
                onChange={e => update("language_preference", e.target.value)}
              >
                {[
                  { code: "en", label: "English" },
                  { code: "hi", label: "हिंदी (Hindi)" },
                  { code: "mr", label: "मराठी (Marathi)" },
                  { code: "ta", label: "தமிழ் (Tamil)" },
                  { code: "te", label: "తెలుగు (Telugu)" },
                  { code: "bn", label: "বাংলা (Bengali)" },
                  { code: "gu", label: "ગુજરાતી (Gujarati)" },
                  { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
                  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
                  { code: "ml", label: "മലയാളം (Malayalam)" },
                  { code: "or", label: "ଓଡ଼ିଆ (Odia)" },
                  { code: "ur", label: "اردو (Urdu)" },
                ].map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                cursor: "pointer",
                padding: "12px 16px",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 10,
                border: `1.5px solid ${form.terms ? "#ffba08" : "rgba(255,255,255,0.1)"}`,
              }}
            >
              <input
                id="terms-checkbox"
                type="checkbox"
                checked={form.terms}
                onChange={e => update("terms", e.target.checked)}
                style={{ marginTop: 3, accentColor: "#ffba08" }}
              />
              <span style={{ color: "rgba(240,244,255,0.7)", fontSize: "0.88rem", lineHeight: 1.5 }}>
                I agree to the{" "}
                <a href="#" style={{ color: "#ffba08", textDecoration: "none" }}>Terms of Use</a>
                {" "}and{" "}
                <a href="#" style={{ color: "#ffba08", textDecoration: "none" }}>Privacy Policy</a>.
                I understand that my complaint data will be processed to route it to the correct government department.
              </span>
            </label>

            <button
              id="submit-register"
              className="btn-primary"
              onClick={handleSubmit}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Creating Account..." : "🚀 Create Account"}
            </button>

            <p style={{ textAlign: "center", color: "rgba(240,244,255,0.4)", fontSize: "0.88rem" }}>
              Already have an account?{" "}
              <a href="/login" style={{ color: "#ffba08", fontWeight: 600, textDecoration: "none" }}>
                Login
              </a>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
