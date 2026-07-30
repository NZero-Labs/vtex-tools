import type { Metadata } from "next";

import { requirePrincipal } from "@/lib/auth/session";
import { getVisibleTools } from "@/modules/tool-catalog/data";
import { ToolExplorer, type VisibleTool } from "@/modules/tool-catalog/presentation/tool-explorer";

export const metadata: Metadata = { title: "Favoritos" };

export default async function FavoritesPage() {
  const principal = await requirePrincipal("dashboard:view");
  const tools = await getVisibleTools(principal);
  const serialized: VisibleTool[] = tools.map((tool) => ({ ...tool, lastUsedAt: tool.lastUsedAt?.toISOString() }));

  return <div><p className="text-brand mb-2 text-xs font-bold tracking-[0.16em] uppercase">Atalhos pessoais</p><h1 className="font-heading text-4xl font-medium">Seus favoritos.</h1><p className="text-muted-foreground mt-3 mb-8 max-w-2xl leading-7">Mantenha por perto as ferramentas mais importantes para a sua rotina.</p><ToolExplorer tools={serialized} favoritesOnly /></div>;
}
