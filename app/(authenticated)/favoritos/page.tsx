import type { Metadata } from "next";

import { PageHeader } from "@/components/authenticated/page-header";
import { requirePrincipal } from "@/lib/auth/session";
import { getVisibleTools } from "@/modules/tool-catalog/data";
import { ToolExplorer, type VisibleTool } from "@/modules/tool-catalog/presentation/tool-explorer";

export const metadata: Metadata = { title: "Favoritos" };

export default async function FavoritesPage() {
  const principal = await requirePrincipal("dashboard:view");
  const tools = await getVisibleTools(principal);
  const serialized: VisibleTool[] = tools.map((tool) => ({ ...tool, lastUsedAt: tool.lastUsedAt?.toISOString() }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Atalhos pessoais"
        title="Seus favoritos"
        description="Mantenha por perto as ferramentas mais importantes para a sua rotina."
      />
      <ToolExplorer tools={serialized} favoritesOnly />
    </div>
  );
}
