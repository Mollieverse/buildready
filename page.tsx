"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getDeviceId } from "@/lib/deviceId";
import BottomNav from "@/components/BottomNav";

const C = {
  bg: "#0A0A0A", card: "#111111", border: "#1E1E1E",
  text: "#FFFFFF", muted: "#A1A1AA", red: "#EF4444",
};

export default function Settings() {
  const [provider] = useState("claude");
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  async function clearHistory() {
    if (!confirm("Permanently delete all your saved analyses? This can't be undone.")) return;
    setClearing(true);
    const deviceId = getDeviceId();
    await supabase.from("analyses").delete().eq("device_id", deviceId);
    setClearing(false);
    setCleared(true);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 90 }}>
      <div style={{ padding: "40px 20px", maxWidth: 600, margin: "0 auto" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>Settings</h1>
        <p style={{ color: C.muted, fontSize: 15, marginBottom: 28 }}>Configure your BuildReady workspace.</p>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>AI Provider</div>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 12 }}>Primary model for prompt analysis.</div>
          <div style={{ background: "#1E1E1E", borderRadius: 6, padding: "8px 12px", fontSize: 13, display: "inline-block" }}>
            Claude (Anthropic)
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>History Storage</div>
          <div style={{ color: C.muted, fontSize: 13 }}>
            Your analyses are saved privately to this device. No account or login required.
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.red}30`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: C.red }}>Clear History</div>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 12 }}>
            Permanently delete all saved analyses from this device.
          </div>
          <button
            onClick={clearHistory}
            disabled={clearing}
            style={{ background: "none", border: `1px solid ${C.red}40`, color: C.red, padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: clearing ? "not-allowed" : "pointer", opacity: clearing ? 0.6 : 1 }}
          >
            {clearing ? "Clearing…" : cleared ? "Cleared ✓" : "Clear All Data"}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
