"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CoinTransaction } from "@/types";
import { coinsToRupees, formatDate } from "@/lib/utils";
import BottomNav from "@/components/layout/BottomNav";
import { ChevronLeft } from "lucide-react";

export default function WalletPage() {
  const router = useRouter();
  const supabase = createClient();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [redeemAmount, setRedeemAmount] = useState(10);
  const [redeemMsg, setRedeemMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      const res = await fetch("/api/wallet/balance");
      const data = await res.json();
      setBalance(data.balance || 0);
      setTransactions(data.transactions || []);
      setLoading(false);
    };
    load();
  }, []);

  async function handleRedeem() {
    if (!upiId.trim()) { setRedeemMsg("Please enter your UPI ID"); return; }
    if (redeemAmount < 10) { setRedeemMsg("Minimum ₹10"); return; }
    if (balance < redeemAmount * 100) { setRedeemMsg("Insufficient balance"); return; }

    setRedeeming(true);
    setRedeemMsg("");
    const res = await fetch("/api/wallet/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ upiId, amount: redeemAmount }),
    });
    const data = await res.json();
    if (data.success) {
      setRedeemMsg("✅ " + data.message);
      setBalance(b => b - redeemAmount * 100);
    } else {
      setRedeemMsg("❌ " + (data.error || "Redemption failed"));
    }
    setRedeeming(false);
  }

  const redemptionProgress = Math.min(100, (balance / 1000) * 100);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

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
        <h1 style={{ fontSize: "1.1rem", fontWeight: 700 }}>CityCoins Wallet</h1>
      </div>

      <div style={{ padding: "20px" }}>
        {/* Balance card */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(247,148,29,0.25), rgba(255,186,8,0.12))",
            border: "2px solid rgba(255,186,8,0.3)",
            borderRadius: 24,
            padding: "28px 24px",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <p style={{ fontSize: "0.8rem", color: "rgba(240,244,255,0.5)", marginBottom: 8 }}>YOUR BALANCE</p>
          <div style={{ fontSize: "3.5rem", fontWeight: 900, color: "#ffba08", marginBottom: 4 }}>
            🪙 {balance}
          </div>
          <p style={{ color: "rgba(240,244,255,0.55)", fontSize: "1.1rem", fontWeight: 600 }}>
            = {coinsToRupees(balance)}
          </p>

          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: "0.75rem", color: "rgba(240,244,255,0.4)" }}>
                Progress to ₹10 redemption
              </span>
              <span style={{ fontSize: "0.75rem", color: "#ffba08" }}>
                {balance} / 1000
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${redemptionProgress}%` }} />
            </div>
            {balance < 1000 && (
              <p style={{ fontSize: "0.75rem", color: "rgba(240,244,255,0.35)", marginTop: 6 }}>
                Need {1000 - balance} more coins to redeem ₹10
              </p>
            )}
          </div>
        </div>

        {/* How to earn */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <p className="section-title">HOW TO EARN CITYCOINS</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { icon: "✅", text: "Complaint resolved → +100 coins" },
              { icon: "🚫", text: "Fraudulent complaint → 0 coins" },
              { icon: "⏰", text: "Coins expire after 365 days of inactivity" },
              { icon: "♻️", text: "Duplicate complaints earn 0 coins" },
            ].map((rule, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span>{rule.icon}</span>
                <span style={{ fontSize: "0.82rem", color: "rgba(240,244,255,0.55)" }}>{rule.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Redeem section */}
        {balance >= 1000 && (
          <div
            style={{
              background: "rgba(52,211,153,0.08)",
              border: "1px solid rgba(52,211,153,0.2)",
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <p className="section-title" style={{ color: "#34d399" }}>REDEEM COINS</p>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Amount (₹)</label>
              <input
                id="redeem-amount"
                type="number"
                className="input-field"
                min={10}
                max={Math.floor(balance / 100)}
                value={redeemAmount}
                onChange={e => setRedeemAmount(Number(e.target.value))}
              />
              <p style={{ fontSize: "0.75rem", color: "rgba(240,244,255,0.35)", marginTop: 4 }}>
                = {redeemAmount * 100} CityCoins required
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">UPI ID</label>
              <input
                id="upi-id"
                className="input-field"
                placeholder="yourname@upi"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
              />
            </div>

            {redeemMsg && (
              <div
                className={`alert ${redeemMsg.startsWith("✅") ? "alert-success" : "alert-error"}`}
                style={{ marginBottom: 12 }}
              >
                <span>{redeemMsg}</span>
              </div>
            )}

            <button
              id="redeem-btn"
              className="btn-primary"
              onClick={handleRedeem}
              disabled={redeeming}
              style={{ background: "linear-gradient(135deg, #34d399, #10b981)", opacity: redeeming ? 0.7 : 1 }}
            >
              {redeeming ? "Processing..." : `💸 Redeem ₹${redeemAmount} via UPI`}
            </button>
          </div>
        )}

        {/* Donate option */}
        <div
          style={{
            background: "rgba(56,189,248,0.06)",
            border: "1px solid rgba(56,189,248,0.15)",
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <p style={{ fontWeight: 600, fontSize: "0.92rem", marginBottom: 4 }}>
            🌍 Donate to City Development Fund
          </p>
          <p style={{ color: "rgba(240,244,255,0.5)", fontSize: "0.82rem", marginBottom: 12 }}>
            Use your coins to contribute directly to local city development projects.
          </p>
          <button
            style={{
              background: "rgba(56,189,248,0.12)",
              border: "1px solid rgba(56,189,248,0.3)",
              borderRadius: 10,
              padding: "10px 16px",
              color: "#38bdf8",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.85rem",
            }}
          >
            🏗️ Donate Coins
          </button>
        </div>

        {/* Transaction history */}
        <div>
          <p className="section-title">TRANSACTION HISTORY</p>
          {transactions.length === 0 ? (
            <p style={{ color: "rgba(240,244,255,0.35)", fontSize: "0.85rem", textAlign: "center", padding: "24px 0" }}>
              No transactions yet
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {transactions.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background:
                          t.type === "earned"
                            ? "rgba(52,211,153,0.15)"
                            : t.type === "redeemed"
                            ? "rgba(56,189,248,0.15)"
                            : "rgba(251,113,133,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1rem",
                      }}
                    >
                      {t.type === "earned" ? "🪙" : t.type === "redeemed" ? "💸" : "❌"}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.85rem", fontWeight: 500, margin: 0 }}>{t.description}</p>
                      <p style={{ fontSize: "0.75rem", color: "rgba(240,244,255,0.4)", margin: 0 }}>
                        {formatDate(t.created_at)}
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color:
                        t.type === "earned"
                          ? "#34d399"
                          : t.type === "redeemed"
                          ? "#38bdf8"
                          : "#fb7185",
                    }}
                  >
                    {t.type === "earned" ? "+" : "-"}{t.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
