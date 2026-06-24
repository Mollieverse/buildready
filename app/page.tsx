import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";

const features = [
  {
    icon: "score" as const,
    title: "Prompt Intelligence",
    desc: "An 11-dimension framework grades every aspect of your build prompt the moment you paste it.",
  },
  {
    icon: "sparkle" as const,
    title: "Build Readiness Score",
    desc: "A single 0–100 number and a rank — Beginner to Prompt Master — that tell you whether to ship the prompt as-is.",
  },
  {
    icon: "gap" as const,
    title: "Missing Requirements",
    desc: "Surface gaps in user roles, data models, security, and edge cases before any code gets generated.",
  },
  {
    icon: "branch" as const,
    title: "AI Compatibility",
    desc: "Predict how Claude, Gemini, Codex, and Cursor will each interpret — and diverge on — your prompt.",
  },
  {
    icon: "stack" as const,
    title: "Prompt Simulation",
    desc: "See exactly what the AI will build correctly, what it'll misunderstand, and what it'll skip.",
  },
  {
    icon: "shield" as const,
    title: "Improved Prompt",
    desc: "Receive a tight rewrite that targets the lowest-scoring dimensions, in your own voice.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <nav className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-sm text-muted hover:text-fg transition-colors px-3 py-1.5"
            >
              Dashboard
            </Link>
            <LinkButton href="/inspect" size="sm">
              Inspect prompt <Icon name="arrowRight" size={13} />
            </LinkButton>
          </div>
        </div>
      </nav>

      <section className="max-w-3xl mx-auto px-5 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-accent-line bg-accent-soft text-accent text-2xs font-semibold uppercase tracking-tight mb-10">
          <Icon name="sparkle" size={11} />
          AI-powered prompt analysis
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tightest leading-[1.05] mb-6">
          Stop wasting AI credits
          <br />
          <span className="text-muted">on bad prompts.</span>
        </h1>
        <p className="text-lg text-muted max-w-xl mx-auto mb-10 leading-relaxed">
          BuildReady scores, simulates, and rewrites your software build prompts
          before sending them to Claude, Gemini, Codex, or Cursor — so the AI
          builds what you meant the first time.
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <LinkButton href="/inspect">
            Inspect my prompt <Icon name="arrowRight" size={14} />
          </LinkButton>
          <LinkButton href="/templates" variant="ghost">
            Browse templates
          </LinkButton>
        </div>
        <div className="mt-8 flex gap-6 justify-center flex-wrap text-xs text-dim">
          {["11 score dimensions", "Claude + Gemini", "Fast prompt rewrite"].map(
            (t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Icon name="check" size={12} className="text-success" />
                {t}
              </span>
            ),
          )}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden">
          {features.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <Icon name={f.icon} size={18} className="text-accent mb-4" />
              <div className="font-semibold mb-2">{f.title}</div>
              <div className="text-sm text-muted leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-5 py-8 flex items-center justify-between text-xs text-dim">
          <Logo size={18} />
          <span>Built with Claude · Gemini fallback</span>
        </div>
      </footer>
    </div>
  );
}
