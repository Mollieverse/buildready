"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getDeviceId } from "@/lib/deviceId";
import BottomNav from "@/components/BottomNav";

const C = {
  bg: "#0A0A0A", card: "#111111", border: "#1E1E1E",
  text: "#FFFFFF", muted: "#A1A1AA", dim: "#52525B",
  blue: "#3B82F6", green: "#22C55E", orange: "#F59E0B", red: "#EF4444",
};

const rankColors: Record<string, string> = {
  Beginner: C.red, Explorer: C.orange, Builder: C.orange,
  Architect: C.blue, "Prompt Master": C.green,
};

export default function History() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const deviceId = getDeviceId();
      const { data } = await supabase
        .from("analyses")
        .select("*")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false })
        .limit(100);
      setHistory(data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (selected) {
    const r = selected.full_result;
    return (
      <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 20px", paddingBottom: 90 }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <button
            onClick={() => setSelected(null)}
            style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, padding: "8px 16px", borderRadius: 8, fontSize: 13, marginBottom: 20, cursor: "pointer" }}
          >
            ← Back to History
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{r.title}</h1>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: (rankColors[r.rank] || C.blue) + "18", color: rankColors[r.rank] || C.blue }}>{r.rank}</span>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <div style={{ fontSize: 40, fontWeight: 800, textAlign: "center" }}>{r.overallScore}<span style={{ fontSize: 16, color: C.dim }}>/100</span></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {r.categories?.map((cat: any) => (
              <div key={cat.name} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14 }}>{cat.name}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{cat.score}/10</span>
              </div>
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 90 }}>
      <div style={{ padding: "40px 20px", maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>History</h1>
        <p style={{ color: C.muted, fontSize: 15, marginBottom: 28 }}>All your previous prompt analyses.</p>

        {loading && (
          <div style={{ color: C.muted, fontSize: 14, textAlign: "center", padding: 40 }}>Loading…</div>
        )}

        {!loading && history.length === 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 16, color: C.dim }}>◎</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>No analyses yet</div>
            <div style={{ color: C.muted, fontSize: 14 }}>Inspect your first prompt to see it here.</div>
          </div>
        )}

        {!loading && history.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, cursor: "pointer", textAlign: "left", width: "100%" }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ color: C.dim, fontSize: 12 }}>
                    {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontWeight: 800, fontSize: 18, color: item.overall_score >= 70 ? C.green : item.overall_score >= 50 ? C.blue : C.orange }}>
                    {item.overall_score}/100
                  </span>
                  <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: (rankColors[item.rank] || C.blue) + "18", color: rankColors[item.rank] || C.blue }}>
                    {item.rank}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
