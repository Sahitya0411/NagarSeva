"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getStatusLabel } from "@/lib/utils";
import { Users, FileText, AlertTriangle, CheckCircle, Shield, Send, RefreshCw } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    resolvedToday: 0,
    fraudFlagged: 0,
    activeUsers: 0,
  });
  const [fraudQueue, setFraudQueue] = useState<Record<string, unknown>[]>([]);
  const [allComplaints, setAllComplaints] = useState<Record<string, unknown>[]>([]);
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "fraud" | "users" | "complaints">("overview");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      // Check admin
      const { data: adminData } = await supabase.from("admin_users").select("id").eq("id", session.user.id).single();
      if (!adminData) { router.replace("/dashboard"); return; }

      // Load stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalRes, resolvedRes, fraudRes, usersRes] = await Promise.all([
        supabase.from("complaints").select("*", { count: "exact", head: true }),
        supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "resolved").gte("resolved_at", today.toISOString()),
        supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "fraud"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("account_status", "active"),
      ]);

      setStats({
        total: totalRes.count || 0,
        resolvedToday: resolvedRes.count || 0,
        fraudFlagged: fraudRes.count || 0,
        activeUsers: usersRes.count || 0,
      });

      // Fraud queue
      const { data: fraud } = await supabase
        .from("complaints")
        .select("*, profiles!citizen_id(full_name, email, account_status)")
        .eq("fraud_flag", true)
        .order("created_at", { ascending: false })
        .limit(10);
      setFraudQueue((fraud || []) as Record<string, unknown>[]);

      // All recent complaints
      const { data: comps } = await supabase
        .from("complaints")
        .select("*, profiles!citizen_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(20);
      setAllComplaints((comps || []) as Record<string, unknown>[]);

      // Users
      const { data: usrList } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setUsers((usrList || []) as Record<string, unknown>[]);

      setLoading(false);
    };
    load();
  }, []);

  async function markFraud(complaintId: string, reason: string) {
    await fetch("/api/complaint/flag-fraud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaintId, reason }),
    });
    setFraudQueue(q => q.filter(c => c.id !== complaintId));
  }

  async function markGenuine(complaintId: string) {
    await supabase
      .from("complaints")
      .update({ fraud_flag: false, status: "ai_verified" })
      .eq("id", complaintId);
    setFraudQueue(q => q.filter(c => c.id !== complaintId));
  }

  async function handleBroadcast() {
    if (!broadcastMsg.trim()) return;
    setBroadcasting(true);
    await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: broadcastMsg }),
    });
    setBroadcastMsg("");
    setBroadcasting(false);
    alert("Broadcast sent!");
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="spinner" />
    </div>
  );

  const TABS = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "fraud", label: "Fraud Queue", icon: "🚩" },
    { key: "complaints", label: "Complaints", icon: "📋" },
    { key: "users", label: "Users", icon: "👥" },
  ];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", minHeight: "100vh", paddingBottom: 40 }}>
      {/* Admin Header */}
      <div
        style={{
          background: "rgba(5,13,26,0.95)",
          borderBottom: "1px solid rgba(255,186,8,0.2)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 40,
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "1.4rem" }}>🏙️</span>
          <div>
            <p style={{ fontSize: "0.7rem", color: "rgba(240,244,255,0.4)", margin: 0 }}>NagarSeva</p>
            <p style={{ fontWeight: 700, color: "#ffba08", margin: 0 }}>Admin Dashboard</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              background: "rgba(255,186,8,0.15)",
              border: "1px solid rgba(255,186,8,0.3)",
              color: "#ffba08",
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: "0.78rem",
              fontWeight: 700,
            }}
          >
            🛡️ SUPER ADMIN
          </span>
        </div>
      </div>

      <div style={{ padding: "24px" }}>
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            overflowX: "auto",
            background: "rgba(255,255,255,0.04)",
            padding: 4,
            borderRadius: 12,
          }}
        >
          {TABS.map(tab => (
            <button
              key={tab.key}
              id={`admin-tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              style={{
                flex: "1 0 auto",
                padding: "10px 16px",
                borderRadius: 10,
                border: "none",
                background: activeTab === tab.key ? "rgba(255,186,8,0.2)" : "transparent",
                color: activeTab === tab.key ? "#ffba08" : "rgba(240,244,255,0.5)",
                fontWeight: activeTab === tab.key ? 700 : 500,
                cursor: "pointer",
                fontSize: "0.88rem",
                fontFamily: "DM Sans, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              {tab.icon} {tab.label}
              {tab.key === "fraud" && stats.fraudFlagged > 0 && (
                <span style={{
                  background: "#fb7185",
                  color: "white",
                  borderRadius: 100,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  padding: "1px 7px",
                }}>
                  {stats.fraudFlagged}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 24 }}>
              {[
                { icon: <FileText size={20} />, label: "Total Complaints", value: stats.total, color: "#38bdf8" },
                { icon: <CheckCircle size={20} />, label: "Resolved Today", value: stats.resolvedToday, color: "#34d399" },
                { icon: <AlertTriangle size={20} />, label: "Fraud Flagged", value: stats.fraudFlagged, color: "#fb7185" },
                { icon: <Users size={20} />, label: "Active Users", value: stats.activeUsers, color: "#a78bfa" },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <div style={{ color: s.color, marginBottom: 10, opacity: 0.8 }}>{s.icon}</div>
                  <p style={{ fontSize: "2rem", fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</p>
                  <p style={{ fontSize: "0.78rem", color: "rgba(240,244,255,0.45)" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Broadcast */}
            <div
              style={{
                background: "rgba(15,32,64,0.6)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: 20,
              }}
            >
              <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 12 }}>
                📢 Broadcast Notification
              </p>
              <textarea
                id="broadcast-msg"
                className="input-field"
                placeholder="Type a notification to send to all citizens..."
                value={broadcastMsg}
                onChange={e => setBroadcastMsg(e.target.value)}
                style={{ minHeight: 80, marginBottom: 12 }}
              />
              <button
                id="send-broadcast-btn"
                className="btn-primary"
                onClick={handleBroadcast}
                disabled={broadcasting}
                style={{ opacity: broadcasting ? 0.7 : 1 }}
              >
                <Send size={16} />
                {broadcasting ? "Sending..." : "Send to All Users"}
              </button>
            </div>
          </div>
        )}

        {/* Fraud Queue Tab */}
        {activeTab === "fraud" && (
          <div>
            {fraudQueue.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px" }}>
                <CheckCircle size={48} color="#34d399" style={{ margin: "0 auto 16px" }} />
                <p style={{ color: "rgba(240,244,255,0.5)" }}>No fraud items to review</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {fraudQueue.map((c) => {
                  const profile = c.profiles as Record<string, unknown> | undefined;
                  return (
                    <div
                      key={c.id as string}
                      style={{
                        background: "rgba(251,113,133,0.06)",
                        border: "1px solid rgba(251,113,133,0.2)",
                        borderRadius: 14,
                        padding: 18,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <div>
                          <p style={{ fontWeight: 700, margin: 0 }}>#{c.complaint_number as string}</p>
                          <p style={{ color: "rgba(240,244,255,0.5)", fontSize: "0.82rem", margin: 0 }}>
                            By: {profile?.full_name as string} · {c.issue_type as string}
                          </p>
                        </div>
                        <span style={{
                          fontSize: "0.75rem",
                          color: "rgba(240,244,255,0.4)",
                        }}>
                          {formatDate(c.created_at as string)}
                        </span>
                      </div>

                      {c.fraud_reason != null && (
                        <div className="alert alert-error" style={{ marginBottom: 12 }}>
                          <AlertTriangle size={12} />
                          <span>{c.fraud_reason as string}</span>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={() => markGenuine(c.id as string)}
                          style={{
                            flex: 1,
                            background: "rgba(52,211,153,0.15)",
                            border: "1px solid rgba(52,211,153,0.3)",
                            borderRadius: 10,
                            padding: "10px",
                            color: "#34d399",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontFamily: "DM Sans, sans-serif",
                          }}
                        >
                          ✅ Mark Genuine
                        </button>
                        <button
                          onClick={() => markFraud(c.id as string, "Confirmed fraud by admin")}
                          style={{
                            flex: 1,
                            background: "rgba(251,113,133,0.15)",
                            border: "1px solid rgba(251,113,133,0.3)",
                            borderRadius: 10,
                            padding: "10px",
                            color: "#fb7185",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontFamily: "DM Sans, sans-serif",
                          }}
                        >
                          🚫 Fraud + Warn User
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* All Complaints Tab */}
        {activeTab === "complaints" && (
          <div style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
              <thead>
                <tr>
                  {["#", "Citizen", "Issue", "Severity", "Status", "Date"].map(h => (
                    <th key={h} style={{ textAlign: "left", fontSize: "0.72rem", color: "rgba(240,244,255,0.4)", padding: "0 12px 8px", fontWeight: 600, letterSpacing: "0.05em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allComplaints.map((c) => {
                  const prof = c.profiles as Record<string, unknown> | undefined;
                  return (
                    <tr
                      key={c.id as string}
                      style={{ cursor: "pointer" }}
                      onClick={() => router.push(`/complaint/${c.id}`)}
                    >
                      {[
                        c.complaint_number as string,
                        prof?.full_name as string || "—",
                        c.issue_type as string,
                        c.severity as string,
                        getStatusLabel(c.status as string),
                        formatDate(c.created_at as string),
                      ].map((cell, i) => (
                        <td
                          key={i}
                          style={{
                            padding: "12px",
                            background: "rgba(15,32,64,0.5)",
                            fontSize: "0.85rem",
                            borderRadius: i === 0 ? "10px 0 0 10px" : i === 5 ? "0 10px 10px 0" : "0",
                          }}
                        >
                          {i === 3 ? (
                            <span className={`badge badge-${String(cell).toLowerCase()}`}>{cell}</span>
                          ) : i === 4 ? (
                            <span className={`badge badge-${c.status as string}`}>{cell}</span>
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {users.map((u) => (
              <div
                key={u.id as string}
                style={{
                  background: "rgba(15,32,64,0.5)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #ffba08, #f7941d)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    color: "#050d1a",
                    fontSize: "0.88rem",
                    flexShrink: 0,
                  }}
                >
                  {String(u.full_name as string || "?").slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.92rem", margin: 0 }}>{u.full_name as string}</p>
                  <p style={{ color: "rgba(240,244,255,0.45)", fontSize: "0.78rem", margin: 0 }}>
                    {u.email as string} · {u.city as string}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: "#ffba08", fontSize: "0.82rem", fontWeight: 600 }}>
                    🪙 {u.city_coins as number}
                  </span>
                  <span
                    className={`badge ${u.account_status === "active" ? "badge-resolved" : u.account_status === "warned" ? "badge-under_review" : "badge-fraud"}`}
                  >
                    {u.account_status as string}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
