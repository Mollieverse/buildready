import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
};

const padMap = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  children,
  className = "",
  padding = "md",
  hover = false,
}: Props) {
  return (
    <div
      className={`bg-surface border border-border rounded-lg ${padMap[padding]} ${
        hover ? "transition-colors hover:border-border-strong" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
