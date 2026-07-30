import type { Metadata } from "next";

import { requirePrincipal } from "@/lib/auth/session";
import { getVisibleTools } from "@/modules/tool-catalog/data";
import { ToolExplorer, type VisibleTool } from "@/modules/tool-catalog/presentation/tool-explorer";

export const metadata: Metadata = { title: "Ferramentas" };

export default async function ToolsPage() {
  const principal = await requirePrincipal("dashboard:view");
  const tools = await getVisibleTools(principal);
  const serialized: VisibleTool[] = tools.map((tool) => ({ ...tool, lastUsedAt: tool.lastUsedAt?.toISOString() }));

  return <div><p className="text-brand mb-2 text-xs font-bold tracking-[0.16em] uppercase">Catálogo central</p><h1 className="font-heading text-4xl font-medium">Encontre sua próxima ação.</h1><p className="text-muted-foreground mt-3 mb-8 max-w-2xl leading-7">Ferramentas aprovadas para tornar a operação VTEX mais rápida, consistente e auditável.</p><ToolExplorer tools={serialized} /></div>;
}
