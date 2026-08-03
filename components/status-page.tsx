import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function StatusPage({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  destructive = false,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  action: ReactNode;
  destructive?: boolean;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12 sm:px-6">
      <section className="bg-card w-full max-w-lg rounded-2xl border p-6 text-center shadow-sm sm:p-10">
        <div className={cn("mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl", destructive ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground")}>
          <Icon className="size-7" aria-hidden />
        </div>
        <p className={cn("mb-2 text-xs font-bold tracking-[0.14em] uppercase", destructive ? "text-destructive" : "text-primary")}>{eyebrow}</p>
        <h1 className="font-heading text-3xl leading-tight font-medium text-balance sm:text-4xl">{title}</h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-md text-sm leading-6 sm:text-base">{description}</p>
        <div className="mt-7 flex justify-center">{action}</div>
      </section>
    </main>
  );
}
