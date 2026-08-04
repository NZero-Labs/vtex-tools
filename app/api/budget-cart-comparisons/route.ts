import { getServerEnv } from "@/lib/env";
import {
  getBudgetAuditPrincipal,
  recordBudgetAuditUse,
} from "@/modules/budget-audit/data";
import { compareAuditSubjects } from "@/modules/budget-audit/domain/compare-subjects";
import { budgetCartRequestSchema } from "@/modules/budget-audit/domain/requests";
import { toPublicSubject } from "@/modules/budget-audit/domain/subject";
import { fetchBudget } from "@/modules/budget-audit/infrastructure/vtex-budget-repository";
import { addWeights } from "@/modules/budget-audit/infrastructure/vtex-catalog-repository";
import { BudgetIntegrationError } from "@/modules/budget-audit/infrastructure/vtex-integration-error";
import { fetchOrderForm } from "@/modules/budget-audit/infrastructure/vtex-order-form-repository";
import { saveComparisonHistory } from "@/modules/budget-audit/history";
import type { ComparisonReport } from "@/modules/budget-audit/presentation/export-report";

export async function POST(request: Request) {
  const body = request.json().catch(() => null);
  const access = await getBudgetAuditPrincipal();
  if (!access.ok)
    return Response.json({ error: access.error }, { status: access.status });
  const parsed = budgetCartRequestSchema.safeParse(
    await body,
  );
  if (!parsed.success)
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  try {
    const env = getServerEnv();
    const [budgetRecord, cartRecord] = await Promise.all([
      fetchBudget(parsed.data.budgetId, env),
      fetchOrderForm(parsed.data.orderForm, env),
    ]);
    const [budget, cart] = await addWeights(
      [toPublicSubject(budgetRecord), cartRecord],
      env,
    );
    if (!budget || !cart)
      throw new BudgetIntegrationError("Dados da comparação ausentes", 502);
    const comparison = compareAuditSubjects(budget, cart);
    const report: ComparisonReport = {
      source: env.USE_VTEX_FIXTURES ? "fixture" : "vtex",
      budgets: [budget, cart],
      comparisons: [comparison],
    };
    const [comparisonId] = await Promise.all([
      saveComparisonHistory(access.principal.id, report),
      recordBudgetAuditUse(access.principal),
    ]);
    return Response.json({
      source: report.source,
      budget,
      cart,
      comparison,
      comparisonId,
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
