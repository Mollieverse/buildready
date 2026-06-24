import { ReactNode } from "react";

type Tone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "claude"
  | "gemini";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted border-border",
  accent: "bg-accent-soft text-accent border-accent-line",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-danger/10 text-danger border-danger/30",
  claude: "bg-[#cc785c]/10 text-[#e9a187] border-[#cc785c]/30",
  gemini: "bg-[#4285f4]/10 text-[#7aa7ff] border-[#4285f4]/30",
};

const rankToTone: Record<string, Tone> = {
  Beginner: "danger",
  Explorer: "warning",
  Builder: "warning",
  Architect: "accent",
  "Prompt Master": "success",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-2xs font-semibold uppercase tracking-tight rounded-sm border ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function RankBadge({ rank }: { rank: string }) {
  return <Badge tone={rankToTone[rank] || "neutral"}>{rank}</Badge>;
}
