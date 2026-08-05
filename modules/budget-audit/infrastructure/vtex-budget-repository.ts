import "server-only";

import type { ServerEnv } from "@/lib/env";
import type { BudgetRecord } from "../domain/subject";
import { getBudgetFixture } from "./vtex-budget-fixtures";
import { BudgetIntegrationError } from "./vtex-integration-error";
import { normalizeBudget } from "./normalize-vtex-subjects";

export async function fetchBudget(
  budgetId: string,
  env: ServerEnv,
  fetcher: typeof fetch = fetch,
): Promise<BudgetRecord> {
  if (env.USE_VTEX_FIXTURES) {
    if (process.env.NODE_ENV === "production") throw new BudgetIntegrationError("Fixtures VTEX não podem ser usadas em produção", 503);
    const fixture = getBudgetFixture(budgetId);
    if (!fixture) throw new BudgetIntegrationError(`Orçamento ${budgetId} não encontrado nas fixtures`, 404);
    return normalizeBudget(fixture, env.VTEX_MONEY_SCALE);
  }

  if (!env.VTEX_ACCOUNT || !env.VTEX_APP_KEY || !env.VTEX_APP_TOKEN) {
    throw new BudgetIntegrationError("A integração VTEX não está configurada", 503);
  }

  const url = new URL(`https://${env.VTEX_ACCOUNT}.${env.VTEX_ENVIRONMENT}.com.br/api/dataentities/${env.VTEX_BUDGET_ENTITY}/search`);
  url.searchParams.set("_where", `idBudget=${budgetId}`);
  url.searchParams.set("_fields", "_all");

  let response: Response;
  try {
    response = await fetcher(url, {
      headers: { "X-VTEX-API-AppKey": env.VTEX_APP_KEY, "X-VTEX-API-AppToken": env.VTEX_APP_TOKEN },
      cache: "no-store",
      signal: AbortSignal.timeout(env.VTEX_TIMEOUT_MS),
    });
  } catch {
    throw new BudgetIntegrationError("A VTEX não respondeu dentro do tempo esperado", 504);
  }

  if (response.status === 400) throw new BudgetIntegrationError("A entidade VTEX configurada não possui o campo idBudget", 503);
  if (response.status === 401 || response.status === 403) throw new BudgetIntegrationError("As credenciais VTEX não têm acesso aos orçamentos", 503);
  if (response.status === 404) throw new BudgetIntegrationError(`Orçamento ${budgetId} não encontrado`, 404);
  if (!response.ok) throw new BudgetIntegrationError("Não foi possível consultar a VTEX");

  const payload: unknown = await response.json();
  if (!Array.isArray(payload) || !payload[0]) throw new BudgetIntegrationError(`Orçamento ${budgetId} não encontrado`, 404);

  try {
    return normalizeBudget(payload[0], env.VTEX_MONEY_SCALE);
  } catch {
    throw new BudgetIntegrationError(`O orçamento ${budgetId} retornou dados incompletos`);
  }
}
