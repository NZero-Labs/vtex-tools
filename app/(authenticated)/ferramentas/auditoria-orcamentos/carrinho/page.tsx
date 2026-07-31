import type { Metadata } from "next";

import { AuditPageHeader } from "@/modules/budget-comparison/presentation/audit-page-header";
import { BudgetCartTool } from "@/modules/budget-comparison/presentation/budget-cart-tool";

export const metadata: Metadata = { title: "Orçamento × Carrinho" };
export default function BudgetCartPage() {
  return <div><AuditPageHeader eyebrow="Auditoria de Orçamentos" title="Confira a proposta contra o carrinho." description="Compare o orçamento salvo no Master Data com o OrderForm atual da VTEX." /><BudgetCartTool /></div>;
}
