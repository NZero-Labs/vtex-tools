import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { requirePrincipal } from "@/lib/auth/session";
import { listComparisonHistory } from "@/modules/budget-audit/history";
import { AuditPageHeader } from "@/modules/budget-audit/presentation/audit-page-header";

export const metadata: Metadata = { title: "Histórico de comparações" };

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" });

const kindLabels = {
  budget: "Orçamento × orçamento",
  cart: "Orçamento × carrinho",
  version: "Orçamento × versão",
} as const;

export default async function ComparisonHistoryPage() {
  const principal = await requirePrincipal("budget:compare");
  const comparisons = await listComparisonHistory(principal.id);

  return (
    <div className="flex flex-col gap-8">
      <AuditPageHeader
        eyebrow="Auditoria de Orçamentos"
        title="Histórico de comparações."
        description="Abra novamente uma comparação ou compartilhe o link com alguém que tenha acesso à ferramenta."
      />

      {comparisons.length ? (
        <section className="grid gap-3" aria-label="Comparações salvas">
          {comparisons.map((comparison) => (
            <Link key={comparison.id} href={`/ferramentas/auditoria-orcamentos/historico/${comparison.id}`} className="group focus-visible:outline-none">
              <Card className="transition-colors group-hover:border-primary/50 group-focus-visible:border-ring group-focus-visible:ring-3 group-focus-visible:ring-ring/30">
                <CardContent className="flex min-w-0 items-center gap-4 p-4 sm:p-5">
                  <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <History className="size-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{kindLabels[comparison.kind]}</p>
                      <Badge variant="outline" className="hidden sm:inline-flex">Salva</Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
                      <Clock3 className="size-3.5" aria-hidden />
                      {dateTime.format(comparison.createdAt)}
                    </p>
                  </div>
                  <ArrowRight className="text-muted-foreground size-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><History /></EmptyMedia>
            <EmptyTitle>Nenhuma comparação salva</EmptyTitle>
            <EmptyDescription>Quando você concluir uma comparação, ela aparecerá aqui para ser reaberta.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
