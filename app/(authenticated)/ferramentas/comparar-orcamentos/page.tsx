import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requirePrincipal } from "@/lib/auth/session";
import { BudgetComparisonTool } from "@/modules/budget-comparison/presentation/budget-comparison-tool";
import { getToolAccess } from "@/modules/tool-catalog/data";

export const metadata: Metadata = { title: "Comparação de orçamentos" };

export default async function BudgetComparisonPage() {
  const principal = await requirePrincipal("budget:compare");
  if (!(await getToolAccess(principal, "budget-comparison")).allowed) redirect("/acesso-negado");

  return (
    <div>
      <header className="relative mb-8 overflow-hidden rounded-3xl border bg-card px-6 py-8 sm:px-9 sm:py-10">
        <div aria-hidden className="absolute -top-16 -right-12 size-56 rounded-full bg-accent/70" />
        <div aria-hidden className="absolute top-10 right-24 size-24 rounded-full border border-primary/15" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-end">
          <div>
            <p className="text-brand mb-2 text-xs font-bold tracking-[0.16em] uppercase">Auditoria VTEX</p>
            <h1 className="font-heading max-w-3xl text-4xl leading-none font-medium text-balance sm:text-6xl">Compare sem perder o contexto.</h1>
            <p className="text-muted-foreground mt-4 max-w-2xl leading-7">Identifique alterações relevantes entre orçamentos com uma leitura executiva e detalhes lado a lado.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-muted p-4"><p className="font-heading text-3xl">2–5</p><p className="text-muted-foreground mt-1 text-xs">orçamentos por análise</p></div>
            <div className="rounded-2xl bg-accent p-4"><p className="font-heading text-3xl">1</p><p className="text-accent-foreground/75 mt-1 text-xs">relatório consolidado</p></div>
          </div>
        </div>
      </header>
      <BudgetComparisonTool />
    </div>
  );
}
