import { ReactNode } from "react";

type Props = {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function Section({ title, hint, children, className = "" }: Props) {
  return (
    <section className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-tight text-muted">
          {title}
        </h3>
        {hint ? <span className="text-xs text-dim">{hint}</span> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}
