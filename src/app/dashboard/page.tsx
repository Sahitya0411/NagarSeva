"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Complaint } from "@/types";
import { getStatusLabel, getIssueTypeIcon, formatDate, coinsToRupees, getInitials } from "@/lib/utils";
import { Bell, ChevronRight, AlertCircle } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityStats, setCityStats] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      // Load profile — maybeSingle() returns null instead of 406 when no row exists
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      // If no profile row yet (e.g. OAuth sign-up before registration was completed)
      if (!prof) {
        router.replace("/register");
        return;
      }
      setProfile(prof);

      // Load complaints
      const { data: comps } = await supabase
        .from("complaints")
        .select("*")
        .eq("citizen_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      setComplaints(comps || []);

      // City feed stats
      if (prof?.city) {
        const { count } = await supabase
          .from("complaints")
          .select("*", { count: "exact", head: true })
          .eq("city", prof.city)
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        setCityStats(count || 0);
      }

      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "rgba(240,244,255,0.5)", fontSize: "0.88rem" }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const coinsToNextRedemption = Math.max(0, 1000 - profile.city_coins);
  const redemptionProgress = Math.min(100, (profile.city_coins / 1000) * 100);

  return (
    <main className="page-container">
      {/* Header */}
      <div
        style={{
          padding: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          background: "rgba(5,13,26,0.92)",
          backdropFilter: "blur(12px)",
          zIndex: 40,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "1.4rem" }}>🏙️</span>
          <div>
            <p style={{ fontSize: "0.7rem", color: "rgba(240,244,255,0.45)", margin: 0 }}>NagarSeva</p>
            <p style={{ fontSize: "0.88rem", fontWeight: 600, margin: 0, color: "#ffba08" }}>{profile.city}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            id="notifications-btn"
            style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#f0f4ff" }}
          >
            <Bell size={18} />
          </button>
          <Link href="/profile">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "linear-gradient(135deg, #ffba08, #f7941d)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#050d1a",
                cursor: "pointer",
              }}
            >
              {profile.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt="Profile"
                  style={{ width: "100%", height: "100%", borderRadius: 12, objectFit: "cover" }}
                />
              ) : (
                getInitials(profile.full_name)
              )}
            </div>
          </Link>
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        {/* Account status warning */}
        {profile.account_status === "warned" && (
          <div className="alert alert-warning" style={{ marginBottom: 16 }}>
            <AlertCircle size={16} />
            <span>Your account has received a warning. Continued misuse may lead to suspension.</span>
          </div>
        )}
        {profile.account_status === "disabled" && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <AlertCircle size={16} />
            <span>Your account has been disabled. Contact support to appeal.</span>
          </div>
        )}

        {/* Greeting */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 2 }}>
            नमस्ते, {profile.full_name.split(" ")[0]}! 👋
          </h1>
          <p style={{ color: "rgba(240,244,255,0.5)", fontSize: "0.88rem" }}>
            Ready to make your city better?
          </p>
        </div>

        {/* CityCoins Card */}
        <div className="coin-card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: "0.75rem", color: "rgba(240,244,255,0.5)", marginBottom: 2 }}>
                YOUR CITYCOINS
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ffba08" }} className="coin-icon">
                  🪙 {profile.city_coins}
                </span>
                <span style={{ color: "rgba(240,244,255,0.5)", fontSize: "0.88rem" }}>
                  = {coinsToRupees(profile.city_coins)}
                </span>
              </div>
            </div>
            <Link href="/wallet">
              <button
                style={{
                  background: "rgba(255,186,8,0.2)",
                  border: "1px solid rgba(255,186,8,0.4)",
                  borderRadius: 10,
                  padding: "8px 14px",
                  color: "#ffba08",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Wallet →
              </button>
            </Link>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${redemptionProgress}%` }} />
          </div>
          <p style={{ fontSize: "0.75rem", color: "rgba(240,244,255,0.45)", marginTop: 8 }}>
            {coinsToNextRedemption > 0
              ? `${coinsToNextRedemption} more coins to redeem ₹10`
              : "🎉 You can redeem your coins!"}
          </p>
        </div>

        {/* CTA */}
        <Link href="/complaint/new" id="raise-complaint-btn">
          <button
            className="btn-primary"
            style={{ marginBottom: 24, fontSize: "1.05rem", padding: "16px 28px" }}
          >
            📢 Raise New Complaint
          </button>
        </Link>

        {/* My Recent Complaints */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p className="section-title" style={{ marginBottom: 0 }}>MY RECENT COMPLAINTS</p>
            <Link
              href="/complaints"
              style={{ color: "#ffba08", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}
            >
              View All
            </Link>
          </div>

          {complaints.length === 0 ? (
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                background: "rgba(255,255,255,0.03)",
                border: "1px dashed rgba(255,255,255,0.1)",
                borderRadius: 16,
              }}
            >
              <p style={{ fontSize: "2rem", marginBottom: 12 }}>📋</p>
              <p style={{ color: "rgba(240,244,255,0.5)", fontSize: "0.9rem", marginBottom: 16 }}>
                No complaints yet. Be the change!
              </p>
              <Link href="/complaint/new">
                <button
                  style={{
                    background: "rgba(255,186,8,0.12)",
                    border: "1px solid rgba(255,186,8,0.3)",
                    borderRadius: 10,
                    padding: "10px 20px",
                    color: "#ffba08",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Raise Your First Complaint
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {complaints.map((c) => (
                <Link key={c.id} href={`/complaint/${c.id}`} className="complaint-card">
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                      <span style={{ fontSize: "1.2rem" }}>{getIssueTypeIcon(c.issue_type)}</span>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: "0.92rem", margin: 0 }}>{c.issue_type}</p>
                        <p style={{ color: "rgba(240,244,255,0.45)", fontSize: "0.78rem", margin: 0 }}>
                          #{c.complaint_number} · {formatDate(c.created_at)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} color="rgba(240,244,255,0.3)" />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className={`badge badge-${c.status}`}>{getStatusLabel(c.status)}</span>
                    {c.dept_name && (
                      <p style={{ color: "rgba(240,244,255,0.4)", fontSize: "0.75rem", margin: 0 }}>
                        {c.dept_name.slice(0, 25)}...
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* City Feed */}
        <div
          style={{
            background: "rgba(14,165,233,0.08)",
            border: "1px solid rgba(14,165,233,0.2)",
            borderRadius: 16,
            padding: "16px",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: "1.4rem" }}>🗺️</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.92rem", marginBottom: 4 }}>City Feed — {profile.city}</p>
              <p style={{ color: "rgba(240,244,255,0.55)", fontSize: "0.85rem" }}>
                <span style={{ color: "#38bdf8", fontWeight: 700 }}>{cityStats}</span> complaints reported in your city this week.
                Your voice matters! 💪
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
