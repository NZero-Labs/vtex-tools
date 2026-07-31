import { redirect } from "next/navigation";

import { requirePrincipal } from "@/lib/auth/session";
import { getToolAccess } from "@/modules/tool-catalog/data";

export default async function BudgetAuditLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const principal = await requirePrincipal("budget:compare");
  if (!(await getToolAccess(principal, "budget-comparison")).allowed) redirect("/acesso-negado");
  return children;
}
