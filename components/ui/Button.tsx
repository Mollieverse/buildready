import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "destructive";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed";

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-md",
  md: "h-10 px-4 text-base rounded-md",
};

const variants: Record<Variant, string> = {
  primary: "bg-fg text-bg hover:bg-white/90",
  ghost: "bg-transparent text-fg border border-border hover:bg-surface",
  destructive:
    "bg-transparent text-danger border border-danger/30 hover:bg-danger/10",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
};

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

type LinkButtonProps = CommonProps & { href: string; target?: string };

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  href,
  target,
  children,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      target={target}
      className={`${base} ${sizes[size]} ${variants[variant]} no-underline ${className}`}
    >
      {children}
    </Link>
  );
}
