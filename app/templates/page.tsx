"use client";

import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

const C = {
  bg: "#0A0A0A", card: "#111111", border: "#1E1E1E",
  text: "#FFFFFF", muted: "#A1A1AA", dim: "#52525B", blue: "#3B82F6",
};

const TEMPLATES: Record<string, string> = {
  SaaS: "Build a B2B SaaS project management tool with team workspaces, task boards, time tracking, and invoicing. Support multi-tenancy with role-based access (admin, manager, member). Integrate Stripe for subscription billing with Free, Pro, and Enterprise tiers.",
  Marketplace: "Build a two-sided marketplace for freelance designers and clients. Include profile creation, portfolio uploads, project posting, proposal submission, escrow payments via Stripe, and a review system. Support real-time messaging between parties.",
  "Dating App": "Build a dating app for professionals aged 25–40 with compatibility scoring based on career goals and values. Include swipe interface, match system, in-app messaging, and premium subscription for unlimited likes and read receipts.",
  "Social Network": "Build a professional social network for indie hackers and solopreneurs. Include posts, follows, project showcases, upvoting, commenting, and a weekly digest email. Support Twitter-style threading and markdown in posts.",
  "E-commerce": "Build a multi-vendor e-commerce platform where sellers can list physical products, manage inventory, and process orders. Include product search with filters, cart, Stripe checkout, order tracking, and a seller dashboard with analytics.",
  "AI Tool": "Build an AI writing assistant for content marketers. Users can generate blog posts, social captions, and email sequences from a brief. Include a template library, tone selector, history, and team sharing. Integrate Claude for generation.",
  "Mobile App": "Build a habit tracking mobile app with daily streaks, custom reminders, progress charts, and social accountability partners. Include a gamification system with badges and weekly challenges. Support offline mode with local SQLite.",
  "Productivity App": "Build a personal knowledge base and note-taking app like Notion but focused on developers. Support markdown, code blocks with syntax highlighting, bi-directional links, and a graph view of connected notes. Include CLI integration.",
  "Gaming App": "Build a browser-based multiplayer trivia game with real-time rooms, custom question packs, a leaderboard, and spectator mode. Support up to 50 players per room with WebSocket communication and a host control panel.",
};

export default function Templates() {
  const router = useRouter();

  function useTemplate(content: string) {
    sessionStorage.setItem("buildready_template", content);
    router.push("/inspect");
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 90 }}>
      <div style={{ padding: "40px 20px", maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>Templates</h1>
        <p style={{ color: C.muted, fontSize: 15, marginBottom: 28 }}>Start with a proven prompt template and customize it for your build.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
          {Object.entries(TEMPLATES).map(([name, content]) => (
            <div key={name} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{name}</div>
              <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{content.slice(0, 90)}…</div>
              <button
                onClick={() => useTemplate(content)}
                style={{ background: "none", border: "none", color: C.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}
              >
                Use template →
              </button>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
