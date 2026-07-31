import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  access: vi.fn(),
  record: vi.fn(),
  fetchBudget: vi.fn(),
  fetchVersion: vi.fn(),
  fetchVersions: vi.fn(),
}));

vi.mock("@/modules/budget-comparison/data", () => ({ getBudgetAuditPrincipal: mocks.access, recordBudgetAuditUse: mocks.record }));
vi.mock("@/lib/env", () => ({ getServerEnv: () => ({ VTEX_MONEY_SCALE: 100, USE_VTEX_FIXTURES: true }) }));
vi.mock("@/modules/budget-comparison/infrastructure/vtex-budget-repository", async () => {
  const actual = await vi.importActual<typeof import("@/modules/budget-comparison/infrastructure/vtex-budget-repository")>("@/modules/budget-comparison/infrastructure/vtex-budget-repository");
  return { ...actual, fetchBudget: mocks.fetchBudget };
});
vi.mock("@/modules/budget-comparison/infrastructure/vtex-budget-versions-repository", () => ({ fetchBudgetVersion: mocks.fetchVersion, fetchBudgetVersions: mocks.fetchVersions }));
vi.mock("@/modules/budget-comparison/infrastructure/vtex-catalog-repository", () => ({ addWeights: (subjects: unknown[]) => subjects }));

import { POST } from "./route";

const subject = { id: "101", kind: "budget" as const, items: [], totals: { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 }, shipping: { deliveryTypes: [], slas: [], value: 0 }, promotions: [], marketingTags: [] };

describe("POST /api/budget-versions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.access.mockResolvedValue({ ok: true, principal: { id: "user" } });
    mocks.fetchBudget.mockResolvedValue({ ...subject, documentId: "server-document" });
    mocks.fetchVersion.mockResolvedValue({ ...subject, kind: "version" });
    mocks.fetchVersions.mockResolvedValue([]);
  });

  it("nega a requisição antes de acessar a integração", async () => {
    mocks.access.mockResolvedValueOnce({ ok: false, status: 401, error: "Sessão expirada" });
    const response = await POST(new Request("http://localhost/api/budget-versions", { method: "POST", body: JSON.stringify({ action: "list", budgetId: "101" }) }));

    expect(response.status).toBe(401);
    expect(mocks.fetchBudget).not.toHaveBeenCalled();
  });

  it("ignora documentId enviado pelo cliente e usa o derivado do orçamento", async () => {
    const response = await POST(new Request("http://localhost/api/budget-versions", { method: "POST", body: JSON.stringify({ action: "compare", budgetId: "101", versionId: "v1", documentId: "attacker-document" }) }));

    expect(response.status).toBe(200);
    expect(mocks.fetchVersion).toHaveBeenCalledWith("101", "server-document", "v1", expect.anything());
    expect(await response.text()).not.toContain("server-document");
  });
});
