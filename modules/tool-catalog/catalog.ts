import type { Capability } from "@/lib/auth/permissions";

export type ToolStatus = "available" | "beta" | "maintenance" | "coming-soon";

export type ToolDefinition = {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: "files" | "user-check";
  category: "Orçamentos" | "Clientes";
  tags: string[];
  requiredCapability: Capability;
  defaultStatus: ToolStatus;
  order: number;
};

export const toolCatalog = [
  {
    id: "active-update",
    name: "Atualizar Ativa",
    description: "Atualize o uso de cupom de clientes em massa por CSV.",
    route: "/ferramentas/atualizar-ativo",
    icon: "user-check",
    category: "Clientes",
    tags: ["clientes", "CSV", "Master Data", "VTEX"],
    requiredCapability: "active:update",
    defaultStatus: "available",
    order: 20,
  },
  {
    id: "budget-comparison",
    name: "Comparação de orçamentos",
    description: "Audite produtos, valores e condições entre propostas VTEX.",
    route: "/ferramentas/comparar-orcamentos",
    icon: "files",
    category: "Orçamentos",
    tags: ["auditoria", "preços", "SKUs", "VTEX"],
    requiredCapability: "budget:compare",
    defaultStatus: "available",
    order: 10,
  },
] as const satisfies readonly ToolDefinition[];

export function findTool(toolId: string) {
  return toolCatalog.find((tool) => tool.id === toolId);
}
