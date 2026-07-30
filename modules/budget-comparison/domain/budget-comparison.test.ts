import { describe, expect, it } from "vitest";

import {
  budgetRequestSchema,
  compareBudgets,
  normalizeBudget,
} from "./budget-comparison";

const rawBudget = (idBudget: string, overrides: Record<string, unknown> = {}) => ({
  id: `document-${idBudget}`,
  idBudget,
  items: [
    {
      skuId: "SKU-1",
      productId: "PRODUCT-1",
      name: "Módulo solar",
      quantity: 2,
      price: 10_000,
      sellingPrice: 9_000,
      totalPrice: 18_000,
      sellerId: "1",
    },
  ],
  totals: {
    subtotal: 20_000,
    discount: -2_000,
    shipping: 1_000,
    tax: 0,
    total: 19_000,
  },
  shippingType: "Normal",
  deliveryType: "delivery",
  ...overrides,
});

describe("budgetRequestSchema", () => {
  it("aceita entre dois e cinco identificadores únicos", () => {
    expect(budgetRequestSchema.parse({ budgetIds: [" 101 ", "102"] })).toEqual({
      budgetIds: ["101", "102"],
    });
    expect(() => budgetRequestSchema.parse({ budgetIds: ["101", "101"] })).toThrow();
    expect(() => budgetRequestSchema.parse({ budgetIds: ["101"] })).toThrow();
  });
});

describe("normalizeBudget", () => {
  it("usa a escala explícita e consolida SKUs repetidos", () => {
    const budget = normalizeBudget(
      rawBudget("101", {
        items: [
          rawBudget("101").items[0],
          { ...rawBudget("101").items[0], quantity: 1, totalPrice: 9_000 },
        ],
      }),
      100,
    );

    expect(budget.items).toHaveLength(1);
    expect(budget.items[0]).toMatchObject({
      skuId: "SKU-1",
      quantity: 3,
      listPrice: 100,
      sellingPrice: 90,
      totalPrice: 270,
    });
    expect(budget.totals.total).toBe(190);
  });

  it("rejeita payloads incompletos na fronteira da integração", () => {
    expect(() => normalizeBudget({ idBudget: "101" }, 100)).toThrow();
    expect(() => normalizeBudget(rawBudget("101"), 0)).toThrow();
  });

  it("preserva totalizações ausentes como não informadas", () => {
    const budget = normalizeBudget(rawBudget("101", { totals: { total: 19_000 } }), 100);

    expect(budget.totals).toMatchObject({ subtotal: null, discount: null, shipping: null, tax: null, total: 190 });
  });

  it("aceita o formato real do Master Data com totais no nível raiz e opcionais nulos", () => {
    const budget = normalizeBudget({
      id: "document-101",
      idBudget: 101,
      items: [{ skuId: "SKU-1", name: "Módulo solar", quantity: 2, price: 10_000, sellingPrice: 9_000 }],
      subtotal: 20_000,
      discounts: 2_000,
      shipping: 1_000,
      total: 19_000,
      shippingDeliveryValue: null,
      marketingTags: null,
    }, 100);

    expect(budget.totals).toEqual({ subtotal: 200, discount: 20, shipping: 10, tax: null, total: 190 });
    expect(budget.marketingTags).toEqual([]);
  });
});

describe("compareBudgets", () => {
  it("identifica itens adicionados, removidos e alterados", () => {
    const baseline = normalizeBudget(
      rawBudget("101", {
        items: [
          rawBudget("101").items[0],
          {
            skuId: "REMOVED",
            name: "Item removido",
            quantity: 1,
            price: 5_000,
            sellingPrice: 5_000,
            totalPrice: 5_000,
            sellerId: "1",
          },
        ],
      }),
      100,
    );
    const candidate = normalizeBudget(
      rawBudget("102", {
        items: [
          { ...rawBudget("102").items[0], quantity: 3, totalPrice: 27_000 },
          {
            skuId: "ADDED",
            name: "Item adicionado",
            quantity: 1,
            price: 7_000,
            sellingPrice: 7_000,
            totalPrice: 7_000,
            sellerId: "2",
          },
        ],
      }),
      100,
    );

    const result = compareBudgets(baseline, candidate);

    expect(result.summary).toMatchObject({ added: 1, removed: 1, changed: 1 });
    expect(result.items.find((item) => item.skuId === "SKU-1")).toMatchObject({
      type: "changed",
      financialDelta: 90,
    });
    expect(result.hasDifferences).toBe(true);
  });

  it("considera alteração somente de quantidade como divergência com impacto", () => {
    const baseline = normalizeBudget(rawBudget("101"), 100);
    const candidate = normalizeBudget(
      rawBudget("102", {
        items: [{ ...rawBudget("102").items[0], quantity: 3, totalPrice: 27_000 }],
      }),
      100,
    );

    const difference = compareBudgets(baseline, candidate).items[0];

    expect(difference).toBeDefined();
    if (!difference) throw new Error("A comparação deveria conter o SKU informado");
    expect(difference.type).toBe("changed");
    expect(difference.changes).toContain("quantity");
    expect(difference.impact).not.toBe("none");
  });
});
