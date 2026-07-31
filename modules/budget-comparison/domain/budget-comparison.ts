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

const priceTagSchema = z.object({
  identifier: optionalText,
  id: optionalText,
  name: optionalText,
  value: optionalMoneySchema,
}).passthrough();

const rawItemSchema = z.object({
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
  priceTags: z.array(priceTagSchema).nullish().transform((value) => value ?? []),
}).passthrough();

const rawTotalsSchema = z.object({
  subtotal: optionalMoneySchema,
  discount: optionalMoneySchema,
  shipping: optionalMoneySchema,
  tax: optionalMoneySchema,
  total: optionalMoneySchema,
});

const logisticsSchema = z.object({
  selectedSla: optionalText,
  selectedDeliveryChannel: optionalText,
}).passthrough();

const rawBudgetSchema = z.object({
  id: optionalText,
  idBudget: z.union([z.string(), z.number()]).transform(String),
  updatedAt: optionalText,
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
  postalCode: optionalText,
  shippingPostalCode: optionalText,
  logisticsInfo: z.array(logisticsSchema).nullish().transform((value) => value ?? []),
  marketingTags: z.array(z.string()).nullish().transform((value) => value ?? []),
}).passthrough();

const orderFormItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  productId: optionalText,
  name: z.string().trim().min(1),
  quantity: z.coerce.number().int().nonnegative(),
  price: moneySchema,
  sellingPrice: moneySchema.optional(),
  seller: optionalText,
  refId: optionalText,
  imageUrl: optionalText,
  priceTags: z.array(priceTagSchema).nullish().transform((value) => value ?? []),
}).passthrough();

const orderFormSchema = z.object({
  orderFormId: z.string().trim().min(1),
  items: z.array(orderFormItemSchema),
  value: moneySchema,
  totalizers: z.array(z.object({ id: z.string(), value: moneySchema }).passthrough()).nullish().transform((value) => value ?? []),
  shippingData: z.object({
    address: z.object({ postalCode: optionalText }).passthrough().nullish(),
    selectedAddresses: z.array(z.object({ postalCode: optionalText }).passthrough()).nullish(),
    logisticsInfo: z.array(logisticsSchema).nullish().transform((value) => value ?? []),
  }).passthrough().nullish(),
  marketingData: z.object({ marketingTags: z.array(z.string()).nullish() }).passthrough().nullish(),
  ratesAndBenefitsData: z.object({
    rateAndBenefitsIdentifiers: z.array(z.object({
      id: optionalText,
      name: optionalText,
      matchedParameters: z.record(z.string(), z.unknown()).nullish(),
    }).passthrough()).nullish(),
  }).passthrough().nullish(),
}).passthrough();

const budgetIdSchema = z.string().trim().min(1, "Informe o identificador do orçamento").max(100, "Identificador muito longo");

export const budgetRequestSchema = z.object({
  budgetIds: z.array(budgetIdSchema).min(2, "Informe pelo menos dois orçamentos").max(5, "Compare no máximo cinco orçamentos"),
}).superRefine(({ budgetIds }, context) => {
  if (new Set(budgetIds).size !== budgetIds.length) {
    context.addIssue({ code: "custom", path: ["budgetIds"], message: "Os orçamentos devem ser únicos" });
  }
});

export const budgetCartRequestSchema = z.object({
  budgetId: budgetIdSchema,
  orderForm: z.string().trim().min(1, "Informe o ID ou a URL do carrinho").max(2_000, "URL do carrinho muito longa"),
});

export const budgetVersionsRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list"), budgetId: budgetIdSchema }),
  z.object({ action: z.literal("compare"), budgetId: budgetIdSchema, versionId: z.string().trim().min(1).max(200) }),
]);

export type Impact = "critical" | "high" | "medium" | "low" | "none";
export type DifferenceType = "added" | "removed" | "changed" | "unchanged";
export type SubjectKind = "budget" | "cart" | "version";

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

export type Promotion = { id: string; name: string; value: number | null };
export type WeightSummary = { totalKg: number; complete: boolean; missingSkuIds: string[] };

export type NormalizedSubject = {
  id: string;
  kind: SubjectKind;
  items: BudgetItem[];
  totals: {
    subtotal: number | null;
    discount: number | null;
    shipping: number | null;
    tax: number | null;
    total: number;
  };
  shipping: {
    postalCode?: string;
    deliveryTypes: string[];
    slas: string[];
    value: number | null;
  };
  promotions: Promotion[];
  marketingTags: string[];
  weight?: WeightSummary;
};

export type NormalizedBudget = NormalizedSubject;
export type BudgetRecord = NormalizedSubject & { documentId?: string; updatedAt?: string };

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
  priceBreakdown: Array<{ key: keyof NormalizedSubject["totals"]; label: string; baseline: number | null; candidate: number | null; delta: number | null }>;
  shipping: { postalCodeChanged: boolean; deliveryTypesChanged: boolean; slasChanged: boolean; valueDelta: number | null };
  promotions: Array<{ id: string; name: string; status: DifferenceType; baselineValue: number | null; candidateValue: number | null; valueDelta: number | null }>;
  marketingTags: { added: string[]; removed: string[] };
  weight: { baselineTotalKg: number; candidateTotalKg: number; deltaKg: number | null; complete: boolean } | null;
  warnings: string[];
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const uniqueSorted = (values: Array<string | undefined>) => [...new Set(values.filter((value): value is string => Boolean(value)))].sort();

const slaLabels: Record<string, string> = {
  "AMARANZ LOGISTICA CAJ/FSA": "PDO/CIF",
  "EXP LOGISTICA CAJ/FSA": "EXP/CIF",
  "FOB LOGISTICA CAJ/FSA": "PDO/FOB",
};

export function normalizeSla(value: string) {
  return slaLabels[value.trim().toUpperCase()] ?? value.trim();
}

function normalizePromotions(
  items: Array<{ priceTags: Array<z.infer<typeof priceTagSchema>> }>,
  scale: number,
  known: Array<{ id?: string; name?: string }> = [],
) {
  const promotions = new Map<string, Promotion>();
  for (const promotion of known) {
    const id = promotion.id ?? promotion.name;
    if (id) promotions.set(id, { id, name: promotion.name ?? id, value: null });
  }
  for (const item of items) {
    for (const tag of item.priceTags) {
      const id = tag.identifier ?? tag.id ?? tag.name;
      if (!id) continue;
      const current = promotions.get(id);
      const value = tag.value === undefined ? null : roundMoney(tag.value / scale);
      promotions.set(id, {
        id,
        name: tag.name ?? current?.name ?? id,
        value: value === null || current?.value === null ? value : roundMoney((current?.value ?? 0) + value),
      });
    }
  }
  return [...promotions.values()].sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
}

function normalizeItems(rawItems: Array<z.infer<typeof rawItemSchema>>, moneyScale: number) {
  const items = new Map<string, BudgetItem>();
  for (const item of rawItems) {
    const current = items.get(item.skuId);
    const quantity = (current?.quantity ?? 0) + item.quantity;
    const totalPrice = roundMoney((current?.totalPrice ?? 0) + (item.totalPrice ?? item.sellingPrice * item.quantity) / moneyScale);
    const sellerIds = uniqueSorted([...(current?.sellerIds ?? []), item.sellerId]);
    items.set(item.skuId, {
      skuId: item.skuId,
      productId: item.productId ?? current?.productId,
      name: item.name,
      quantity,
      listPrice: roundMoney((item.price ?? item.sellingPrice) / moneyScale),
      sellingPrice: quantity ? roundMoney(totalPrice / quantity) : roundMoney(item.sellingPrice / moneyScale),
      totalPrice,
      sellerIds,
      refId: item.refId ?? current?.refId,
      imageUrl: item.imageUrl ?? current?.imageUrl,
    });
  }
  return [...items.values()].sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
}

export function normalizeBudget(input: unknown, moneyScale: number, kind: SubjectKind = "budget"): BudgetRecord {
  if (!Number.isFinite(moneyScale) || moneyScale <= 0) throw new Error("Escala monetária inválida");
  const raw = rawBudgetSchema.parse(input);
  const total = raw.totals?.total ?? raw.total;
  if (total === undefined) throw new Error("Total do orçamento ausente");
  const money = (value: number) => roundMoney(value / moneyScale);
  const optionalMoney = (value: number | undefined) => value === undefined ? null : money(value);
  const logistics = raw.logisticsInfo;
  const deliveryTypes = uniqueSorted([raw.deliveryType, ...logistics.map((item) => item.selectedDeliveryChannel)]);
  const slas = uniqueSorted([raw.shippingType, ...logistics.map((item) => item.selectedSla).filter(Boolean).map((value) => normalizeSla(value!))]);

  return {
    id: raw.idBudget,
    kind,
    documentId: raw.id,
    updatedAt: raw.updatedAt,
    items: normalizeItems(raw.items, moneyScale),
    totals: {
      subtotal: optionalMoney(raw.totals?.subtotal ?? raw.subtotal ?? raw.itemsValue),
      discount: optionalMoney(raw.totals?.discount ?? raw.discounts),
      shipping: optionalMoney(raw.totals?.shipping ?? raw.shipping ?? raw.shippingDeliveryValue),
      tax: optionalMoney(raw.totals?.tax ?? raw.tax),
      total: money(total),
    },
    shipping: {
      postalCode: raw.shippingPostalCode ?? raw.postalCode,
      deliveryTypes,
      slas,
      value: optionalMoney(raw.totals?.shipping ?? raw.shipping ?? raw.shippingDeliveryValue),
    },
    promotions: normalizePromotions(raw.items, moneyScale),
    marketingTags: uniqueSorted(raw.marketingTags.map((tag) => tag.trim().toLowerCase())),
  };
}

export function normalizeOrderForm(input: unknown): NormalizedSubject {
  const raw = orderFormSchema.parse(input);
  const totalizer = (id: string) => raw.totalizers.find((item) => item.id.toLowerCase() === id.toLowerCase())?.value;
  const rawItems = raw.items.map((item) => ({
    skuId: item.id,
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    sellingPrice: item.sellingPrice ?? item.price,
    sellerId: item.seller,
    refId: item.refId,
    imageUrl: item.imageUrl,
    priceTags: item.priceTags,
  }));
  const logistics = raw.shippingData?.logisticsInfo ?? [];
  const knownPromotions = (raw.ratesAndBenefitsData?.rateAndBenefitsIdentifiers ?? []).map((item) => ({ id: item.id, name: item.name }));
  const tags = new Set((raw.marketingData?.marketingTags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean));
  for (const benefit of raw.ratesAndBenefitsData?.rateAndBenefitsIdentifiers ?? []) {
    const value = benefit.matchedParameters?.marketingTags;
    if (typeof value === "string") value.split(/[,;]/).map((tag) => tag.trim().toLowerCase()).filter(Boolean).forEach((tag) => tags.add(tag));
  }
  const shippingValue = totalizer("Shipping");
  return {
    id: raw.orderFormId,
    kind: "cart",
    items: normalizeItems(rawItems, 100),
    totals: {
      subtotal: totalizer("Items") == null ? null : roundMoney(totalizer("Items")! / 100),
      discount: totalizer("Discounts") == null ? null : roundMoney(totalizer("Discounts")! / 100),
      shipping: shippingValue == null ? null : roundMoney(shippingValue / 100),
      tax: totalizer("Tax") == null ? null : roundMoney(totalizer("Tax")! / 100),
      total: roundMoney(raw.value / 100),
    },
    shipping: {
      postalCode: raw.shippingData?.address?.postalCode ?? raw.shippingData?.selectedAddresses?.[0]?.postalCode,
      deliveryTypes: uniqueSorted(logistics.map((item) => item.selectedDeliveryChannel)),
      slas: uniqueSorted(logistics.map((item) => item.selectedSla).filter(Boolean).map((value) => normalizeSla(value!))),
      value: shippingValue == null ? null : roundMoney(shippingValue / 100),
    },
    promotions: normalizePromotions(raw.items, 100, knownPromotions),
    marketingTags: [...tags].sort(),
  };
}

export function toPublicSubject(record: BudgetRecord): NormalizedSubject {
  return {
    id: record.id,
    kind: record.kind,
    items: record.items,
    totals: record.totals,
    shipping: record.shipping,
    promotions: record.promotions,
    marketingTags: record.marketingTags,
    weight: record.weight,
  };
}

const sameSellers = (left: string[], right: string[]) => left.join("|") === right.join("|");
const sameValues = (left: string[], right: string[]) => left.join("|") === right.join("|");

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

export function compareBudgets(baseline: NormalizedSubject, candidate: NormalizedSubject): BudgetComparison {
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
    const type: DifferenceType = !baselineItem ? "added" : !candidateItem ? "removed" : changes.length ? "changed" : "unchanged";
    const financialDelta = roundMoney((candidateItem?.totalPrice ?? 0) - (baselineItem?.totalPrice ?? 0));
    return { skuId, name: candidateItem?.name ?? baselineItem?.name ?? skuId, type, impact: getImpact(type, financialDelta, baselineItem?.totalPrice ?? 0), financialDelta, changes, baseline: baselineItem, candidate: candidateItem };
  });

  const summary: BudgetComparison["summary"] = { added: 0, removed: 0, changed: 0, unchanged: 0 };
  for (const item of items) summary[item.type] += 1;
  const totalDelta = roundMoney(candidate.totals.total - baseline.totals.total);
  const priceLabels: Record<keyof NormalizedSubject["totals"], string> = { subtotal: "Subtotal", discount: "Descontos", shipping: "Frete", tax: "Impostos", total: "Total" };
  const priceBreakdown = (Object.keys(priceLabels) as Array<keyof typeof priceLabels>).map((key) => {
    const left = baseline.totals[key];
    const right = candidate.totals[key];
    return { key, label: priceLabels[key], baseline: left, candidate: right, delta: left === null || right === null ? null : roundMoney(right - left) };
  });
  const shipping = {
    postalCodeChanged: (baseline.shipping.postalCode ?? "") !== (candidate.shipping.postalCode ?? ""),
    deliveryTypesChanged: !sameValues(baseline.shipping.deliveryTypes, candidate.shipping.deliveryTypes),
    slasChanged: !sameValues(baseline.shipping.slas, candidate.shipping.slas),
    valueDelta: baseline.shipping.value === null || candidate.shipping.value === null ? null : roundMoney(candidate.shipping.value - baseline.shipping.value),
  };
  const baselinePromotions = new Map(baseline.promotions.map((item) => [item.id, item]));
  const candidatePromotions = new Map(candidate.promotions.map((item) => [item.id, item]));
  const promotions = [...new Set([...baselinePromotions.keys(), ...candidatePromotions.keys()])].map((id) => {
    const left = baselinePromotions.get(id);
    const right = candidatePromotions.get(id);
    const status: DifferenceType = !left ? "added" : !right ? "removed" : left.value !== right.value ? "changed" : "unchanged";
    return { id, name: right?.name ?? left?.name ?? id, status, baselineValue: left?.value ?? null, candidateValue: right?.value ?? null, valueDelta: left?.value == null || right?.value == null ? null : roundMoney(right.value - left.value) };
  });
  const baselineTags = new Set(baseline.marketingTags);
  const candidateTags = new Set(candidate.marketingTags);
  const marketingTags = { added: candidate.marketingTags.filter((tag) => !baselineTags.has(tag)), removed: baseline.marketingTags.filter((tag) => !candidateTags.has(tag)) };
  const weight = baseline.weight && candidate.weight ? {
    baselineTotalKg: baseline.weight.totalKg,
    candidateTotalKg: candidate.weight.totalKg,
    deltaKg: baseline.weight.complete && candidate.weight.complete ? roundMoney(candidate.weight.totalKg - baseline.weight.totalKg) : null,
    complete: baseline.weight.complete && candidate.weight.complete,
  } : null;
  const warnings = [
    ...(weight && !weight.complete ? ["Peso parcial: um ou mais SKUs não possuem peso válido no catálogo."] : []),
    ...(promotions.some((item) => item.baselineValue === null || item.candidateValue === null) ? ["Há promoções cujo valor não foi informado pela VTEX."] : []),
  ];
  const sectionDiff = shipping.postalCodeChanged || shipping.deliveryTypesChanged || shipping.slasChanged || (shipping.valueDelta ?? 0) !== 0
    || promotions.some((item) => item.status !== "unchanged") || marketingTags.added.length > 0 || marketingTags.removed.length > 0
    || (weight?.deltaKg ?? 0) !== 0;

  return {
    baselineId: baseline.id,
    candidateId: candidate.id,
    hasDifferences: totalDelta !== 0 || items.some((item) => item.type !== "unchanged") || sectionDiff,
    summary,
    totalDelta,
    items: items.sort((left, right) => {
      const order: Record<DifferenceType, number> = { changed: 0, removed: 1, added: 2, unchanged: 3 };
      return order[left.type] - order[right.type] || left.name.localeCompare(right.name, "pt-BR");
    }),
    priceBreakdown,
    shipping,
    promotions,
    marketingTags,
    weight,
    warnings,
  };
}
