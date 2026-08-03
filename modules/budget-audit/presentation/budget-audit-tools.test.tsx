import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BudgetCartTool } from "./budget-cart-tool";
import { ComparisonResults } from "./comparison-report";
import { BudgetVersionsTool } from "./budget-versions-tool";
import type { ComparisonReport } from "./export-report";

afterEach(() => vi.restoreAllMocks());

describe("ferramentas de auditoria", () => {
  it("apresenta o diagnóstico e oculta itens sem alteração por padrão", () => {
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

    expect(screen.getByText("Há divergências")).toBeInTheDocument();
    expect(screen.getAllByText("Produto alterado")).not.toHaveLength(0);
    expect(screen.queryByText("Produto igual")).not.toBeInTheDocument();
  });

  it("orienta a entrada de orçamento e OrderForm", () => {
    render(<BudgetCartTool />);
    expect(screen.getByLabelText("Orçamento")).toBeInTheDocument();
    expect(screen.getByLabelText("ID ou URL do carrinho")).toBeInTheDocument();
  });

  it("exibe estado vazio quando o orçamento não possui versões", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ budgetId: "101", currentUpdatedAt: null, versions: [] }), { status: 200 }));
    render(<BudgetVersionsTool />);
    await userEvent.type(screen.getByLabelText("Orçamento atual"), "101");
    await userEvent.click(screen.getByRole("button", { name: "Listar versões" }));
    expect(await screen.findByText("Nenhuma versão encontrada")).toBeInTheDocument();
  });
});
