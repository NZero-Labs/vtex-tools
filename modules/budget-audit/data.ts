import "server-only";

import { hasCapability } from "@/lib/auth/permissions";
import { getCurrentPrincipal } from "@/lib/auth/session";
import { TOOL_IDS } from "@/modules/tool-catalog/catalog";
import { getToolAccess, recordToolUse } from "@/modules/tool-catalog/data";

export type BudgetAuditPrincipal = NonNullable<
  Awaited<ReturnType<typeof getCurrentPrincipal>>
>;

export async function getBudgetAuditPrincipal(): Promise<
  | { ok: true; principal: BudgetAuditPrincipal }
  | { ok: false; status: 401 | 403; error: string }
> {
  const principal = await getCurrentPrincipal();
  if (!principal)
    return {
      ok: false,
      status: 401,
      error: "Sessão expirada. Entre novamente.",
    };
  if (!hasCapability(principal, "budget:compare"))
    return { ok: false, status: 403, error: "Acesso negado." };
  if (!(await getToolAccess(principal, TOOL_IDS.budgetAudit)).allowed) {
    return {
      ok: false,
      status: 403,
      error: "Esta ferramenta não está disponível para sua conta.",
    };
  }
  return { ok: true, principal };
}

export async function recordBudgetAuditUse(principal: BudgetAuditPrincipal) {
  await recordToolUse(principal.id, TOOL_IDS.budgetAudit);
}
