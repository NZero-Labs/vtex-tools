import { getServerEnv } from "@/lib/env";
import {
  budgetRequestSchema,
  compareBudgets,
  toPublicSubject,
} from "@/modules/budget-comparison/domain/budget-comparison";
import { getBudgetAuditPrincipal, recordBudgetAuditUse } from "@/modules/budget-comparison/data";
import { addWeights } from "@/modules/budget-comparison/infrastructure/vtex-catalog-repository";
import {
  BudgetIntegrationError,
  fetchBudget,
} from "@/modules/budget-comparison/infrastructure/vtex-budget-repository";

export async function POST(request: Request) {
  const access = await getBudgetAuditPrincipal();
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });

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
    const records = await Promise.all(
      parsed.data.budgetIds.map((budgetId) => fetchBudget(budgetId, env)),
    );
    const budgets = await addWeights(records.map(toPublicSubject), env);
    const baseline = budgets[0];
    if (!baseline)
      throw new BudgetIntegrationError("Orçamento base ausente", 400);

    await recordBudgetAuditUse(access.principal);

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
