import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, Files, History, ShoppingCart } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePrincipal } from "@/lib/auth/session";
import { listComparisonHistory } from "@/modules/budget-audit/history";
import { AuditPageHeader } from "@/modules/budget-audit/presentation/audit-page-header";

export const metadata: Metadata = { title: "Auditoria de Orçamentos" };

const flows = [
  {
    href: "/ferramentas/auditoria-orcamentos/orcamentos",
    icon: Files,
    title: "Dois orçamentos",
    description:
      "Compare propostas e descubra o que mudou entre elas.",
  },
  {
    href: "/ferramentas/auditoria-orcamentos/carrinho",
    icon: ShoppingCart,
    title: "Orçamento e carrinho",
    description:
      "Confira se o carrinho atual está igual ao orçamento.",
  },
  {
    href: "/ferramentas/auditoria-orcamentos/versoes",
    icon: History,
    title: "Orçamento e versão anterior",
    description: "Veja o que mudou entre o orçamento atual e uma versão anterior.",
  },
];

const kindLabels = {
  budget: "Orçamento × orçamento",
  cart: "Orçamento × carrinho",
  version: "Orçamento × versão",
} as const;

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" });

export default async function BudgetAuditPage() {
  const principal = await requirePrincipal("budget:compare");
  const history = await listComparisonHistory(principal.id);

  return (
    <div className="flex flex-col gap-8">
      <AuditPageHeader
        eyebrow="Auditoria VTEX"
        title="O que você quer comparar?"
        description="Escolha uma opção para começar. A ferramenta mostra as diferenças importantes e explica onde revisar."
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Tipos de auditoria">
        {flows.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full transition-transform group-hover:-translate-y-0.5">
              <CardHeader>
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Icon className="size-6" aria-hidden />
                </div>
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription className="leading-6">
                  {description}
                </CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto text-sm font-semibold text-primary">
                Começar comparação <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </CardFooter>
            </Card>
          </Link>
        ))}
      </section>

      {history.length > 0 && (
        <section aria-labelledby="historico-titulo">
          <div className="mb-5 flex items-center gap-3">
            <History className="text-primary size-5" aria-hidden />
            <div>
              <h2
                id="historico-titulo"
                className="font-heading text-xl font-medium"
              >
                Comparações salvas
              </h2>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Reabra uma comparação recente ou consulte todo o histórico.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {history.slice(0, 3).map((comparison) => (
              <Link
                key={comparison.id}
                href={`/ferramentas/auditoria-orcamentos/historico/${comparison.id}`}
                className="group focus-visible:outline-none"
              >
                <Card className="h-full transition-colors group-hover:border-primary/50 group-focus-visible:border-ring group-focus-visible:ring-3 group-focus-visible:ring-ring/30">
                  <CardContent className="flex min-w-0 items-center gap-4 p-4">
                    <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                      <History className="size-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{kindLabels[comparison.kind]}</p>
                      <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
                        <Clock3 className="size-3.5" aria-hidden />
                        {dateTime.format(comparison.createdAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Link
            href="/ferramentas/auditoria-orcamentos/historico"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            Ver todo o histórico <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>
      )}
    </div>
  );
}
