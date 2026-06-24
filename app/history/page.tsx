"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getDeviceId } from "@/lib/deviceId";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, RankBadge } from "@/components/ui/Badge";
import { Score } from "@/components/ui/Score";
import { Bar } from "@/components/ui/Bar";
import { Section } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";

type Row = {
  id: string;
  title: string;
  overall_score: number;
  rank: string;
  ready_to_build: boolean;
  created_at: string;
  full_result: any;
  provider?: string;
};

export default function History() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Row | null>(null);

  useEffect(() => {
    async function load() {
      const deviceId = getDeviceId();
      const { data } = await supabase
        .from("analyses")
        .select("*")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false })
        .limit(100);
      setRows((data as Row[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  if (selected) {
    const r = selected.full_result || {};
    const cats: { name: string; score: number }[] =
      r.categories || r.categoryScores || [];

    return (
      <div className="min-h-screen bg-bg pb-24">
        <header className="border-b border-border">
          <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
            <Logo size={22} />
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-5 pt-6 flex flex-col gap-6">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
            <Icon name="arrowLeft" size={13} /> Back to History
          </Button>

          <header className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <RankBadge rank={selected.rank} />
              {selected.provider === "gemini" && (
                <Badge tone="gemini">Gemini fallback</Badge>
              )}
              <span className="text-xs text-dim">
                {new Date(selected.created_at).toLocaleString()}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tighter">
              {selected.title}
            </h1>
          </header>

          <Card padding="lg" className="flex flex-col items-center gap-2 py-10">
            <Score value={selected.overall_score} max={100} size="xl" animate={false} />
            {selected.ready_to_build ? (
              <Badge tone="success">
                <Icon name="check" size={11} /> Ready to build
              </Badge>
            ) : (
              <Badge tone="warning">
                <Icon name="alert" size={11} /> Needs work
              </Badge>
            )}
          </Card>

          {cats.length > 0 && (
            <Section title="11 Dimensions">
              <Card padding="md">
                <div className="flex flex-col divide-y divide-border">
                  {cats.map((c) => (
                    <Bar key={c.name} label={c.name} value={c.score} max={10} />
                  ))}
                </div>
              </Card>
            </Section>
          )}

          {r.aiCompatibility && (
            <Section title="AI Compatibility">
              <Card padding="md">
                <div className="flex flex-col divide-y divide-border">
                  {(["claude", "gemini", "codex", "cursor"] as const).map((k) => (
                    <Bar
                      key={k}
                      label={k[0].toUpperCase() + k.slice(1)}
                      value={r.aiCompatibility[k]}
                      max={100}
                      trailing={`${r.aiCompatibility[k]}%`}
                    />
                  ))}
                </div>
              </Card>
            </Section>
          )}

          {r.improvedPrompt && (
            <Section title="Improved Prompt">
              <Card padding="lg" className="bg-surface-2">
                <pre className="mono text-sm text-fg leading-relaxed whitespace-pre-wrap">
                  {r.improvedPrompt}
                </pre>
              </Card>
            </Section>
          )}
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <Logo size={22} />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-5 pt-8 flex flex-col gap-6">
        <section>
          <h1 className="text-3xl font-bold tracking-tighter mb-1">History</h1>
          <p className="text-muted text-md">
            All your previous prompt analyses, scoped to this device.
          </p>
        </section>

        {loading && <div className="text-muted text-sm py-12 text-center">Loading…</div>}

        {!loading && rows.length === 0 && (
          <Card padding="lg" className="text-center py-12">
            <Icon name="history" size={28} className="text-dim mx-auto mb-3" />
            <div className="font-semibold mb-1">No analyses yet</div>
            <div className="text-sm text-muted">
              Inspect your first prompt to see it here.
            </div>
          </Card>
        )}

        {!loading && rows.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {rows.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="bg-surface border border-border rounded-md p-4 flex items-center justify-between gap-3 text-left hover:border-border-strong transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {item.title}
                  </div>
                  <div className="text-xs text-dim mt-0.5">
                    {new Date(item.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <RankBadge rank={item.rank} />
                  <span
                    className={`mono text-base font-semibold w-12 text-right ${
                      item.overall_score >= 70
                        ? "text-success"
                        : item.overall_score >= 50
                          ? "text-accent"
                          : "text-warning"
                    }`}
                  >
                    {item.overall_score}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
