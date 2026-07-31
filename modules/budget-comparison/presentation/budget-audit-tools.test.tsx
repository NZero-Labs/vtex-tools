import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BudgetCartTool } from "./budget-cart-tool";
import { BudgetVersionsTool } from "./budget-versions-tool";

afterEach(() => vi.restoreAllMocks());

describe("ferramentas de auditoria", () => {
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
