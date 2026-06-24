type Props = {
  label: string;
  value: number | null | undefined;
  max?: number;
  trailing?: string;
};

export function Bar({ label, value, max = 10, trailing }: Props) {
  const known = typeof value === "number";
  const pct = known ? Math.max(0, Math.min(1, value! / max)) : 0;
  const color =
    !known
      ? "bg-border-strong"
      : pct >= 0.7
        ? "bg-success"
        : pct >= 0.5
          ? "bg-accent"
          : pct >= 0.3
            ? "bg-warning"
            : "bg-danger";

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm text-muted flex-1 min-w-0 truncate">{label}</span>
      <div className="relative h-1.5 w-32 sm:w-40 bg-surface-2 rounded-sm overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${color} bar-fill`}
          style={{
            width: "100%",
            ["--bar-target" as any]: pct,
          }}
        />
      </div>
      <span className="mono text-xs text-fg w-12 text-right">
        {known ? (trailing ?? `${value}/${max}`) : "—"}
      </span>
    </div>
  );
}
