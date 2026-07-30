import { hasCapability } from "@/lib/auth/permissions";
import { getCurrentPrincipal } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { recentTool } from "@/lib/db/schema";
import { getServerEnv } from "@/lib/env";
import {
  budgetRequestSchema,
  compareBudgets,
} from "@/modules/budget-comparison/domain/budget-comparison";
import {
  BudgetIntegrationError,
  fetchBudget,
} from "@/modules/budget-comparison/infrastructure/vtex-budget-repository";
import { getToolAccess } from "@/modules/tool-catalog/data";

export async function POST(request: Request) {
  const principal = await getCurrentPrincipal();
  if (!principal)
    return Response.json(
      { error: "Sessão expirada. Entre novamente." },
      { status: 401 },
    );
  if (!hasCapability(principal, "budget:compare"))
    return Response.json({ error: "Acesso negado." }, { status: 403 });
  if (!(await getToolAccess(principal, "budget-comparison")).allowed)
    return Response.json(
      { error: "Esta ferramenta não está disponível para sua conta." },
      { status: 403 },
    );

  const parsed = budgetRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );

  try {
    const env = getServerEnv();
    const budgets = await Promise.all(
      parsed.data.budgetIds.map((budgetId) => fetchBudget(budgetId, env)),
    );
    const baseline = budgets[0];
    if (!baseline)
      throw new BudgetIntegrationError("Orçamento base ausente", 400);

    await db
      .insert(recentTool)
      .values({
        userId: principal.id,
        toolId: "budget-comparison",
        usedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [recentTool.userId, recentTool.toolId],
        set: { usedAt: new Date() },
      });

    return Response.json({
      source: env.USE_VTEX_FIXTURES ? "fixture" : "vtex",
      budgets,
      comparisons: budgets
        .slice(1)
        .map((budget) => compareBudgets(baseline, budget)),
    });
  } catch (error) {
    if (error instanceof BudgetIntegrationError)
      return Response.json({ error: error.message }, { status: error.status });
    return Response.json(
      { error: "Não foi possível concluir a comparação." },
      { status: 500 },
    );
  }
}
