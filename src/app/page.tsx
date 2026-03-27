"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LANGUAGES } from "@/types";
import { createClient } from "@/lib/supabase/client";

export default function LanguageSelector() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard");
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  const handleSelect = (code: string) => {
    setSelected(code);
    localStorage.setItem("ns_lang", code);
    setTimeout(() => {
      router.push("/register");
    }, 300);
  };

  if (checking) {
    return (
      <div className="page-container hero-bg flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <main className="page-container hero-bg" style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh" }}>
      <div style={{ padding: "60px 24px 40px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              width: 80,
              height: 80,
              background: "linear-gradient(135deg, #ffba08, #f7941d)",
              borderRadius: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 36,
              boxShadow: "0 8px 32px rgba(247,148,29,0.4)",
            }}
          >
            🏙️
          </div>
          <h1
            style={{
              fontSize: "2.2rem",
              fontWeight: 700,
              background: "linear-gradient(135deg, #ffba08, #f7941d)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: 6,
            }}
          >
            NagarSeva
          </h1>
          <p style={{ color: "rgba(240,244,255,0.6)", fontSize: "1rem" }}>नगरसेवा</p>
          <p
            style={{
              marginTop: 8,
              color: "rgba(240,244,255,0.5)",
              fontSize: "0.9rem",
              fontStyle: "italic",
            }}
          >
            आपकी आवाज़, आपका शहर
          </p>
          <p style={{ color: "rgba(240,244,255,0.35)", fontSize: "0.78rem", marginTop: 4 }}>
            Your Voice, Your City
          </p>
        </div>

        {/* Language selection */}
        <div
          style={{
            background: "rgba(15,32,64,0.5)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: "24px 20px",
            marginBottom: 24,
          }}
        >
          <p
            style={{
              textAlign: "center",
              color: "rgba(240,244,255,0.6)",
              fontSize: "0.88rem",
              marginBottom: 20,
              fontWeight: 500,
            }}
          >
            Choose your language / अपनी भाषा चुनें
          </p>
          <div className="lang-grid">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                className={`lang-btn ${selected === lang.code ? "selected" : ""}`}
                onClick={() => handleSelect(lang.code)}
                id={`lang-${lang.code}`}
              >
                <span className="script">{lang.script}</span>
                <span style={{ fontSize: "0.88rem" }}>{lang.nativeName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Features preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { icon: "📷", text: "Photo + Voice + Text complaints" },
            { icon: "🤖", text: "AI-powered department routing" },
            { icon: "🪙", text: "Earn CityCoins on resolution" },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span style={{ fontSize: "1.3rem" }}>{f.icon}</span>
              <span style={{ fontSize: "0.88rem", color: "rgba(240,244,255,0.65)" }}>
                {f.text}
              </span>
            </div>
          ))}
        </div>

        {/* Login link */}
        <p
          style={{
            textAlign: "center",
            marginTop: 32,
            color: "rgba(240,244,255,0.4)",
            fontSize: "0.88rem",
          }}
        >
          Already have an account?{" "}
          <a
            href="/login"
            style={{ color: "#ffba08", fontWeight: 600, textDecoration: "none" }}
          >
            Login
          </a>
        </p>
      </div>
    </main>
  );
}
