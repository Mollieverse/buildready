"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getDeviceId } from "@/lib/deviceId";
import BottomNav from "@/components/BottomNav";

const C = {
  bg: "#0A0A0A", card: "#111111", border: "#1E1E1E",
  text: "#FFFFFF", muted: "#A1A1AA", dim: "#52525B",
  blue: "#3B82F6", green: "#22C55E", orange: "#F59E0B", red: "#EF4444",
};

function scoreColor(s: number) {
  if (s >= 8) return C.green;
  if (s >= 6) return C.blue;
  if (s >= 4) return C.orange;
  return C.red;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

const rankColors: Record<string, string> = {
  Beginner: C.red, Explorer: C.orange, Builder: C.orange,
  Architect: C.blue, "Prompt Master": C.green,
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailFailed, setDetailFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("breakdown");
  const [copied, setCopied] = useState(false);
  const MAX = 3000;

  useEffect(() => {
    const template = sessionStorage.getItem("buildready_template");
    if (template) {
      setPrompt(template);
      sessionStorage.removeItem("buildready_template");
    }
  }, []);

  async function streamRequest(body: any): Promise<any> {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Request failed with status ${res.status}`);
    }

    if (!res.body) {
      throw new Error("No response stream from server.");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";
    let streamError: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (!payload) continue;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.error) {
            streamError = parsed.error;
          } else if (parsed.delta) {
            fullText += parsed.delta;
          }
        } catch {
          // ignore malformed SSE chunk
        }
      }
    }

    if (streamError) throw new Error(streamError);
    if (!fullText.trim()) throw new Error("Empty response from model.");
    return JSON.parse(fullText);
  }

  async function saveAnalysis(finalResult: any) {
    try {
      const deviceId = getDeviceId();
      await supabase.from("analyses").insert({
        device_id: deviceId,
        prompt,
        title: finalResult.title,
        overall_score: finalResult.overallScore,
        rank: finalResult.rank,
        ready_to_build: finalResult.readyToBuild,
        full_result: finalResult,
      });
    } catch {
      // best-effort, never block the UI
    }
  }

  async function analyze() {
    setLoading(true);
    setError(null);
    setDetailFailed(false);
    try {
      const quick = await streamRequest({ prompt, stage: "quick" });
      setResult({ ...quick, categories: quick.categoryScores });
      setLoading(false);

      setLoadingDetail(true);
      try {
        const detail = await streamRequest({
          prompt,
          stage: "full",
          categoryScores: quick.categoryScores,
        });
        let finalResult: any;
        setResult((prev: any) => {
          const merged = { ...prev };
          const detailedByName = new Map(
            detail.detailedCategories.map((c: any) => [c.name, c])
          );
          merged.categories = prev.categoryScores.map((c: any) =>
            detailedByName.get(c.name) || { ...c, strengths: [], weaknesses: [], recommendations: [] }
          );
          merged.missingRequirements = detail.missingRequirements;
          merged.aiCompatibility = detail.aiCompatibility;
          merged.simulation = detail.simulation;
          merged.improvedPrompt = detail.improvedPrompt;
          finalResult = merged;
          return merged;
        });
        saveAnalysis(finalResult);
      } catch {
        setDetailFailed(true);
        saveAnalysis(quick);
      }
      setLoadingDetail(false);
    } catch (e: any) {
      setError(e.message || "Analysis failed. Please try again.");
      setLoading(false);
    }
  }

  function copyImproved() {
    if (!result?.improvedPrompt) return;
    navigator.clipboard.writeText(result.improvedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!result) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, padding: "40px 20px", paddingBottom: 110 }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit" }}>
                <div style={{ width: 28, height: 28, background: C.blue, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>B</div>
                <span style={{ fontWeight: 700, fontSize: 16 }}>BuildReady</span>
              </a>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>Prompt Inspector</h1>
            <p style={{ color: C.muted, fontSize: 15 }}>Paste your software build prompt and get a detailed readiness report.</p>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, MAX))}
              placeholder="Describe the application, startup, game, SaaS, marketplace, or product you want AI to build..."
              style={{ width: "100%", minHeight: 280, background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 15, lineHeight: 1.7, resize: "none" }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
              <span style={{ color: prompt.length > MAX * 0.9 ? C.orange : C.dim, fontSize: 13 }}>{prompt.length}/{MAX}</span>
              <button
                onClick={analyze}
                disabled={loading || prompt.trim().length < 30}
                style={{ padding: "10px 20px", borderRadius: 8, background: C.blue, color: "#fff", border: "none", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading || prompt.trim().length < 30 ? 0.5 : 1 }}
              >
                {loading ? "Analyzing…" : "Analyze Prompt →"}
              </button>
            </div>
          </div>

          {loading && (
            <div style={{ marginTop: 24, textAlign: "center", color: C.muted, fontSize: 14 }}>
              <div style={{ width: 36, height: 36, margin: "0 auto 12px", border: `3px solid ${C.border}`, borderTop: `3px solid ${C.blue}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              Running 11-category analysis — this can take 20-40 seconds.
            </div>
          )}

          {error && (
            <div style={{ marginTop: 20, padding: 16, background: C.red + "10", border: `1px solid ${C.red}30`, borderRadius: 8, color: C.red, fontSize: 14 }}>
              {error}
            </div>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  const rankColor = rankColors[result.rank] || C.blue;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 20px", paddingBottom: 110 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ color: C.dim, fontSize: 13, marginBottom: 6 }}>Analysis Report</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{result.title}</h1>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: rankColor + "18", color: rankColor, border: `1px solid ${rankColor}30` }}>{result.rank}</span>
              <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: (result.readyToBuild ? C.green : C.orange) + "18", color: result.readyToBuild ? C.green : C.orange, border: `1px solid ${(result.readyToBuild ? C.green : C.orange)}30` }}>
                {result.readyToBuild ? "Ready to Build" : "Needs Work"}
              </span>
            </div>
          </div>
          <button onClick={() => { setResult(null); setPrompt(""); setDetailFailed(false); }} style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>← New Analysis</button>
        </div>

        {loadingDetail && (
          <div style={{ marginBottom: 20, padding: "10px 16px", background: C.blue + "0D", border: `1px solid ${C.blue}25`, borderRadius: 8, color: C.blue, fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 14, height: 14, border: `2px solid ${C.blue}40`, borderTop: `2px solid ${C.blue}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            Loading detailed breakdown for your weakest areas…
          </div>
        )}

        {detailFailed && (
          <div style={{ marginBottom: 20, padding: "10px 16px", background: C.orange + "0D", border: `1px solid ${C.orange}25`, borderRadius: 8, color: C.orange, fontSize: 13 }}>
            Detailed breakdown timed out, but your scores are complete. Try analyzing again for the full report.
          </div>
