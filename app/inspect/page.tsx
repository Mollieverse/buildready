"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getDeviceId } from "@/lib/deviceId";
import { TEMPLATES } from "@/lib/templates";
import { useAnalyzeStream, type Provider } from "@/lib/useAnalyzeStream";
import BottomNav from "@/components/BottomNav";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge, RankBadge } from "@/components/ui/Badge";
import { Score } from "@/components/ui/Score";
import { Bar } from "@/components/ui/Bar";
import { Section } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";

type CategoryScore = { name: string; score: number };

type QuickResult = {
  title: string;
  overallScore: number;
  rank: string;
  readyToBuild: boolean;
  categoryScores: CategoryScore[];
};

type FullResult = {
  detailedCategories: {
    name: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }[];
  missingRequirements: { title: string; items: string[] }[];
  aiCompatibility: {
    claude: number;
    gemini: number;
    codex: number;
    cursor: number;
  };
  simulation: {
    willBuildCorrectly: string[];
    potentialMisunderstandings: string[];
    missingAssumptions: string[];
    implementationRisks: string[];
  };
  improvedPrompt: string;
};

type State = {
  step: 1 | 2 | 3 | 4;
  prompt: string;
  quick: QuickResult | null;
  full: FullResult | null;
  quickProvider: Provider | null;
  fullProvider: Provider | null;
};

type Action =
  | { type: "SET_PROMPT"; value: string }
  | { type: "GO"; step: 1 | 2 | 3 | 4 }
  | { type: "SET_QUICK"; quick: QuickResult; provider: Provider | null }
  | { type: "SET_FULL"; full: FullResult; provider: Provider | null }
  | { type: "RESET" };

const initial: State = {
  step: 1,
  prompt: "",
  quick: null,
  full: null,
  quickProvider: null,
  fullProvider: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_PROMPT":
      return { ...state, prompt: action.value };
    case "GO":
      return { ...state, step: action.step };
    case "SET_QUICK":
      return { ...state, quick: action.quick, quickProvider: action.provider };
    case "SET_FULL":
      return { ...state, full: action.full, fullProvider: action.provider };
    case "RESET":
      return { ...initial, prompt: state.prompt };
  }
}

const STEPS = ["Compose", "Quick Score", "Deep Analysis", "Improved Prompt"];

export default function InspectPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initial);

  // Hydrate template choice if user came from /templates.
  useEffect(() => {
    const stash = sessionStorage.getItem("buildready_template");
    if (stash) {
      dispatch({ type: "SET_PROMPT", value: stash });
      sessionStorage.removeItem("buildready_template");
    }
  }, []);

  return (
    <div className="min-h-screen bg-bg pb-24">
      <TopBar step={state.step} />

      <main className="max-w-3xl mx-auto px-5 pt-8">
        {state.step === 1 && (
          <Step1
            prompt={state.prompt}
            setPrompt={(v) => dispatch({ type: "SET_PROMPT", value: v })}
            onNext={() => dispatch({ type: "GO", step: 2 })}
          />
        )}
        {state.step === 2 && (
          <Step2
            prompt={state.prompt}
            onQuick={(q, p) => dispatch({ type: "SET_QUICK", quick: q, provider: p })}
            onBack={() => dispatch({ type: "GO", step: 1 })}
            onNext={() => dispatch({ type: "GO", step: 3 })}
            quick={state.quick}
            provider={state.quickProvider}
          />
        )}
        {state.step === 3 && state.quick && (
          <Step3
            prompt={state.prompt}
            quick={state.quick}
            onFull={(f, p) => dispatch({ type: "SET_FULL", full: f, provider: p })}
            onBack={() => dispatch({ type: "GO", step: 2 })}
            onNext={() => dispatch({ type: "GO", step: 4 })}
            full={state.full}
            provider={state.fullProvider}
          />
        )}
        {state.step === 4 && state.quick && state.full && (
          <Step4
            state={state}
            onBack={() => dispatch({ type: "GO", step: 3 })}
            onRestart={(usePrompt) => {
              if (usePrompt) {
                dispatch({ type: "SET_PROMPT", value: state.full!.improvedPrompt });
              }
              dispatch({ type: "RESET" });
              if (usePrompt) {
                router.refresh();
              }
            }}
          />
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function TopBar({ step }: { step: 1 | 2 | 3 | 4 }) {
  const pct = (step / 4) * 100;
  return (
    <div className="sticky top-0 z-30 bg-bg/85 backdrop-blur-md border-b border-border">
      <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between">
        <Logo size={22} />
        <span className="text-xs text-muted">
          Step <span className="mono text-fg">{step}</span> of 4 ·{" "}
          <span className="text-dim">{STEPS[step - 1]}</span>
        </span>
      </div>
      <div className="h-px bg-border relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Step 1 — Compose
// ──────────────────────────────────────────────────────────────────────

function Step1({
  prompt,
  setPrompt,
  onNext,
}: {
  prompt: string;
  setPrompt: (v: string) => void;
  onNext: () => void;
}) {
  const [open, setOpen] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const len = prompt.trim().length;
  const valid = len >= 30;

  return (
    <div className="fade-in flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tighter">
          Paste your build prompt
        </h1>
        <p className="text-muted text-md">
          We'll score 11 dimensions, predict how Claude / Gemini / Codex / Cursor
          will interpret it, and rewrite the parts that fall short.
        </p>
      </header>

      <Card padding="sm" className="overflow-hidden">
        <textarea
          ref={taRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Build a habit tracking app with daily streaks, custom reminders, social accountability partners…"
          rows={12}
          className="w-full bg-transparent text-fg text-base mono leading-relaxed resize-none focus:outline-none placeholder:text-dim"
        />
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-sm text-muted hover:text-fg transition-colors inline-flex items-center gap-1.5"
          >
            <Icon name="templates" size={14} />
            Use a template
            <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
              ▾
            </span>
          </button>
          <span
            className={`mono text-xs ${
              valid ? "text-success" : "text-dim"
            }`}
          >
            {len} {valid ? "✓" : `/ 30 min`}
          </span>
        </div>
      </Card>

      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 fade-in">
          {TEMPLATES.map((t) => (
            <button
              key={t.name}
              onClick={() => {
                setPrompt(t.prompt);
                setOpen(false);
                requestAnimationFrame(() => taRef.current?.focus());
              }}
              className="text-left p-3 bg-surface border border-border rounded-md hover:border-border-strong transition-colors"
            >
              <div className="font-semibold text-sm mb-1">{t.name}</div>
              <div className="text-xs text-muted leading-relaxed">{t.blurb}</div>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <LinkButton href="/dashboard" variant="ghost" size="md">
          <Icon name="arrowLeft" size={14} /> Dashboard
        </LinkButton>
        <Button onClick={onNext} disabled={!valid}>
          Inspect <Icon name="arrowRight" size={14} />
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Step 2 — Quick Score
// ──────────────────────────────────────────────────────────────────────

const ELEVEN = [
  "Vision",
  "Users",
  "Features",
  "UX Design",
  "Architecture",
  "Database Design",
  "Security",
  "Monetization",
  "Edge Cases",
  "Scalability",
  "AI Readiness",
];

function Step2({
  prompt,
  quick,
  provider,
  onQuick,
  onBack,
  onNext,
}: {
  prompt: string;
  quick: QuickResult | null;
  provider: Provider | null;
  onQuick: (q: QuickResult, p: Provider | null) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const stream = useAnalyzeStream<QuickResult>();
  const ranOnce = useRef(false);

  // Auto-run on mount unless we already have a result.
  useEffect(() => {
    if (quick || ranOnce.current) return;
    ranOnce.current = true;
    stream.run({ prompt, stage: "quick" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Promote completed result to parent state.
  useEffect(() => {
    if (stream.status === "done" && stream.partial && !quick) {
      const p = stream.partial as QuickResult;
      if (p.overallScore != null && p.categoryScores) {
        onQuick(p, stream.provider);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream.status]);

  const live = quick ?? (stream.partial as QuickResult | null);
  const scores = live?.categoryScores || [];
  const scoreByName = Object.fromEntries(
    scores.map((c) => [c.name, c.score]),
  ) as Record<string, number>;

  const usingProvider = provider || stream.provider;
  const isStreaming = stream.status === "streaming";

  return (
    <div className="fade-in flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted uppercase tracking-tight">
            Quick Score
          </span>
          {usingProvider && (
            <Badge tone={usingProvider}>
              {usingProvider === "claude" ? "Claude" : "Gemini fallback"}
            </Badge>
          )}
          {isStreaming && (
            <span className="text-xs text-dim inline-flex items-center gap-1.5">
              <span className="w-3 h-3 border border-dim border-t-fg rounded-full spin inline-block" />
              streaming…
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tighter">
          {live?.title || "Analyzing your prompt…"}
        </h1>
      </header>

      <Card padding="lg" className="flex flex-col items-center gap-3 py-10">
        <Score
          value={live?.overallScore ?? null}
          max={100}
          size="xl"
          animate
        />
        <div className="flex items-center gap-2">
          {live?.rank ? <RankBadge rank={live.rank} /> : null}
          {live?.readyToBuild !== undefined && (
            <Badge tone={live.readyToBuild ? "success" : "warning"}>
              {live.readyToBuild ? (
                <>
                  <Icon name="check" size={11} /> Ready to build
                </>
              ) : (
                <>
                  <Icon name="alert" size={11} /> Needs work
                </>
              )}
            </Badge>
          )}
        </div>
      </Card>

      <Section title="11 Dimensions" hint="0 / 10 each">
        <Card padding="md">
          <div className="flex flex-col divide-y divide-border">
            {ELEVEN.map((name) => (
              <Bar
                key={name}
                label={name}
                value={scoreByName[name] ?? null}
                max={10}
              />
            ))}
          </div>
        </Card>
      </Section>

      {stream.error && (
        <Card padding="md" className="border-danger/40">
          <div className="flex items-start gap-3">
            <Icon name="alert" size={16} className="text-danger mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-danger">
                Analysis failed
              </div>
              <div className="text-xs text-muted mt-1">{stream.error}</div>
              <Button
                size="sm"
                variant="ghost"
                className="mt-3"
                onClick={() => stream.run({ prompt, stage: "quick" })}
              >
                Retry
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          <Icon name="arrowLeft" size={14} /> Back
        </Button>
        <Button onClick={onNext} disabled={!quick}>
          Deep Analysis <Icon name="arrowRight" size={14} />
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Step 3 — Deep Analysis
// ──────────────────────────────────────────────────────────────────────

function Step3({
  prompt,
  quick,
  full,
  provider,
  onFull,
  onBack,
  onNext,
}: {
  prompt: string;
  quick: QuickResult;
  full: FullResult | null;
  provider: Provider | null;
  onFull: (f: FullResult, p: Provider | null) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const stream = useAnalyzeStream<FullResult>();
  const ranOnce = useRef(false);

  useEffect(() => {
    if (full || ranOnce.current) return;
    ranOnce.current = true;
    stream.run({
      prompt,
      stage: "full",
      categoryScores: quick.categoryScores,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stream.status === "done" && stream.partial && !full) {
      const p = stream.partial as FullResult;
      if (p.improvedPrompt) onFull(p, stream.provider);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream.status]);

  const live = full ?? (stream.partial as FullResult | null);
  const usingProvider = provider || stream.provider;
  const isStreaming = stream.status === "streaming";

  return (
    <div className="fade-in flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted uppercase tracking-tight">
            Deep Analysis
          </span>
          {usingProvider && (
            <Badge tone={usingProvider}>
              {usingProvider === "claude" ? "Claude" : "Gemini fallback"}
            </Badge>
          )}
          {isStreaming && (
            <span className="text-xs text-dim inline-flex items-center gap-1.5">
              <span className="w-3 h-3 border border-dim border-t-fg rounded-full spin inline-block" />
              streaming…
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tighter">{quick.title}</h1>
      </header>

      <Section title="Weakest Categories">
        <div className="flex flex-col gap-3">
          {live?.detailedCategories?.map((c) => (
            <Card key={c.name} padding="md" hover>
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-md">{c.name}</div>
                <span
                  className={`mono text-sm font-semibold ${
                    c.score >= 7
                      ? "text-success"
                      : c.score >= 5
                        ? "text-accent"
                        : c.score >= 3
                          ? "text-warning"
                          : "text-danger"
                  }`}
                >
                  {c.score}/10
                </span>
              </div>
              <DetailLines label="Strength" tone="success" items={c.strengths} />
              <DetailLines label="Weakness" tone="warning" items={c.weaknesses} />
              <DetailLines
                label="Recommendation"
                tone="accent"
                items={c.recommendations}
              />
            </Card>
          )) || <Skeleton lines={3} />}
        </div>
      </Section>

      <Section title="Missing Requirements">
        <div className="flex flex-col gap-2">
          {live?.missingRequirements?.map((g, i) => (
            <Card key={i} padding="md">
              <div className="font-semibold text-sm mb-2">{g.title}</div>
              <ul className="flex flex-col gap-1.5">
                {g.items?.map((it, j) => (
                  <li
                    key={j}
                    className="text-sm text-muted flex items-start gap-2"
                  >
                    <Icon
                      name="gap"
                      size={12}
                      className="text-warning mt-1 flex-shrink-0"
                    />
                    {it}
                  </li>
                ))}
              </ul>
            </Card>
          )) || <Skeleton lines={2} />}
        </div>
      </Section>

      <Section title="AI Compatibility" hint="how each tool would interpret">
        <Card padding="md">
          <div className="flex flex-col divide-y divide-border">
            {(["claude", "gemini", "codex", "cursor"] as const).map((k) => (
              <Bar
                key={k}
                label={k[0].toUpperCase() + k.slice(1)}
                value={live?.aiCompatibility?.[k] ?? null}
                max={100}
                trailing={
                  live?.aiCompatibility?.[k] != null
                    ? `${live.aiCompatibility[k]}%`
                    : undefined
                }
              />
            ))}
          </div>
        </Card>
      </Section>

      <Section title="Simulation">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SimCard
            title="Will build correctly"
            tone="success"
            items={live?.simulation?.willBuildCorrectly}
          />
          <SimCard
            title="Misunderstandings"
            tone="warning"
            items={live?.simulation?.potentialMisunderstandings}
          />
          <SimCard
            title="Missing assumptions"
            tone="accent"
            items={live?.simulation?.missingAssumptions}
          />
          <SimCard
            title="Implementation risks"
            tone="danger"
            items={live?.simulation?.implementationRisks}
          />
        </div>
      </Section>

      {stream.error && (
        <Card padding="md" className="border-danger/40">
          <div className="flex items-start gap-3">
            <Icon name="alert" size={16} className="text-danger mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-danger">
                Analysis failed
              </div>
              <div className="text-xs text-muted mt-1">{stream.error}</div>
              <Button
                size="sm"
                variant="ghost"
                className="mt-3"
                onClick={() =>
                  stream.run({
                    prompt,
                    stage: "full",
                    categoryScores: quick.categoryScores,
                  })
                }
              >
                Retry
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          <Icon name="arrowLeft" size={14} /> Back
        </Button>
        <Button onClick={onNext} disabled={!full}>
          Improved Prompt <Icon name="arrowRight" size={14} />
        </Button>
      </div>
    </div>
  );
}

function DetailLines({
  label,
  tone,
  items,
}: {
  label: string;
  tone: "success" | "warning" | "accent";
  items?: string[];
}) {
  if (!items?.length) return null;
  const dot =
    tone === "success"
      ? "bg-success"
      : tone === "warning"
        ? "bg-warning"
        : "bg-accent";
  return (
    <div className="py-1.5 flex gap-3 text-sm">
      <div className="flex items-center gap-2 w-32 flex-shrink-0">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        <span className="text-xs text-muted uppercase tracking-tight">
          {label}
        </span>
      </div>
      <div className="text-fg/85 leading-relaxed">{items.join(" ")}</div>
    </div>
  );
}

function SimCard({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "success" | "warning" | "accent" | "danger";
  items?: string[];
}) {
  return (
    <Card padding="md">
      <Badge tone={tone}>{title}</Badge>
      <div className="mt-3 text-sm text-fg/85 leading-relaxed">
        {items?.length ? (
          <ul className="flex flex-col gap-1.5">
            {items.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        ) : (
          <Skeleton lines={2} />
        )}
      </div>
    </Card>
  );
}

function Skeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="shimmer h-3 rounded-sm"
          style={{ width: `${60 + ((i * 17) % 35)}%` }}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Step 4 — Improved Prompt
// ──────────────────────────────────────────────────────────────────────

function Step4({
  state,
  onBack,
  onRestart,
}: {
  state: State;
  onBack: () => void;
  onRestart: (usePrompt: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const improved = state.full!.improvedPrompt;

  function copy() {
    navigator.clipboard.writeText(improved);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function save() {
    setSaving(true);
    setSaveErr(null);
    try {
      const deviceId = getDeviceId();
      // Base row that maps to common columns + the `prompt` NOT NULL column.
      const row: any = {
        device_id: deviceId,
        prompt: state.prompt,
        improved_prompt: state.full!.improvedPrompt,
        title: state.quick!.title,
        overall_score: state.quick!.overallScore,
        rank: state.quick!.rank,
        ready_to_build: state.quick!.readyToBuild,
        full_result: {
          ...state.quick,
          ...state.full,
          categories: state.quick!.categoryScores,
        },
      };
      if (state.quickProvider || state.fullProvider) {
        row.provider = state.fullProvider || state.quickProvider;
      }

      // Insert with graceful column drop: if the DB rejects a missing column,
      // drop it and retry. Loop because there may be more than one mismatch.
      const dropable = ["provider", "improved_prompt", "ready_to_build", "rank"];
      let attempt = { ...row };
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { error } = await supabase.from("analyses").insert(attempt);
        if (!error) {
          setSaved(true);
          return;
        }
        // Postgres "column ... does not exist" comes through as
        // PGRST204 / "Could not find the 'foo' column" etc.
        const msg = (error.message || "").toLowerCase();
        const stripped = dropable.find(
          (k) => msg.includes(`'${k}'`) || msg.includes(` ${k} `),
        );
        if (!stripped || !(stripped in attempt)) {
          throw error;
        }
        delete attempt[stripped];
      }
    } catch (e: any) {
      setSaveErr(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fade-in flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="text-xs text-muted uppercase tracking-tight">
          Improved Prompt
        </span>
        <h1 className="text-3xl font-bold tracking-tighter">
          Send this to your AI instead
        </h1>
        <p className="text-muted text-md">
          Rewrites the parts of your prompt that scored lowest, in your voice.
        </p>
      </header>

      <Card padding="lg" className="bg-surface-2">
        <pre className="mono text-sm text-fg leading-relaxed whitespace-pre-wrap">
          {improved}
        </pre>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={copy}>
          <Icon name="copy" size={14} />
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button variant="ghost" onClick={() => onRestart(true)}>
          Use as new prompt
        </Button>
        <Button
          variant="ghost"
          onClick={save}
          disabled={saving || saved}
          className="ml-auto"
        >
          <Icon name="check" size={14} />
          {saving ? "Saving…" : saved ? "Saved to History" : "Save to History"}
        </Button>
      </div>

      {saveErr && (
        <div className="text-xs text-danger">{saveErr}</div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          <Icon name="arrowLeft" size={14} /> Back
        </Button>
        <LinkButton href="/history" variant="ghost">
          Go to History
        </LinkButton>
      </div>
    </div>
  );
}
