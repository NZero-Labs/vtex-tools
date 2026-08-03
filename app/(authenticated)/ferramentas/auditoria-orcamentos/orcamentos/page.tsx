import type { Metadata } from "next";

import { AuditPageHeader } from "@/modules/budget-audit/presentation/audit-page-header";
import { BudgetComparisonTool } from "@/modules/budget-audit/presentation/budget-comparison-tool";

export const metadata: Metadata = { title: "Orçamento × Orçamento" };
export default function BudgetsPage() {
  return (
    <div className="flex flex-col gap-8">
      <AuditPageHeader
        eyebrow="Auditoria de Orçamentos"
        title="Compare propostas sem perder o contexto."
        description="Identifique alterações relevantes entre até cinco orçamentos, com o primeiro usado como base."
      />
      <BudgetComparisonTool />
    </div>
  );
}
