"use client";

import { useEffect, useState } from "react";

type Props = {
  value: number | null | undefined;
  max?: number;
  size?: "md" | "lg" | "xl";
  animate?: boolean;
};

const sizeMap = {
  md: "text-3xl",
  lg: "text-5xl",
  xl: "text-6xl",
};

export function Score({
  value,
  max = 100,
  size = "lg",
  animate = true,
}: Props) {
  const target = typeof value === "number" ? value : 0;
  const [n, setN] = useState(animate ? 0 : target);

  useEffect(() => {
    if (!animate) {
      setN(target);
      return;
    }
    const start = performance.now();
    const from = n;
    const dur = 600;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, animate]);

  const color =
    target >= 70
      ? "text-success"
      : target >= 50
        ? "text-accent"
        : target >= 30
          ? "text-warning"
          : "text-danger";

  if (value === null || value === undefined) {
    return <span className={`mono ${sizeMap[size]} text-dim`}>—</span>;
  }

  return (
    <span className={`mono font-semibold ${sizeMap[size]} ${color}`}>
      {n}
      <span className="text-dim text-base ml-1 font-medium">/{max}</span>
    </span>
  );
}
