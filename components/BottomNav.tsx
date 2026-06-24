"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./ui/Icon";

const items = [
  { href: "/dashboard", label: "Home", icon: "home" as const },
  { href: "/inspect", label: "Inspect", icon: "inspect" as const },
  { href: "/history", label: "History", icon: "history" as const },
  { href: "/templates", label: "Templates", icon: "templates" as const },
  { href: "/settings", label: "Settings", icon: "settings" as const },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur-md border-t border-border z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-3xl mx-auto flex">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex-1 flex flex-col items-center gap-1 py-2.5 text-2xs font-semibold transition-colors ${
                active ? "text-fg" : "text-dim hover:text-muted"
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-8 bg-accent" />
              )}
              <Icon name={item.icon} size={18} />
              <span className="tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
