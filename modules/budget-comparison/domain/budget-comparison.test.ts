import { describe, expect, it } from "vitest";

import {
  budgetRequestSchema,
  compareBudgets,
  normalizeBudget,
  normalizeOrderForm,
  normalizeSla,
  toPublicSubject,
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

  it("mantém identificador interno somente no registro do servidor", () => {
    const budget = normalizeBudget(rawBudget("101"), 100);

    expect(budget.documentId).toBe("document-101");
    expect(toPublicSubject(budget)).not.toHaveProperty("documentId");
  });
});

describe("normalizeOrderForm", () => {
  it("normaliza centavos, todos os SLAs, tags e promoções sem inventar valores", () => {
    const cart = normalizeOrderForm({
      orderFormId: "order-form-12345",
      items: [{ id: "SKU-1", name: "Módulo", quantity: 2, price: 10_000, sellingPrice: 9_000, seller: "1", priceTags: [] }],
      totalizers: [{ id: "Items", value: 18_000 }, { id: "Shipping", value: 1_000 }],
      value: 19_000,
      shippingData: {
        address: { postalCode: "01310-100", street: "não serializar" },
        logisticsInfo: [
          { selectedSla: "AMARANZ LOGISTICA CAJ/FSA", selectedDeliveryChannel: "delivery" },
          { selectedSla: "FOB LOGISTICA CAJ/FSA", selectedDeliveryChannel: "delivery" },
        ],
      },
      marketingData: { marketingTags: ["Solar"] },
      ratesAndBenefitsData: { rateAndBenefitsIdentifiers: [{ id: "promo-1", name: "Benefício sem valor" }] },
    });

    expect(cart.items[0]).toMatchObject({ quantity: 2, sellingPrice: 90, totalPrice: 180 });
    expect(cart.shipping).toEqual({ postalCode: "01310-100", deliveryTypes: ["delivery"], slas: ["PDO/CIF", "PDO/FOB"], value: 10 });
    expect(cart.promotions).toEqual([{ id: "promo-1", name: "Benefício sem valor", value: null }]);
    expect(cart.marketingTags).toEqual(["solar"]);
    expect(cart).not.toHaveProperty("clientProfileData");
  });

  it("preserva SLA desconhecido", () => {
    expect(normalizeSla("Transportadora regional")).toBe("Transportadora regional");
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

  it("compara logística, promoções, tags, preço e peso parcial", () => {
    const baseline = { ...normalizeBudget(rawBudget("101"), 100), weight: { totalKg: 10, complete: true, missingSkuIds: [] } };
    const candidate = {
      ...normalizeBudget(rawBudget("102", { postalCode: "99999-999", shippingType: "Expresso", marketingTags: ["nova"] }), 100),
      promotions: [{ id: "promo", name: "Promoção", value: null }],
      weight: { totalKg: 12, complete: false, missingSkuIds: ["SKU-1"] },
    };

    const result = compareBudgets(baseline, candidate);

    expect(result.shipping).toMatchObject({ postalCodeChanged: true, slasChanged: true });
    expect(result.marketingTags.added).toEqual(["nova"]);
    expect(result.promotions[0]).toMatchObject({ status: "added", candidateValue: null });
    expect(result.weight).toMatchObject({ deltaKg: null, complete: false });
    expect(result.warnings).toHaveLength(2);
  });
});
