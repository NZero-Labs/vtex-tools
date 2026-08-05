import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { ServerEnv } from "@/lib/env";
import { fetchBudget } from "./vtex-budget-repository";
import type { BudgetIntegrationError } from "./vtex-integration-error";

const env: ServerEnv = {
  BETTER_AUTH_URL: "http://localhost:3000",
  BETTER_AUTH_SECRET: "development-only-secret-at-least-32-characters",
  NEON_BRANCH: "test",
  DATABASE_URL: "postgresql://localhost/test",
  VTEX_ACCOUNT: "amara",
  VTEX_ENVIRONMENT: "vtexcommercestable",
  VTEX_APP_KEY: "app-key",
  VTEX_APP_TOKEN: "app-token",
  VTEX_BUDGET_ENTITY: "budget",
  VTEX_MONEY_SCALE: 100,
  VTEX_TIMEOUT_MS: 1_000,
  USE_VTEX_FIXTURES: false,
  AZURE_CLIENT_ID: "test-client",
  AZURE_CLIENT_SECRET: "test-secret",
  AZURE_REDIRECT_URI: "http://localhost:3000/api/auth/callback/microsoft",
  AZURE_TENANT_ID: "common",
};

describe("fetchBudget", () => {
  it("monta a consulta autenticada e valida a resposta", async () => {
    let requestedUrl = "";
    let requestedKey = "";
    const fetcher: typeof fetch = async (input, init) => {
      requestedUrl = String(input);
      requestedKey = new Headers(init?.headers).get("X-VTEX-API-AppKey") ?? "";
      return new Response(JSON.stringify([{ id: "doc", idBudget: "A 1", items: [], totals: { total: 10_000 } }]), { status: 200 });
    };

    const budget = await fetchBudget("A 1", env, fetcher);

    expect(requestedUrl).toContain("_where=idBudget%3DA+1");
    expect(requestedKey).toBe("app-key");
    expect(budget.totals.total).toBe(100);
  });

  it("recusa configuração incompleta sem realizar a requisição", async () => {
    const fetcher = vi.fn();
    const promise = fetchBudget("101", { ...env, VTEX_APP_TOKEN: undefined }, fetcher);

    await expect(promise).rejects.toMatchObject({ status: 503 } satisfies Partial<BudgetIntegrationError>);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("transforma payload externo inválido em erro seguro", async () => {
    const fetcher: typeof fetch = async () => new Response(JSON.stringify([{ idBudget: "101" }]), { status: 200 });

    await expect(fetchBudget("101", env, fetcher)).rejects.toMatchObject({
      message: "O orçamento 101 retornou dados incompletos",
    } satisfies Partial<BudgetIntegrationError>);
  });

  it("explica quando a entidade configurada não possui idBudget", async () => {
    const fetcher: typeof fetch = async () => new Response(null, { status: 400 });

    await expect(fetchBudget("101", env, fetcher)).rejects.toMatchObject({
      message: "A entidade VTEX configurada não possui o campo idBudget",
      status: 503,
    } satisfies Partial<BudgetIntegrationError>);
  });
});
