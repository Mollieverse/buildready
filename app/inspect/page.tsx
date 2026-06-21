"use client";

import { useState, useEffect } from "react";

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
          // ignore malformed SSE chunk, keep reading
        }
      }
    }

    if (streamError) {
      throw new Error(streamError);
    }
    if (!fullText.trim()) {
      throw new Error("Empty response from model.");
    }
    return JSON.parse(fullText); // guaranteed valid JSON via output_config.format schema enforcement
  }

  async function analyze() {
    setLoading(true);
    setError(null);
    setDetailFailed(false);
    try {
      // Stage 1: quick score — fast, shows immediately
      const quick = await streamRequest({ prompt, stage: "quick" });
      setResult({ ...quick, categories: quick.categoryScores }); // show scores right away
      setLoading(false);

      // Stage 2: full detail — runs after, fills in the rest. If it fails or
      // times out, the person still has a complete, usable score report from
      // stage 1, so this never blocks or breaks the core experience.
      setLoadingDetail(true);
      try {
        const detail = await streamRequest({
          prompt,
          stage: "full",
          categoryScores: quick.categoryScores,
        });
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
          return merged;
        });
      } catch (detailErr) {
        setDetailFailed(true);
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
      <div style={{ minHeight: "100vh", background: C.bg, padding: "40px 20px" }}>
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
              Running full 11-category analysis — this can take 20-40 seconds.
            </div>
          )}

          {error && (
            <div style={{ marginTop: 20, padding: 16, background: C.red + "10", border: `1px solid ${C.red}30`, borderRadius: 8, color: C.red, fontSize: 14 }}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  const rankColor = rankColors[result.rank] || C.blue;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 20px" }}>
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
            Detailed breakdown couldn't load this time, but your scores above are complete and accurate. Try analyzing again for the full report.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginBottom: 24 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.dim, marginBottom: 20, textTransform: "uppercase" }}>Build Readiness</div>
            <div style={{ fontSize: 48, fontWeight: 800, color: scoreColor(result.overallScore / 10), textAlign: "center", marginBottom: 24 }}>
              {result.overallScore}<span style={{ fontSize: 20, color: C.dim }}>/100</span>
            </div>
            <div style={{ fontSize: 12, color: C.dim, marginBottom: 12, textTransform: "uppercase" }}>AI Compatibility</div>
            {!result.aiCompatibility ? (
              <div style={{ color: C.dim, fontSize: 13 }}>Loading…</div>
            ) : Object.entries(result.aiCompatibility).map(([ai, val]: any) => (
              <div key={ai} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, textTransform: "capitalize" }}>{ai}</span>
                  <span style={{ fontSize: 13, color: scoreColor(val / 10) }}>{val}%</span>
                </div>
                <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${val}%`, background: scoreColor(val / 10), borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.dim, marginBottom: 20, textTransform: "uppercase" }}>Score Breakdown</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {result.categories.map((cat: any) => (
                <div key={cat.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13 }}>{cat.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: scoreColor(cat.score) }}>{cat.score}/10</span>
                  </div>
                  <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${cat.score * 10}%`, background: scoreColor(cat.score), borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.dim, marginBottom: 20, textTransform: "uppercase" }}>Missing Requirements</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {!result.missingRequirements ? (
                <div style={{ color: C.dim, fontSize: 13 }}>Loading…</div>
              ) : result.missingRequirements.length === 0 ? (
                <div style={{ color: C.green, fontSize: 14 }}>✓ No critical requirements missing</div>
              ) : result.missingRequirements.map((req: any) => (
                <div key={req.title} style={{ background: C.orange + "0D", border: `1px solid ${C.orange}25`, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: C.orange }}>{req.title}</div>
                  {req.items.map((item: string) => (
                    <div key={item} style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>· {item}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
          {[["breakdown", "Category Details"], ["simulation", "AI Simulation"], ["improved", "Improved Prompt"]].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{ padding: "12px 20px", background: "none", border: "none", borderBottom: `2px solid ${activeTab === id ? C.blue : "transparent"}`, color: activeTab === id ? C.text : C.muted, fontSize: 14, fontWeight: activeTab === id ? 600 : 400, cursor: "pointer" }}>{label}</button>
          ))}
        </div>

        {activeTab === "breakdown" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
            {result.categories.map((cat: any) => (
              <div key={cat.name} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{cat.name}</div>
                  <span style={{ fontWeight: 800, fontSize: 20, color: scoreColor(cat.score) }}>{cat.score}</span>
                </div>
                {cat.strengths?.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.green, marginBottom: 6 }}>STRENGTHS</div>
                    {cat.strengths.map((s: string) => <div key={s} style={{ fontSize: 12, color: C.muted, marginBottom: 3 }}>{s}</div>)}
                  </div>
                )}
                {cat.weaknesses?.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.red, marginBottom: 6 }}>WEAKNESSES</div>
                    {cat.weaknesses.map((s: string) => <div key={s} style={{ fontSize: 12, color: C.muted, marginBottom: 3 }}>{s}</div>)}
                  </div>
                )}
                {cat.recommendations?.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.blue, marginBottom: 6 }}>RECOMMENDATIONS</div>
                    {cat.recommendations.map((s: string) => <div key={s} style={{ fontSize: 12, color: C.muted, marginBottom: 3 }}>{s}</div>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "simulation" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {[
              { label: "Will Build Correctly", color: C.green, items: result.simulation?.willBuildCorrectly || [] },
              { label: "Potential Misunderstandings", color: C.orange, items: result.simulation?.potentialMisunderstandings || [] },
              { label: "Missing Assumptions", color: C.blue, items: result.simulation?.missingAssumptions || [] },
              { label: "Implementation Risks", color: C.red, items: result.simulation?.implementationRisks || [] },
            ].map(({ label, color, items }) => (
              <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color, marginBottom: 14 }}>{label}</div>
                {items.map((item: string, i: number) => (
                  <div key={i} style={{ fontSize: 13, color: C.muted, marginBottom: 8, paddingLeft: 10, borderLeft: `2px solid ${color}40` }}>{item}</div>
                ))}
              </div>
            ))}
          </div>
        )}

        {activeTab === "improved" && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.dim }}>improved-prompt.txt</span>
              <button onClick={copyImproved} disabled={!result.improvedPrompt} style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: result.improvedPrompt ? "pointer" : "not-allowed", opacity: result.improvedPrompt ? 1 : 0.5 }}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <pre style={{ padding: 24, fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace" }}>
              {result.improvedPrompt || (loadingDetail ? "Generating improved prompt…" : "Not available.")}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
                     }
