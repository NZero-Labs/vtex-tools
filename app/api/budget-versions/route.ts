import { getServerEnv } from "@/lib/env";
import { getBudgetAuditPrincipal, recordBudgetAuditUse } from "@/modules/budget-comparison/data";
import { budgetVersionsRequestSchema, compareBudgets, toPublicSubject } from "@/modules/budget-comparison/domain/budget-comparison";
import { BudgetIntegrationError, fetchBudget } from "@/modules/budget-comparison/infrastructure/vtex-budget-repository";
import { fetchBudgetVersion, fetchBudgetVersions } from "@/modules/budget-comparison/infrastructure/vtex-budget-versions-repository";
import { addWeights } from "@/modules/budget-comparison/infrastructure/vtex-catalog-repository";

export async function POST(request: Request) {
  const access = await getBudgetAuditPrincipal();
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const parsed = budgetVersionsRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  try {
    const env = getServerEnv();
    const currentRecord = await fetchBudget(parsed.data.budgetId, env);
    if (!currentRecord.documentId) throw new BudgetIntegrationError("O orçamento não possui um documento de origem", 502);
    if (parsed.data.action === "list") {
      const versions = await fetchBudgetVersions(parsed.data.budgetId, currentRecord.documentId, env);
      return Response.json({ budgetId: parsed.data.budgetId, currentUpdatedAt: currentRecord.updatedAt ?? null, versions });
    }
    const versionId = parsed.data.versionId;
    const versionRecord = await fetchBudgetVersion(parsed.data.budgetId, currentRecord.documentId, versionId, env);
    const [current, version] = await addWeights([toPublicSubject(currentRecord), toPublicSubject(versionRecord)], env);
    if (!current || !version) throw new BudgetIntegrationError("Dados da comparação ausentes", 502);
    const versions = await fetchBudgetVersions(parsed.data.budgetId, currentRecord.documentId, env);
    const versionMetadata = versions.find((item) => item.id === versionId) ?? { id: versionId, author: "Autor não informado", date: null };
    await recordBudgetAuditUse(access.principal);
    return Response.json({ source: env.USE_VTEX_FIXTURES ? "fixture" : "vtex", current, version, comparison: compareBudgets(current, version), versionMetadata });
  } catch (error) {
    if (error instanceof BudgetIntegrationError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Não foi possível consultar as versões." }, { status: 500 });
  }
}
