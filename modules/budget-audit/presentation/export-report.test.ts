import { describe, expect, it } from "vitest";

import type { ComparisonReport } from "./export-report";
import { serializeComparisonCsv } from "./export-report";

describe("serializeComparisonCsv", () => {
  it("exporta todos os itens e escapa valores para planilhas", () => {
    const budget = (id: string) => ({
      id,
      kind: "budget" as const,
      items: [],
      totals: { subtotal: 100, discount: 0, shipping: 10, tax: null, total: 110 },
      shipping: { deliveryTypes: [], slas: [], value: 10 },
      promotions: [],
      marketingTags: [],
    });
    const report: ComparisonReport = {
      source: "vtex",
      budgets: [budget("BASE"), budget("ATUAL")],
      comparisons: [{
        baselineId: "BASE",
        candidateId: "ATUAL",
        hasDifferences: true,
        totalDelta: 10,
        summary: { added: 1, removed: 0, changed: 1, unchanged: 0 },
        items: ["Produto; especial", 'Produto "solar"'].map((name, index) => ({
          skuId: String(index + 1),
          name,
          type: index ? "added" : "changed",
          impact: "high",
          financialDelta: 5,
          changes: ["totalPrice"],
        })),
        priceBreakdown: [],
        shipping: { postalCodeChanged: false, deliveryTypesChanged: false, slasChanged: false, valueDelta: 0 },
        promotions: [],
        marketingTags: { added: [], removed: [] },
        weight: null,
        warnings: [],
      }],
    };

    const csv = serializeComparisonCsv(report);

    expect(csv.startsWith("\uFEFFOrçamento base;")).toBe(true);
    expect(csv).toContain('"Produto; especial"');
    expect(csv).toContain('"Produto ""solar"""');
    expect(csv.split("\r\n")).toHaveLength(4);
  });
});
