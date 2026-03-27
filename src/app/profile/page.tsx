"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import { getInitials } from "@/lib/utils";
import BottomNav from "@/components/layout/BottomNav";
import { LogOut, ChevronRight, Shield, Bell, Globe, HelpCircle, FileText, ChevronLeft } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0, fraud: 0 });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState({ email: true, push: true });

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      setProfile(prof);

      const { data: comps } = await supabase
        .from("complaints")
        .select("status")
        .eq("citizen_id", session.user.id);

      if (comps) {
        setStats({
          total: comps.length,
          resolved: comps.filter(c => c.status === "resolved").length,
          pending: comps.filter(c => ["submitted", "ai_verified", "routed", "under_review"].includes(c.status)).length,
          fraud: comps.filter(c => c.status === "fraud").length,
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="spinner" />
    </div>
  );

  if (!profile) return null;

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
        <h1 style={{ fontSize: "1.1rem", fontWeight: 700 }}>My Profile</h1>
      </div>

      <div style={{ padding: 20 }}>
        {/* Profile hero */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "24px 20px",
            background: "linear-gradient(135deg, rgba(30,63,122,0.5), rgba(15,32,64,0.8))",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              background: "linear-gradient(135deg, #ffba08, #f7941d)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem",
              fontWeight: 700,
              color: "#050d1a",
              marginBottom: 14,
              boxShadow: "0 4px 20px rgba(255,186,8,0.3)",
            }}
          >
            {getInitials(profile.full_name)}
          </div>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 4 }}>{profile.full_name}</h2>
          <p style={{ color: "rgba(240,244,255,0.5)", fontSize: "0.85rem", marginBottom: 8 }}>{profile.email}</p>
          <p style={{ color: "rgba(240,244,255,0.5)", fontSize: "0.82rem", marginBottom: 12 }}>
            📍 {profile.city}, {profile.state}
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <span
              style={{
                background: profile.account_status === "active"
                  ? "rgba(52,211,153,0.15)"
                  : profile.account_status === "warned"
                  ? "rgba(251,191,36,0.15)"
                  : "rgba(251,113,133,0.15)",
                border: `1px solid ${profile.account_status === "active" ? "rgba(52,211,153,0.3)" : profile.account_status === "warned" ? "rgba(251,191,36,0.3)" : "rgba(251,113,133,0.3)"}`,
                color: profile.account_status === "active" ? "#34d399" : profile.account_status === "warned" ? "#fbbf24" : "#fb7185",
                borderRadius: 100,
                padding: "4px 12px",
                fontSize: "0.78rem",
                fontWeight: 600,
              }}
            >
              {profile.account_status === "active" ? "✅ Active Account" : profile.account_status === "warned" ? "⚠️ Account Warned" : "🚫 Account Disabled"}
            </span>
            <span
              style={{
                background: "rgba(255,186,8,0.12)",
                border: "1px solid rgba(255,186,8,0.25)",
                color: "#ffba08",
                borderRadius: 100,
                padding: "4px 12px",
                fontSize: "0.78rem",
                fontWeight: 600,
              }}
            >
              🪙 {profile.city_coins} CityCoins
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Total", value: stats.total, color: "#f0f4ff" },
            { label: "Resolved", value: stats.resolved, color: "#34d399" },
            { label: "Pending", value: stats.pending, color: "#fbbf24" },
            { label: "Fraud", value: stats.fraud, color: "#fb7185" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <p style={{ fontSize: "1.4rem", fontWeight: 800, color: s.color, marginBottom: 2 }}>{s.value}</p>
              <p style={{ fontSize: "0.7rem", color: "rgba(240,244,255,0.45)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Settings sections */}
        {[
          {
            title: "PREFERENCES",
            items: [
              {
                icon: <Globe size={18} />,
                label: "Language",
                value: profile.language_preference.toUpperCase(),
                action: null,
              },
            ],
          },
          {
            title: "NOTIFICATIONS",
            items: [
              {
                icon: <Bell size={18} />,
                label: "Email Alerts",
                value: null,
                toggle: true,
                checked: notifications.email,
                onToggle: () => setNotifications(n => ({ ...n, email: !n.email })),
              },
              {
                icon: <Bell size={18} />,
                label: "Push Notifications",
                value: null,
                toggle: true,
                checked: notifications.push,
                onToggle: () => setNotifications(n => ({ ...n, push: !n.push })),
              },
            ],
          },
          {
            title: "HELP & LEGAL",
            items: [
              { icon: <HelpCircle size={18} />, label: "Help & Support", value: null, action: () => {} },
              { icon: <FileText size={18} />, label: "Terms & Privacy Policy", value: null, action: () => {} },
              { icon: <Shield size={18} />, label: "Data Privacy", value: null, action: () => {} },
            ],
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: 20 }}>
            <p className="section-title">{section.title}</p>
            <div
              style={{
                background: "rgba(15,32,64,0.5)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              {section.items.map((item, i) => (
                <div
                  key={i}
                  onClick={"action" in item && item.action ? () => item.action?.() : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "15px 16px",
                    borderBottom: i < section.items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    cursor: "action" in item && item.action ? "pointer" : "default",
                  }}
                >
                  <span style={{ color: "rgba(240,244,255,0.5)" }}>{item.icon}</span>
                  <span style={{ flex: 1, fontSize: "0.92rem" }}>{item.label}</span>
                  {"toggle" in item && item.toggle ? (
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={item.onToggle}
                      />
                      <span className="toggle-slider" />
                    </label>
                  ) : "value" in item && item.value ? (
                    <span style={{ color: "#ffba08", fontSize: "0.82rem", fontWeight: 600 }}>{item.value}</span>
                  ) : (
                    "action" in item && item.action && <ChevronRight size={16} color="rgba(240,244,255,0.3)" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <button
          id="logout-btn"
          className="btn-danger"
          onClick={handleLogout}
          style={{ marginTop: 8 }}
        >
          <LogOut size={18} />
          Logout
        </button>

        <p style={{ textAlign: "center", color: "rgba(240,244,255,0.25)", fontSize: "0.75rem", marginTop: 20 }}>
          NagarSeva v1.0 · आपकी आवाज़, आपका शहर
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
