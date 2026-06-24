"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getDeviceId } from "@/lib/deviceId";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { RankBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";

type Row = {
  id: string;
  title: string;
  overall_score: number;
  rank: string;
  ready_to_build: boolean;
  created_at: string;
};

export default function Dashboard() {
  const [history, setHistory] = useState<Row[]>([]);
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

  const avg = history.length
    ? Math.round(history.reduce((a, h) => a + h.overall_score, 0) / history.length)
    : null;
  const ready = history.filter((h) => h.ready_to_build).length;
  const recent = history.slice(0, 4);

  return (
    <div className="min-h-screen bg-bg pb-24">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <Logo size={22} />
          <Link
            href="/settings"
            className="text-muted hover:text-fg transition-colors"
          >
            <Icon name="settings" size={18} />
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 pt-8 flex flex-col gap-6">
        <section>
          <h1 className="text-3xl font-bold tracking-tighter mb-1">Dashboard</h1>
          <p className="text-muted text-md">
            Inspect prompts, track improvements, ship better products.
          </p>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <Stat
            icon="stack"
            label="Analyses"
            value={loading ? "—" : String(history.length)}
          />
          <Stat
            icon="score"
            label="Avg score"
            value={loading ? "—" : avg !== null ? `${avg}` : "—"}
            mono
          />
          <Stat
            icon="check"
            label="Ready"
            value={loading ? "—" : String(ready)}
            mono
          />
        </section>

        <Card padding="lg" className="bg-accent-soft border-accent-line">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="font-semibold text-md mb-1">
                Inspect a new prompt
              </div>
              <div className="text-muted text-sm">
                Paste any AI build prompt, get a full readiness report in
                seconds.
              </div>
            </div>
            <LinkButton href="/inspect">
              Inspect <Icon name="arrowRight" size={14} />
            </LinkButton>
          </div>
        </Card>

        {!loading && recent.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-tight text-muted">
                Recent
              </h3>
              <Link
                href="/history"
                className="text-sm text-accent hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="flex flex-col gap-1.5">
              {recent.map((item) => (
                <Link
                  key={item.id}
                  href="/history"
                  className="bg-surface border border-border rounded-md p-3.5 flex items-center justify-between gap-3 hover:border-border-strong transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-dim mt-0.5">
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <RankBadge rank={item.rank} />
                    <span
                      className={`mono text-sm font-semibold w-10 text-right ${
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
                </Link>
              ))}
            </div>
          </section>
        )}

        {!loading && history.length === 0 && (
          <Card padding="lg" className="text-center py-12">
            <Icon name="inspect" size={28} className="text-dim mx-auto mb-3" />
            <div className="font-semibold mb-1">No analyses yet</div>
            <div className="text-sm text-muted">
              Inspect your first prompt to see it here.
            </div>
          </Card>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: "stack" | "score" | "check";
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <Card padding="md">
      <Icon name={icon} size={14} className="text-dim mb-3" />
      <div
        className={`text-3xl font-bold tracking-tighter mb-0.5 ${
          mono ? "mono" : ""
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-muted">{label}</div>
    </Card>
  );
}
