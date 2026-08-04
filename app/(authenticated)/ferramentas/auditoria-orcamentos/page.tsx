import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Files, History, ShoppingCart } from "lucide-react";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export default function BudgetAuditPage() {
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
    </div>
  );
}
