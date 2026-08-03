import { describe, expect, it } from "vitest";

import type { ServerEnv } from "@/lib/env";
import { fetchBudgetVersion, fetchBudgetVersions } from "./vtex-budget-versions-repository";

const env = { VTEX_ACCOUNT: "amara", VTEX_ENVIRONMENT: "vtexcommercestable", VTEX_APP_KEY: "key", VTEX_APP_TOKEN: "token", VTEX_BUDGET_ENTITY: "BD", VTEX_MONEY_SCALE: 100, VTEX_TIMEOUT_MS: 1_000, USE_VTEX_FIXTURES: false } as ServerEnv;

describe("repositório de versões", () => {
  it("aceita metadados alternativos da lista", async () => {
    const fetcher: typeof fetch = async () => new Response(JSON.stringify([{ id: 7, createdBy: "autor@amara.com.br", createdIn: "2026-01-01T00:00:00Z" }]), { status: 200 });

    await expect(fetchBudgetVersions("101", "doc", env, fetcher)).resolves.toEqual([{ id: "7", author: "autor@amara.com.br", date: "2026-01-01T00:00:00Z" }]);
  });

  it("normaliza resposta wrapper e resposta direta", async () => {
    const raw = { id: "doc", idBudget: "101", items: [], totals: { total: 10_000 } };
    const wrapped: typeof fetch = async () => new Response(JSON.stringify({ document: raw }), { status: 200 });
    const direct: typeof fetch = async () => new Response(JSON.stringify(raw), { status: 200 });

    await expect(fetchBudgetVersion("101", "doc", "v1", env, wrapped)).resolves.toMatchObject({ id: "101", kind: "version" });
    await expect(fetchBudgetVersion("101", "doc", "v1", env, direct)).resolves.toMatchObject({ id: "101", kind: "version" });
  });
});
