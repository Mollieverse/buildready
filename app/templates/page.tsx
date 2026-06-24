"use client";

import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { TEMPLATES } from "@/lib/templates";

export default function Templates() {
  const router = useRouter();

  function pick(content: string) {
    sessionStorage.setItem("buildready_template", content);
    router.push("/inspect");
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <Logo size={22} />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-5 pt-8 flex flex-col gap-6">
        <section>
          <h1 className="text-3xl font-bold tracking-tighter mb-1">Templates</h1>
          <p className="text-muted text-md">
            Start with a proven prompt and customize it for your build.
          </p>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TEMPLATES.map((t) => (
            <Card key={t.name} padding="md" hover>
              <div className="font-semibold text-md mb-1">{t.name}</div>
              <div className="text-sm text-muted mb-4 leading-relaxed">
                {t.blurb}
              </div>
              <Button size="sm" variant="ghost" onClick={() => pick(t.prompt)}>
                Use template <Icon name="arrowRight" size={13} />
              </Button>
            </Card>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
