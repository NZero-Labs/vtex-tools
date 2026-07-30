import { z } from "zod";

const moneySchema = z.union([z.number(), z.string()]).transform((value, context) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    context.addIssue({ code: "custom", message: "Valor monetário inválido" });
    return z.NEVER;
  }
  return number;
});

const optionalMoneySchema = moneySchema.nullish().transform((value) => value ?? undefined);

const optionalText = z
  .union([z.string(), z.number()])
  .nullable()
  .transform((value) => (value == null ? undefined : String(value).trim() || undefined))
  .optional();

const rawItemSchema = z
  .object({
    skuId: z.union([z.string(), z.number()]).transform(String),
    productId: optionalText,
    name: z.string().trim().min(1),
    quantity: z.coerce.number().int().nonnegative(),
    price: moneySchema.optional(),
    sellingPrice: moneySchema,
    totalPrice: moneySchema.optional(),
    sellerId: optionalText,
    refId: optionalText,
    imageUrl: optionalText,
  })
  .passthrough();

const rawTotalsSchema = z
  .object({
    subtotal: optionalMoneySchema,
    discount: optionalMoneySchema,
    shipping: optionalMoneySchema,
    tax: optionalMoneySchema,
    total: optionalMoneySchema,
  });

const rawBudgetSchema = z
  .object({
    id: optionalText,
    idBudget: z.union([z.string(), z.number()]).transform(String),
    items: z.array(rawItemSchema),
    totals: rawTotalsSchema.nullish(),
    subtotal: optionalMoneySchema,
    discounts: optionalMoneySchema,
    shipping: optionalMoneySchema,
    tax: optionalMoneySchema,
    total: optionalMoneySchema,
    itemsValue: optionalMoneySchema,
    shippingDeliveryValue: optionalMoneySchema,
    shippingType: optionalText,
    deliveryType: optionalText,
    marketingTags: z.array(z.string()).nullish().transform((value) => value ?? []),
  })
  .passthrough();

export const budgetRequestSchema = z
  .object({
    budgetIds: z
      .array(z.string().trim().min(1, "Informe o identificador do orçamento").max(100, "Identificador muito longo"))
      .min(2, "Informe pelo menos dois orçamentos")
      .max(5, "Compare no máximo cinco orçamentos"),
  })
  .superRefine(({ budgetIds }, context) => {
    if (new Set(budgetIds).size !== budgetIds.length) {
      context.addIssue({ code: "custom", path: ["budgetIds"], message: "Os orçamentos devem ser únicos" });
    }
  });

export type Impact = "critical" | "high" | "medium" | "low" | "none";
export type DifferenceType = "added" | "removed" | "changed" | "unchanged";

export type BudgetItem = {
  skuId: string;
  productId?: string;
  name: string;
  quantity: number;
  listPrice: number;
  sellingPrice: number;
  totalPrice: number;
  sellerIds: string[];
  refId?: string;
  imageUrl?: string;
};

export type NormalizedBudget = {
  id: string;
  documentId?: string;
  items: BudgetItem[];
  totals: {
    subtotal: number | null;
    discount: number | null;
    shipping: number | null;
    tax: number | null;
    total: number;
  };
  shippingType?: string;
  deliveryType?: string;
  marketingTags: string[];
};

export type ItemDifference = {
  skuId: string;
  name: string;
  type: DifferenceType;
  impact: Impact;
  financialDelta: number;
  changes: Array<"quantity" | "listPrice" | "sellingPrice" | "totalPrice" | "seller">;
  baseline?: BudgetItem;
  candidate?: BudgetItem;
};

export type BudgetComparison = {
  baselineId: string;
  candidateId: string;
  hasDifferences: boolean;
  summary: Record<DifferenceType, number>;
  totalDelta: number;
  items: ItemDifference[];
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function normalizeBudget(input: unknown, moneyScale: number): NormalizedBudget {
  if (!Number.isFinite(moneyScale) || moneyScale <= 0) throw new Error("Escala monetária inválida");

  const raw = rawBudgetSchema.parse(input);
  const total = raw.totals?.total ?? raw.total;
  if (total === undefined) throw new Error("Total do orçamento ausente");
  const items = new Map<string, BudgetItem>();

  for (const item of raw.items) {
    const current = items.get(item.skuId);
    const quantity = (current?.quantity ?? 0) + item.quantity;
    const totalPrice = roundMoney(
      (current?.totalPrice ?? 0) + (item.totalPrice ?? item.sellingPrice * item.quantity) / moneyScale,
    );
    const sellerIds = new Set([...(current?.sellerIds ?? []), ...(item.sellerId ? [item.sellerId] : [])]);

    items.set(item.skuId, {
      skuId: item.skuId,
      productId: item.productId ?? current?.productId,
      name: item.name,
      quantity,
      listPrice: roundMoney((item.price ?? item.sellingPrice) / moneyScale),
      sellingPrice: quantity ? roundMoney(totalPrice / quantity) : roundMoney(item.sellingPrice / moneyScale),
      totalPrice,
      sellerIds: [...sellerIds].sort(),
      refId: item.refId ?? current?.refId,
      imageUrl: item.imageUrl ?? current?.imageUrl,
    });
  }

  const money = (value: number) => roundMoney(value / moneyScale);
  const optionalMoney = (value: number | undefined) => value === undefined ? null : money(value);

  return {
    id: raw.idBudget,
    documentId: raw.id,
    items: [...items.values()].sort((left, right) => left.name.localeCompare(right.name, "pt-BR")),
    totals: {
      subtotal: optionalMoney(raw.totals?.subtotal ?? raw.subtotal ?? raw.itemsValue),
      discount: optionalMoney(raw.totals?.discount ?? raw.discounts),
      shipping: optionalMoney(raw.totals?.shipping ?? raw.shipping ?? raw.shippingDeliveryValue),
      tax: optionalMoney(raw.totals?.tax ?? raw.tax),
      total: money(total),
    },
    shippingType: raw.shippingType,
    deliveryType: raw.deliveryType,
    marketingTags: raw.marketingTags,
  };
}

const sameSellers = (left: string[], right: string[]) => left.join("|") === right.join("|");

function getImpact(type: DifferenceType, delta: number, baselineTotal: number): Impact {
  if (type === "unchanged") return "none";
  if (type === "added" || type === "removed") return "high";

  const absolute = Math.abs(delta);
  const percentage = baselineTotal ? (absolute / Math.abs(baselineTotal)) * 100 : 0;
  if (absolute >= 150 || percentage >= 10) return "critical";
  if (absolute >= 50 || percentage >= 5) return "high";
  if (absolute >= 25 || percentage >= 1) return "medium";
  return "low";
}

export function compareBudgets(
  baseline: NormalizedBudget,
  candidate: NormalizedBudget,
): BudgetComparison {
  const baselineItems = new Map(baseline.items.map((item) => [item.skuId, item]));
  const candidateItems = new Map(candidate.items.map((item) => [item.skuId, item]));
  const skuIds = [...new Set([...baselineItems.keys(), ...candidateItems.keys()])];

  const items = skuIds.map<ItemDifference>((skuId) => {
    const baselineItem = baselineItems.get(skuId);
    const candidateItem = candidateItems.get(skuId);
    const changes: ItemDifference["changes"] = [];

    if (baselineItem && candidateItem) {
      if (baselineItem.quantity !== candidateItem.quantity) changes.push("quantity");
      if (baselineItem.listPrice !== candidateItem.listPrice) changes.push("listPrice");
      if (baselineItem.sellingPrice !== candidateItem.sellingPrice) changes.push("sellingPrice");
      if (baselineItem.totalPrice !== candidateItem.totalPrice) changes.push("totalPrice");
      if (!sameSellers(baselineItem.sellerIds, candidateItem.sellerIds)) changes.push("seller");
    }

    const type: DifferenceType = !baselineItem
      ? "added"
      : !candidateItem
        ? "removed"
        : changes.length
          ? "changed"
          : "unchanged";
    const financialDelta = roundMoney((candidateItem?.totalPrice ?? 0) - (baselineItem?.totalPrice ?? 0));

    return {
      skuId,
      name: candidateItem?.name ?? baselineItem?.name ?? skuId,
      type,
      impact: getImpact(type, financialDelta, baselineItem?.totalPrice ?? 0),
      financialDelta,
      changes,
      baseline: baselineItem,
      candidate: candidateItem,
    };
  });

  const summary: BudgetComparison["summary"] = { added: 0, removed: 0, changed: 0, unchanged: 0 };
  for (const item of items) summary[item.type] += 1;
  const totalDelta = roundMoney(candidate.totals.total - baseline.totals.total);

  return {
    baselineId: baseline.id,
    candidateId: candidate.id,
    hasDifferences: totalDelta !== 0 || items.some((item) => item.type !== "unchanged"),
    summary,
    totalDelta,
    items: items.sort((left, right) => {
      const order: Record<DifferenceType, number> = { changed: 0, removed: 1, added: 2, unchanged: 3 };
      return order[left.type] - order[right.type] || left.name.localeCompare(right.name, "pt-BR");
    }),
  };
}
