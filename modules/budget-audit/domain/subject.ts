export type Impact = "critical" | "high" | "medium" | "low" | "none";
export type DifferenceType = "added" | "removed" | "changed" | "unchanged";
export type SubjectKind = "budget" | "cart" | "version";
export type SubjectPosition = "base" | "comparison";

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

export type BudgetRecord = NormalizedSubject & { documentId?: string; updatedAt?: string };

export function subjectDisplayName(subject: Pick<NormalizedSubject, "kind">, position: SubjectPosition) {
  if (subject.kind === "cart") return "Carrinho atual";
  if (subject.kind === "version") return "Versão anterior";
  return position === "base" ? "Orçamento base" : "Orçamento comparado";
}

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

export type SubjectComparison = {
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

export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

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
