import type { Metadata } from "next";

import { PageHeader } from "@/components/authenticated/page-header";
import { requirePrincipal } from "@/lib/auth/session";
import { getVisibleTools } from "@/modules/tool-catalog/data";
import { ToolExplorer, type VisibleTool } from "@/modules/tool-catalog/presentation/tool-explorer";

export const metadata: Metadata = { title: "Ferramentas" };

export default async function ToolsPage() {
  const principal = await requirePrincipal("dashboard:view");
  const tools = await getVisibleTools(principal);
  const serialized: VisibleTool[] = tools.map((tool) => ({ ...tool, lastUsedAt: tool.lastUsedAt?.toISOString() }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Catálogo central"
        title="Encontre sua próxima ação"
        description="Ferramentas aprovadas para tornar a operação VTEX mais rápida, consistente e auditável."
      />
      <ToolExplorer tools={serialized} />
    </div>
  );
}
