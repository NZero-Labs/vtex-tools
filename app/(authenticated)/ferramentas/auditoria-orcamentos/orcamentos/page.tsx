import type { Metadata } from "next";

import { AuditPageHeader } from "@/modules/budget-comparison/presentation/audit-page-header";
import { BudgetComparisonTool } from "@/modules/budget-comparison/presentation/budget-comparison-tool";

export const metadata: Metadata = { title: "Orçamento × Orçamento" };
export default function BudgetsPage() {
  return <div><AuditPageHeader eyebrow="Auditoria de Orçamentos" title="Compare propostas sem perder o contexto." description="Identifique alterações relevantes entre até cinco orçamentos, com o primeiro usado como base." /><BudgetComparisonTool /></div>;
}
