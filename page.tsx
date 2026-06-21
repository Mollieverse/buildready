import Link from "next/link";

const C = {
  bg: "#0A0A0A", card: "#111111", border: "#1E1E1E",
  text: "#FFFFFF", muted: "#A1A1AA", dim: "#52525B",
  blue: "#3B82F6", green: "#22C55E", orange: "#F59E0B", red: "#EF4444",
};

const features = [
  { icon: "⚡", title: "Prompt Intelligence", desc: "11-dimension framework scores every aspect of your build prompt instantly." },
  { icon: "◎", title: "Build Readiness Score", desc: "Get a 0–100 score and a rank from Beginner to Prompt Master." },
  { icon: "⊗", title: "Missing Requirements", desc: "Detect gaps in user roles, data models, security, and edge cases before you build." },
  { icon: "◈", title: "AI Compatibility", desc: "See how Claude, Gemini, Codex, and Cursor will interpret your prompt differently." },
  { icon: "⊞", title: "Prompt Simulation", desc: "Preview exactly what AI will build, misunderstand, and skip over." },
  { icon: "◆", title: "Improved Prompt", desc: "Receive a fast, focused rewrite targeting your prompt's biggest gaps." },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: C.bg + "EE", backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: C.blue, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>B</div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>BuildReady</span>
        </div>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, background: C.blue, color: "#fff", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
          Get Started →
        </Link>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "100px 24px 70px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: C.blue + "15", border: `1px solid ${C.blue}30`, color: C.blue, fontSize: 12, fontWeight: 600, marginBottom: 32, letterSpacing: "0.04em" }}>
          ◆ AI-POWERED PROMPT ANALYSIS
        </div>
        <h1 style={{ fontSize: "clamp(36px,8vw,72px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: 24, color: C.text }}>
          Stop Wasting AI Credits<br />
          <span style={{ color: C.blue }}>On Bad Prompts</span>
        </h1>
        <p style={{ fontSize: "clamp(16px,2vw,20px)", color: C.muted, maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.6 }}>
          Analyze, score, and improve software build prompts before sending them to Claude, Gemini, Cursor, or any AI coding tool.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/inspect" style={{ display: "inline-flex", alignItems: "center", padding: "14px 28px", fontSize: 16, borderRadius: 10, background: C.blue, color: "#fff", fontWeight: 600, textDecoration: "none" }}>
            Inspect My Prompt →
          </Link>
        </div>
        <div style={{ marginTop: 24, display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
          {["11 Score Dimensions", "AI Compatibility Check", "Fast Prompt Rewrite"].map((t) => (
            <span key={t} style={{ color: C.dim, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: C.green }}>✓</span> {t}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 100px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 1, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          {features.map((f) => (
            <div key={f.title} style={{ padding: 28, background: C.card, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 22, marginBottom: 12, color: C.blue }}>{f.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 15 }}>{f.title}</div>
              <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
