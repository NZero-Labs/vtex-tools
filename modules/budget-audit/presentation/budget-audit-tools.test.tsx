import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BudgetCartTool } from "./budget-cart-tool";
import { ComparisonResults } from "./comparison-report";
import { BudgetVersionsTool } from "./budget-versions-tool";
import type { ComparisonReport } from "./export-report";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

afterEach(() => vi.restoreAllMocks());

describe("ferramentas de auditoria", () => {
  it("apresenta o diagnóstico e oculta itens sem alteração por padrão", async () => {
    const user = userEvent.setup();
    const subject = (id: string) => ({
      id,
      kind: "budget" as const,
      items: [],
      totals: { subtotal: 100, discount: 0, shipping: 0, tax: null, total: 100 },
      shipping: { deliveryTypes: [], slas: [], value: 0 },
      promotions: [],
      marketingTags: [],
    });
    const report: ComparisonReport = {
      source: "vtex",
      budgets: [subject("BASE"), subject("CANDIDATO")],
      comparisons: [{
        baselineId: "BASE",
        candidateId: "CANDIDATO",
        hasDifferences: true,
        totalDelta: 0,
        summary: { added: 0, removed: 0, changed: 1, unchanged: 1 },
        items: [
          { skuId: "1", name: "Produto alterado", type: "changed", impact: "high", financialDelta: 10, changes: ["quantity"] },
          { skuId: "2", name: "Produto igual", type: "unchanged", impact: "none", financialDelta: 0, changes: [] },
        ],
        priceBreakdown: [],
        shipping: { postalCodeChanged: false, deliveryTypesChanged: false, slasChanged: false, valueDelta: 0 },
        promotions: [],
        marketingTags: { added: [], removed: [] },
        weight: null,
        warnings: [],
      }],
    };

    render(<ComparisonResults data={report} onReset={() => undefined} />);

    expect(screen.getByText("Há diferenças para revisar")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Orçamento base × Orçamento comparado" })).toBeInTheDocument();
    expect(screen.queryByText("BASE × CANDIDATO")).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Itens e diferenças" }));
    expect(screen.getAllByText("Produto alterado")).not.toHaveLength(0);
    expect(screen.queryByText("Produto igual")).not.toBeInTheDocument();
  });

  it("orienta a entrada de orçamento e carrinho", () => {
    render(<BudgetCartTool />);
    expect(screen.getByLabelText("Orçamento de referência")).toBeInTheDocument();
    expect(screen.getByLabelText("Carrinho atual")).toBeInTheDocument();
  });

  it("exibe estado vazio quando o orçamento não possui versões", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ budgetId: "101", currentUpdatedAt: null, versions: [] }), { status: 200 }));
    render(<BudgetVersionsTool />);
    await userEvent.type(screen.getByLabelText("Orçamento atual"), "101");
    await userEvent.click(screen.getByRole("button", { name: "Listar versões" }));
    expect(await screen.findByText("Nenhuma versão encontrada")).toBeInTheDocument();
  });
});
