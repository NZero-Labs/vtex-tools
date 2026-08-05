export const budgetFixtures = {
  "DEMO-1001": {
    id: "fixture-a",
    idBudget: "DEMO-1001",
    items: [
      { skuId: "31001", productId: "310", name: "Módulo fotovoltaico 550 W", quantity: 12, price: 82_990, sellingPrice: 79_990, totalPrice: 959_880, sellerId: "1", refId: "MOD-550" },
      { skuId: "42002", productId: "420", name: "Inversor solar 6 kW", quantity: 1, price: 438_000, sellingPrice: 420_000, totalPrice: 420_000, sellerId: "1", refId: "INV-6K" },
      { skuId: "53003", productId: "530", name: "Kit de fixação para telhado", quantity: 3, price: 35_000, sellingPrice: 32_000, totalPrice: 96_000, sellerId: "1", refId: "FIX-TEL" },
    ],
    totals: { subtotal: 1_556_000, discount: -80_120, shipping: 35_000, tax: 0, total: 1_510_880 },
    shippingType: "AMARANZ LOGISTICA CAJ/FSA",
    deliveryType: "delivery",
    postalCode: "01310-100",
    updatedAt: "2026-07-30T14:00:00.000Z",
    marketingTags: ["energia-solar"],
  },
  "DEMO-1002": {
    id: "fixture-b",
    idBudget: "DEMO-1002",
    items: [
      { skuId: "31001", productId: "310", name: "Módulo fotovoltaico 550 W", quantity: 14, price: 82_990, sellingPrice: 78_500, totalPrice: 1_099_000, sellerId: "1", refId: "MOD-550" },
      { skuId: "42002", productId: "420", name: "Inversor solar 6 kW", quantity: 1, price: 438_000, sellingPrice: 420_000, totalPrice: 420_000, sellerId: "2", refId: "INV-6K" },
      { skuId: "64004", productId: "640", name: "String box CC", quantity: 1, price: 89_000, sellingPrice: 85_000, totalPrice: 85_000, sellerId: "1", refId: "SB-CC" },
    ],
    totals: { subtotal: 1_689_000, discount: -85_000, shipping: 48_000, tax: 0, total: 1_652_000 },
    shippingType: "EXP LOGISTICA CAJ/FSA",
    deliveryType: "delivery",
    postalCode: "01310-100",
    updatedAt: "2026-07-31T14:00:00.000Z",
    marketingTags: ["energia-solar", "campanha-julho"],
  },
} satisfies Record<string, unknown>;

export function getBudgetFixture(budgetId: string): unknown {
  if (budgetId === "DEMO-1001" || budgetId === "DEMO-1002") {
    return budgetFixtures[budgetId];
  }
  return undefined;
}
