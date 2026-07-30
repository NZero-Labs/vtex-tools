import "server-only";

import type { ServerEnv } from "@/lib/env";
import { normalizeBudget, type NormalizedBudget } from "../domain/budget-comparison";

export class BudgetIntegrationError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
    this.name = "BudgetIntegrationError";
  }
}

const fixtures: Record<string, unknown> = {
  "DEMO-1001": {
    id: "fixture-a",
    idBudget: "DEMO-1001",
    items: [
      { skuId: "31001", productId: "310", name: "Módulo fotovoltaico 550 W", quantity: 12, price: 82_990, sellingPrice: 79_990, totalPrice: 959_880, sellerId: "1", refId: "MOD-550" },
      { skuId: "42002", productId: "420", name: "Inversor solar 6 kW", quantity: 1, price: 438_000, sellingPrice: 420_000, totalPrice: 420_000, sellerId: "1", refId: "INV-6K" },
      { skuId: "53003", productId: "530", name: "Kit de fixação para telhado", quantity: 3, price: 35_000, sellingPrice: 32_000, totalPrice: 96_000, sellerId: "1", refId: "FIX-TEL" },
    ],
    totals: { subtotal: 1_556_000, discount: -80_120, shipping: 35_000, tax: 0, total: 1_510_880 },
    shippingType: "Normal",
    deliveryType: "delivery",
    marketingTags: ["energia-solar"],
  },
  "DEMO-1002": {
    id: "fixture-b",
    idBudget: "DEMO-1002",
    items: [
      { skuId: "31001", productId: "310", name: "Módulo fotovoltaico 550 W", quantity: 14, price: 82_990, sellingPrice: 78_500, totalPrice: 1_099_000, sellerId: "1", refId: "MOD-550" },
      { skuId: "42002", productId: "420", name: "Inversor solar 6 kW", quantity: 1, price: 438_000, sellingPrice: 420_000, totalPrice: 420_000, sellerId: "2", refId: "INV-6K" },
      { skuId: "64004", productId: "640", name: "String box CC", quantity: 1, price: 89_000, sellingPrice: 85_000, totalPrice: 85_000, sellerId: "1", refId: "SB-CC" },
    ],
    totals: { subtotal: 1_689_000, discount: -85_000, shipping: 48_000, tax: 0, total: 1_652_000 },
    shippingType: "Expresso",
    deliveryType: "delivery",
    marketingTags: ["energia-solar", "campanha-julho"],
  },
};

export async function fetchBudget(
  budgetId: string,
  env: ServerEnv,
  fetcher: typeof fetch = fetch,
): Promise<NormalizedBudget> {
  if (env.USE_VTEX_FIXTURES) {
    if (process.env.NODE_ENV === "production") throw new BudgetIntegrationError("Fixtures VTEX não podem ser usadas em produção", 503);
    const fixture = fixtures[budgetId];
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
