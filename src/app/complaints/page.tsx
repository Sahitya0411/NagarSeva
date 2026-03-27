"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Complaint } from "@/types";
import { getStatusLabel, getIssueTypeIcon, formatDate } from "@/lib/utils";
import { ChevronRight, Search } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";

type Filter = "all" | "pending" | "resolved" | "fraud";

export default function ComplaintsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      const { data } = await supabase
        .from("complaints")
        .select("*")
        .eq("citizen_id", session.user.id)
        .order("created_at", { ascending: false });

      setComplaints(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = complaints.filter(c => {
    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && ["submitted", "ai_verified", "routed", "under_review"].includes(c.status)) ||
      (filter === "resolved" && c.status === "resolved") ||
      (filter === "fraud" && c.status === "fraud");

    const matchesSearch =
      !search ||
      c.complaint_number.toLowerCase().includes(search.toLowerCase()) ||
      c.issue_type.toLowerCase().includes(search.toLowerCase()) ||
      (c.location_address || "").toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "resolved", label: "Resolved" },
    { key: "fraud", label: "Fraud" },
  ];

  return (
    <main className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 style={{ fontSize: "1.1rem", fontWeight: 700 }}>My Complaints</h1>
        <span
          style={{
            background: "rgba(255,186,8,0.15)",
            color: "#ffba08",
            borderRadius: 100,
            padding: "3px 10px",
            fontSize: "0.78rem",
            fontWeight: 700,
          }}
        >
          {complaints.length}
        </span>
      </div>

      <div style={{ padding: "16px 20px", paddingBottom: 0 }}>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(240,244,255,0.4)" }} />
          <input
            id="complaint-search"
            className="input-field"
            style={{ paddingLeft: 42 }}
            placeholder="Search by ID, type, location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              id={`filter-${f.key}`}
              onClick={() => setFilter(f.key)}
              className={`chip ${filter === f.key ? "active" : ""}`}
              style={{ whiteSpace: "nowrap", fontFamily: "DM Sans, sans-serif" }}
            >
              {f.label}
              {f.key !== "all" && (
                <span style={{
                  fontSize: "0.72rem",
                  background: filter === f.key ? "rgba(255,186,8,0.2)" : "rgba(255,255,255,0.1)",
                  borderRadius: 100,
                  padding: "1px 6px",
                  marginLeft: 2,
                }}>
                  {complaints.filter(c =>
                    f.key === "pending" ? ["submitted", "ai_verified", "routed", "under_review"].includes(c.status)
                    : c.status === f.key
                  ).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ fontSize: "2rem", marginBottom: 12 }}>📋</p>
          <p style={{ color: "rgba(240,244,255,0.5)" }}>No complaints found</p>
          {filter === "all" && !search && (
            <Link href="/complaint/new">
              <button
                style={{
                  marginTop: 16,
                  background: "rgba(255,186,8,0.12)",
                  border: "1px solid rgba(255,186,8,0.3)",
                  borderRadius: 10,
                  padding: "10px 20px",
                  color: "#ffba08",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                Raise Your First Complaint
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div style={{ padding: "0 20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(c => (
              <Link key={c.id} href={`/complaint/${c.id}`} className="complaint-card">
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.3rem",
                      flexShrink: 0,
                    }}
                  >
                    {getIssueTypeIcon(c.issue_type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <p style={{ fontWeight: 700, fontSize: "0.92rem", margin: 0 }}>{c.issue_type}</p>
                      <ChevronRight size={16} color="rgba(240,244,255,0.3)" />
                    </div>
                    <p style={{ color: "rgba(240,244,255,0.4)", fontSize: "0.78rem", margin: "0 0 8px" }}>
                      #{c.complaint_number} · {formatDate(c.created_at)}
                    </p>
                    {c.location_address && (
                      <p style={{ color: "rgba(240,244,255,0.45)", fontSize: "0.78rem", margin: "0 0 8px" }}>
                        📍 {c.location_address.slice(0, 40)}...
                      </p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className={`badge badge-${c.status}`}>{getStatusLabel(c.status)}</span>
                      <span className={`badge badge-${c.severity?.toLowerCase()}`}>{c.severity}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
