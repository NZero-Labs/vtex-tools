import { getServerEnv } from "@/lib/env";
import { getBudgetAuditPrincipal, recordBudgetAuditUse } from "@/modules/budget-comparison/data";
import { budgetCartRequestSchema, compareBudgets, toPublicSubject } from "@/modules/budget-comparison/domain/budget-comparison";
import { BudgetIntegrationError, fetchBudget } from "@/modules/budget-comparison/infrastructure/vtex-budget-repository";
import { addWeights } from "@/modules/budget-comparison/infrastructure/vtex-catalog-repository";
import { fetchOrderForm } from "@/modules/budget-comparison/infrastructure/vtex-order-form-repository";

export async function POST(request: Request) {
  const access = await getBudgetAuditPrincipal();
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const parsed = budgetCartRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  try {
    const env = getServerEnv();
    const [budgetRecord, cartRecord] = await Promise.all([
      fetchBudget(parsed.data.budgetId, env),
      fetchOrderForm(parsed.data.orderForm, env),
    ]);
    const [budget, cart] = await addWeights([toPublicSubject(budgetRecord), cartRecord], env);
    if (!budget || !cart) throw new BudgetIntegrationError("Dados da comparação ausentes", 502);
    await recordBudgetAuditUse(access.principal);
    return Response.json({ source: env.USE_VTEX_FIXTURES ? "fixture" : "vtex", budget, cart, comparison: compareBudgets(budget, cart) });
  } catch (error) {
    if (error instanceof BudgetIntegrationError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Não foi possível concluir a comparação." }, { status: 500 });
  }
}
