"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getDeviceId } from "@/lib/deviceId";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Section } from "@/components/ui/Section";
import { Logo } from "@/components/ui/Logo";

export default function Settings() {
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  async function clearHistory() {
    if (!confirm("Permanently delete all your saved analyses? This can't be undone.")) {
      return;
    }
    setClearing(true);
    const deviceId = getDeviceId();
    await supabase.from("analyses").delete().eq("device_id", deviceId);
    setClearing(false);
    setCleared(true);
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <Logo size={22} />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-5 pt-8 flex flex-col gap-8">
        <section>
          <h1 className="text-3xl font-bold tracking-tighter mb-1">Settings</h1>
          <p className="text-muted text-md">Configure your BuildReady workspace.</p>
        </section>

        <Section title="AI Provider">
          <Card padding="md" className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm mb-1">Claude · Gemini</div>
              <div className="text-xs text-muted">
                Anthropic Claude is primary. Gemini takes over automatically if
                Anthropic errors or rate-limits.
              </div>
            </div>
            <div className="flex gap-1.5">
              <Badge tone="claude">Claude</Badge>
              <Badge tone="gemini">Gemini</Badge>
            </div>
          </Card>
        </Section>

        <Section title="History Storage">
          <Card padding="md">
            <div className="text-sm text-muted leading-relaxed">
              Analyses are saved to Supabase, scoped to a private cookie on this
              device. No account or login required.
            </div>
          </Card>
        </Section>

        <Section title="Danger Zone">
          <Card padding="md" className="border-danger/30">
            <div className="font-semibold text-sm text-danger mb-1">
              Clear all history
            </div>
            <div className="text-xs text-muted mb-4">
              Permanently delete every saved analysis from this device.
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearHistory}
              disabled={clearing}
            >
              {clearing ? "Clearing…" : cleared ? "Cleared ✓" : "Clear all data"}
            </Button>
          </Card>
        </Section>
      </main>
      <BottomNav />
    </div>
  );
}
