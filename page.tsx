"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getDeviceId } from "@/lib/deviceId";
import BottomNav from "@/components/BottomNav";

const C = {
  bg: "#0A0A0A", card: "#111111", border: "#1E1E1E",
  text: "#FFFFFF", muted: "#A1A1AA", dim: "#52525B",
  blue: "#3B82F6", green: "#22C55E", orange: "#F59E0B", red: "#EF4444",
};

export default function Dashboard() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const deviceId = getDeviceId();
      const { data } = await supabase
        .from("analyses")
        .select("*")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false })
        .limit(50);
      setHistory(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const avgScore = history.length
    ? Math.round(history.reduce((a, h) => a + h.overall_score, 0) / history.length)
    : null;
  const readyCount = history.filter((h) => h.ready_to_build).length;
  const recent = history.slice(0, 3);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 90 }}>
      <div style={{ padding: "40px 20px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 6 }}>Dashboard</h1>
          <p style={{ color: C.muted, fontSize: 15 }}>Welcome back. Inspect prompts, track improvements, ship better products.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12, marginBottom: 28 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ color: C.dim, fontSize: 22, marginBottom: 10 }}>◎</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 4 }}>
              {loading ? "…" : history.length}
            </div>
            <div style={{ color: C.muted, fontSize: 13 }}>Total Analyses</div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ color: C.dim, fontSize: 22, marginBottom: 10 }}>⊕</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 4 }}>
              {loading ? "…" : avgScore !== null ? `${avgScore}/100` : "—"}
            </div>
            <div style={{ color: C.muted, fontSize: 13 }}>Avg Score</div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ color: C.dim, fontSize: 22, marginBottom: 10 }}>◆</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 4 }}>
              {loading ? "…" : readyCount}
            </div>
            <div style={{ color: C.muted, fontSize: 13 }}>Ready to Build</div>
          </div>
        </div>

        <div style={{ background: C.blue + "0A", border: `1px solid ${C.blue}30`, borderRadius: 12, padding: 28, marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Ready to inspect a prompt?</div>
              <div style={{ color: C.muted, fontSize: 14 }}>Paste any AI build prompt and get a full readiness report.</div>
            </div>
            <Link href="/inspect" style={{ padding: "10px 20px", borderRadius: 8, background: C.blue, color: "#fff", fontWeight: 600, fontSize: 14, textDecoration: "none", whiteSpace: "nowrap" }}>
              Inspect Prompt →
            </Link>
          </div>
        </div>

        {!loading && recent.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Recent Analyses</div>
              <Link href="/history" style={{ fontSize: 13, color: C.blue, textDecoration: "none" }}>View all →</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recent.map((item) => (
                <div key={item.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{item.title}</div>
                    <div style={{ color: C.dim, fontSize: 12 }}>{new Date(item.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontWeight: 700, color: item.overall_score >= 70 ? C.green : item.overall_score >= 50 ? C.blue : C.orange }}>
                      {item.overall_score}/100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && history.length === 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 12, color: C.dim }}>◎</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No analyses yet</div>
            <div style={{ color: C.muted, fontSize: 14 }}>Inspect your first prompt to see it here.</div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
