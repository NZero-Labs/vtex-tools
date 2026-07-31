import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Files, History, ShoppingCart } from "lucide-react";

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditPageHeader } from "@/modules/budget-comparison/presentation/audit-page-header";

export const metadata: Metadata = { title: "Auditoria de Orçamentos" };

const flows = [
  { href: "/ferramentas/auditoria-orcamentos/orcamentos", icon: Files, title: "Orçamento × Orçamento", description: "Compare de duas a cinco propostas e use a primeira como referência." },
  { href: "/ferramentas/auditoria-orcamentos/carrinho", icon: ShoppingCart, title: "Orçamento × Carrinho", description: "Valide o orçamento contra um OrderForm antes de fechar o pedido." },
  { href: "/ferramentas/auditoria-orcamentos/versoes", icon: History, title: "Atual × Versão histórica", description: "Revise o que mudou entre o documento atual e seu histórico." },
];

export default function BudgetAuditPage() {
  return <div><AuditPageHeader eyebrow="Auditoria VTEX" title="Um ponto de partida para cada conferência." description="Escolha a origem da comparação. Todos os relatórios usam os mesmos critérios de itens, valores, logística, promoções, tags e peso." /><section className="grid gap-5 lg:grid-cols-3">{flows.map(({ href, icon: Icon, title, description }) => <Link key={href} href={href} className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Card className="h-full transition group-hover:-translate-y-1 group-hover:shadow-lg"><CardHeader><div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Icon className="size-6" /></div><CardTitle className="text-2xl">{title}</CardTitle><CardDescription className="leading-6">{description}</CardDescription></CardHeader><CardFooter className="mt-auto text-sm font-semibold text-primary">Iniciar auditoria <ArrowRight className="ml-2 size-4 transition group-hover:translate-x-1" /></CardFooter></Card></Link>)}</section></div>;
}
