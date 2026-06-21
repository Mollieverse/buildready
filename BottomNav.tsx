"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const C = {
  card: "#111111", border: "#1E1E1E", blue: "#3B82F6", dim: "#52525B",
};

const items = [
  { href: "/dashboard", label: "Home", icon: "⊞" },
  { href: "/inspect", label: "Inspect", icon: "◎" },
  { href: "/history", label: "History", icon: "◈" },
  { href: "/templates", label: "Templates", icon: "◆" },
  { href: "/settings", label: "Settings", icon: "⊙" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: C.card,
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        zIndex: 200,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "10px 4px",
              color: active ? C.blue : C.dim,
              fontSize: 11,
              fontWeight: active ? 600 : 400,
              gap: 3,
              textDecoration: "none",
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
