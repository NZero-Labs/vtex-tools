import "server-only";

import { hasCapability } from "@/lib/auth/permissions";
import { getCurrentPrincipal } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { recentTool } from "@/lib/db/schema";
import { getToolAccess } from "@/modules/tool-catalog/data";

export const BUDGET_AUDIT_TOOL_ID = "budget-comparison";
export type BudgetAuditPrincipal = NonNullable<Awaited<ReturnType<typeof getCurrentPrincipal>>>;

export async function getBudgetAuditPrincipal(): Promise<
  | { ok: true; principal: BudgetAuditPrincipal }
  | { ok: false; status: 401 | 403; error: string }
> {
  const principal = await getCurrentPrincipal();
  if (!principal) return { ok: false, status: 401, error: "Sessão expirada. Entre novamente." };
  if (!hasCapability(principal, "budget:compare")) return { ok: false, status: 403, error: "Acesso negado." };
  if (!(await getToolAccess(principal, BUDGET_AUDIT_TOOL_ID)).allowed) {
    return { ok: false, status: 403, error: "Esta ferramenta não está disponível para sua conta." };
  }
  return { ok: true, principal };
}

export async function recordBudgetAuditUse(principal: BudgetAuditPrincipal) {
  await db.insert(recentTool).values({ userId: principal.id, toolId: BUDGET_AUDIT_TOOL_ID, usedAt: new Date() }).onConflictDoUpdate({
    target: [recentTool.userId, recentTool.toolId],
    set: { usedAt: new Date() },
  });
}
