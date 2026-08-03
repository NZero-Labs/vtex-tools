import { z } from "zod";

import {
  roundMoney,
  type BudgetItem,
  type BudgetRecord,
  type NormalizedSubject,
  type Promotion,
  type SubjectKind,
} from "../domain/subject";

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
  const selectedSlas = logistics.flatMap((item) => item.selectedSla ? [normalizeSla(item.selectedSla)] : []);
  const slas = uniqueSorted([raw.shippingType, ...selectedSlas]);

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
  const itemsValue = totalizer("Items");
  const discountValue = totalizer("Discounts");
  const taxValue = totalizer("Tax");
  return {
    id: raw.orderFormId,
    kind: "cart",
    items: normalizeItems(rawItems, 100),
    totals: {
      subtotal: itemsValue == null ? null : roundMoney(itemsValue / 100),
      discount: discountValue == null ? null : roundMoney(discountValue / 100),
      shipping: shippingValue == null ? null : roundMoney(shippingValue / 100),
      tax: taxValue == null ? null : roundMoney(taxValue / 100),
      total: roundMoney(raw.value / 100),
    },
    shipping: {
      postalCode: raw.shippingData?.address?.postalCode ?? raw.shippingData?.selectedAddresses?.[0]?.postalCode,
      deliveryTypes: uniqueSorted(logistics.map((item) => item.selectedDeliveryChannel)),
      slas: uniqueSorted(logistics.flatMap((item) => item.selectedSla ? [normalizeSla(item.selectedSla)] : [])),
      value: shippingValue == null ? null : roundMoney(shippingValue / 100),
    },
    promotions: normalizePromotions(raw.items, 100, knownPromotions),
    marketingTags: [...tags].sort(),
  };
}
