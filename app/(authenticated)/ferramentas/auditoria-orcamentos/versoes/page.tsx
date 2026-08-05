import type { Metadata } from "next";

import { AuditPageHeader } from "@/modules/budget-audit/presentation/audit-page-header";
import { BudgetVersionsTool } from "@/modules/budget-audit/presentation/budget-versions-tool";

export const metadata: Metadata = { title: "Versões do Orçamento" };
export default function BudgetVersionsPage() {
  return (
    <div className="flex flex-col gap-8">
      <AuditPageHeader
        eyebrow="Auditoria de Orçamentos"
        title="Entenda a evolução de uma proposta."
        description="Escolha uma versão histórica e compare-a com o orçamento atual sem expor o documento interno."
      />
      <BudgetVersionsTool />
    </div>
  );
}
