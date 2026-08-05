import { getServerEnv } from "@/lib/env";
import {
  getBudgetAuditPrincipal,
  recordBudgetAuditUse,
} from "@/modules/budget-audit/data";
import { compareAuditSubjects } from "@/modules/budget-audit/domain/compare-subjects";
import { budgetVersionsRequestSchema } from "@/modules/budget-audit/domain/requests";
import { toPublicSubject } from "@/modules/budget-audit/domain/subject";
import { fetchBudget } from "@/modules/budget-audit/infrastructure/vtex-budget-repository";
import { BudgetIntegrationError } from "@/modules/budget-audit/infrastructure/vtex-integration-error";
import {
  fetchBudgetVersion,
  fetchBudgetVersions,
} from "@/modules/budget-audit/infrastructure/vtex-budget-versions-repository";
import { addWeights } from "@/modules/budget-audit/infrastructure/vtex-catalog-repository";
import { saveComparisonHistory } from "@/modules/budget-audit/history";
import type { ComparisonReport } from "@/modules/budget-audit/presentation/export-report";

export async function POST(request: Request) {
  const body = request.json().catch(() => null);
  const access = await getBudgetAuditPrincipal();
  if (!access.ok)
    return Response.json({ error: access.error }, { status: access.status });
  const parsed = budgetVersionsRequestSchema.safeParse(
    await body,
  );
  if (!parsed.success)
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  try {
    const env = getServerEnv();
    const currentRecord = await fetchBudget(parsed.data.budgetId, env);
    if (!currentRecord.documentId)
      throw new BudgetIntegrationError(
        "O orçamento não possui um documento de origem",
        502,
      );
    if (parsed.data.action === "list") {
      const versions = await fetchBudgetVersions(
        parsed.data.budgetId,
        currentRecord.documentId,
        env,
      );
      return Response.json({
        budgetId: parsed.data.budgetId,
        currentUpdatedAt: currentRecord.updatedAt ?? null,
        versions,
      });
    }
    const versionId = parsed.data.versionId;
    const [versionRecord, versions] = await Promise.all([
      fetchBudgetVersion(
        parsed.data.budgetId,
        currentRecord.documentId,
        versionId,
        env,
      ),
      fetchBudgetVersions(parsed.data.budgetId, currentRecord.documentId, env),
    ]);
    const [current, version] = await addWeights(
      [toPublicSubject(currentRecord), toPublicSubject(versionRecord)],
      env,
    );
    if (!current || !version)
      throw new BudgetIntegrationError("Dados da comparação ausentes", 502);
    const versionMetadata = versions.find((item) => item.id === versionId) ?? {
      id: versionId,
      author: "Autor não informado",
      date: null,
    };
    const comparison = compareAuditSubjects(current, version);
    const report: ComparisonReport = {
      source: env.USE_VTEX_FIXTURES ? "fixture" : "vtex",
      budgets: [current, version],
      comparisons: [comparison],
    };
    const [comparisonId] = await Promise.all([
      saveComparisonHistory(access.principal.id, report),
      recordBudgetAuditUse(access.principal),
    ]);
    return Response.json({
      source: report.source,
      current,
      version,
      comparison,
      versionMetadata,
      comparisonId,
    });
  } catch (error) {
    if (error instanceof BudgetIntegrationError)
      return Response.json({ error: error.message }, { status: error.status });
    return Response.json(
      { error: "Não foi possível consultar as versões." },
      { status: 500 },
    );
  }
}
