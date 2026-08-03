import "server-only";

import { z } from "zod";

import type { ServerEnv } from "@/lib/env";
import type { BudgetRecord } from "../domain/subject";
import { normalizeBudget } from "./normalize-vtex-subjects";
import { budgetFixtures } from "./vtex-budget-fixtures";
import { BudgetIntegrationError } from "./vtex-integration-error";

const versionSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  author: z.string().nullish(),
  date: z.string().nullish(),
  createdBy: z.string().nullish(),
  createdIn: z.string().nullish(),
}).passthrough().transform((value) => ({ id: value.id, author: value.author ?? value.createdBy ?? "Autor não informado", date: value.date ?? value.createdIn ?? null }));

export type BudgetVersion = z.infer<typeof versionSchema>;

const fixtureVersions: Record<string, Array<{ metadata: BudgetVersion; document: unknown }>> = {
  "DEMO-1001": [
    {
      metadata: { id: "demo-v1", author: "demo@amara.com.br", date: "2026-07-20T12:00:00.000Z" },
      document: {
        ...budgetFixtures["DEMO-1001"],
        items: [
          { skuId: "31001", productId: "310", name: "Módulo fotovoltaico 550 W", quantity: 10, price: 82_990, sellingPrice: 81_000, totalPrice: 810_000, sellerId: "1" },
          { skuId: "42002", productId: "420", name: "Inversor solar 6 kW", quantity: 1, price: 438_000, sellingPrice: 425_000, totalPrice: 425_000, sellerId: "1" },
        ],
        totals: { subtotal: 1_267_900, discount: -32_900, shipping: 30_000, total: 1_265_000 },
      },
    },
  ],
};

function headers(env: ServerEnv) {
  return { "X-VTEX-API-AppKey": env.VTEX_APP_KEY!, "X-VTEX-API-AppToken": env.VTEX_APP_TOKEN! };
}

function baseUrl(documentId: string, env: ServerEnv) {
  return `https://${env.VTEX_ACCOUNT}.${env.VTEX_ENVIRONMENT}.com.br/api/dataentities/${env.VTEX_BUDGET_ENTITY}/documents/${encodeURIComponent(documentId)}/versions`;
}

export async function fetchBudgetVersions(budgetId: string, documentId: string, env: ServerEnv, fetcher: typeof fetch = fetch) {
  if (env.USE_VTEX_FIXTURES) return fixtureVersions[budgetId]?.map((item) => item.metadata) ?? [];
  if (!env.VTEX_ACCOUNT || !env.VTEX_APP_KEY || !env.VTEX_APP_TOKEN) throw new BudgetIntegrationError("A integração VTEX não está configurada", 503);
  let response: Response;
  try {
    response = await fetcher(baseUrl(documentId, env), { headers: headers(env), cache: "no-store", signal: AbortSignal.timeout(env.VTEX_TIMEOUT_MS) });
  } catch {
    throw new BudgetIntegrationError("A VTEX não respondeu dentro do tempo esperado", 504);
  }
  if (response.status === 404) return [];
  if (!response.ok) throw new BudgetIntegrationError("Não foi possível listar as versões do orçamento");
  const parsed = z.array(versionSchema).safeParse(await response.json());
  if (!parsed.success) throw new BudgetIntegrationError("A VTEX retornou uma lista de versões inválida");
  return parsed.data;
}

export async function fetchBudgetVersion(budgetId: string, documentId: string, versionId: string, env: ServerEnv, fetcher: typeof fetch = fetch): Promise<BudgetRecord> {
  let payload: unknown;
  if (env.USE_VTEX_FIXTURES) {
    const version = fixtureVersions[budgetId]?.find((item) => item.metadata.id === versionId);
    if (!version) throw new BudgetIntegrationError(`Versão ${versionId} não encontrada`, 404);
    payload = version.document;
  } else {
    if (!env.VTEX_ACCOUNT || !env.VTEX_APP_KEY || !env.VTEX_APP_TOKEN) throw new BudgetIntegrationError("A integração VTEX não está configurada", 503);
    let response: Response;
    try {
      response = await fetcher(`${baseUrl(documentId, env)}/${encodeURIComponent(versionId)}`, { headers: headers(env), cache: "no-store", signal: AbortSignal.timeout(env.VTEX_TIMEOUT_MS) });
    } catch {
      throw new BudgetIntegrationError("A VTEX não respondeu dentro do tempo esperado", 504);
    }
    if (response.status === 404) throw new BudgetIntegrationError(`Versão ${versionId} não encontrada`, 404);
    if (!response.ok) throw new BudgetIntegrationError("Não foi possível consultar a versão do orçamento");
    payload = await response.json();
  }
  const document = payload && typeof payload === "object" && "document" in payload ? (payload as { document: unknown }).document : payload;
  try {
    return normalizeBudget(document, env.VTEX_MONEY_SCALE, "version");
  } catch {
    throw new BudgetIntegrationError(`A versão ${versionId} retornou dados incompletos`);
  }
}
