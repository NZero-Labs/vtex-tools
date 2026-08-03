import {
  roundMoney,
  type DifferenceType,
  type Impact,
  type ItemDifference,
  type NormalizedSubject,
  type SubjectComparison,
} from "./subject";

const sameSellers = (left: string[], right: string[]) =>
  left.join("|") === right.join("|");
const sameValues = (left: string[], right: string[]) =>
  left.join("|") === right.join("|");

function getImpact(
  type: DifferenceType,
  delta: number,
  baselineTotal: number,
): Impact {
  if (type === "unchanged") return "none";
  if (type === "added" || type === "removed") return "high";
  const absolute = Math.abs(delta);
  const percentage = baselineTotal
    ? (absolute / Math.abs(baselineTotal)) * 100
    : 0;
  if (absolute >= 150 || percentage >= 10) return "critical";
  if (absolute >= 50 || percentage >= 5) return "high";
  if (absolute >= 25 || percentage >= 1) return "medium";
  return "low";
}

export function compareAuditSubjects(
  baseline: NormalizedSubject,
  candidate: NormalizedSubject,
): SubjectComparison {
  const baselineItems = new Map(
    baseline.items.map((item) => [item.skuId, item]),
  );
  const candidateItems = new Map(
    candidate.items.map((item) => [item.skuId, item]),
  );
  const skuIds = [
    ...new Set([...baselineItems.keys(), ...candidateItems.keys()]),
  ];
  const items = skuIds.map<ItemDifference>((skuId) => {
    const baselineItem = baselineItems.get(skuId);
    const candidateItem = candidateItems.get(skuId);
    const changes: ItemDifference["changes"] = [];
    if (baselineItem && candidateItem) {
      if (baselineItem.quantity !== candidateItem.quantity)
        changes.push("quantity");
      if (baselineItem.listPrice !== candidateItem.listPrice)
        changes.push("listPrice");
      if (baselineItem.sellingPrice !== candidateItem.sellingPrice)
        changes.push("sellingPrice");
      if (baselineItem.totalPrice !== candidateItem.totalPrice)
        changes.push("totalPrice");
      if (!sameSellers(baselineItem.sellerIds, candidateItem.sellerIds))
        changes.push("seller");
    }
    const type: DifferenceType = !baselineItem
      ? "added"
      : !candidateItem
        ? "removed"
        : changes.length
          ? "changed"
          : "unchanged";
    const financialDelta = roundMoney(
      (candidateItem?.totalPrice ?? 0) - (baselineItem?.totalPrice ?? 0),
    );
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

  const summary: SubjectComparison["summary"] = {
    added: 0,
    removed: 0,
    changed: 0,
    unchanged: 0,
  };
  for (const item of items) summary[item.type] += 1;
  const totalDelta = roundMoney(candidate.totals.total - baseline.totals.total);
  const priceLabels: Record<keyof NormalizedSubject["totals"], string> = {
    subtotal: "Subtotal",
    discount: "Descontos",
    shipping: "Frete",
    tax: "Impostos",
    total: "Total",
  };
  const priceBreakdown = (
    Object.keys(priceLabels) as Array<keyof typeof priceLabels>
  ).map((key) => {
    const left = baseline.totals[key];
    const right = candidate.totals[key];
    return {
      key,
      label: priceLabels[key],
      baseline: left,
      candidate: right,
      delta: left === null || right === null ? null : roundMoney(right - left),
    };
  });
  const shipping = {
    postalCodeChanged:
      (baseline.shipping.postalCode ?? "") !==
      (candidate.shipping.postalCode ?? ""),
    deliveryTypesChanged: !sameValues(
      baseline.shipping.deliveryTypes,
      candidate.shipping.deliveryTypes,
    ),
    slasChanged: !sameValues(baseline.shipping.slas, candidate.shipping.slas),
    valueDelta:
      baseline.shipping.value === null || candidate.shipping.value === null
        ? null
        : roundMoney(candidate.shipping.value - baseline.shipping.value),
  };
  const baselinePromotions = new Map(
    baseline.promotions.map((item) => [item.id, item]),
  );
  const candidatePromotions = new Map(
    candidate.promotions.map((item) => [item.id, item]),
  );
  const promotions = [
    ...new Set([...baselinePromotions.keys(), ...candidatePromotions.keys()]),
  ].map((id) => {
    const left = baselinePromotions.get(id);
    const right = candidatePromotions.get(id);
    const status: DifferenceType = !left
      ? "added"
      : !right
        ? "removed"
        : left.value !== right.value
          ? "changed"
          : "unchanged";
    return {
      id,
      name: right?.name ?? left?.name ?? id,
      status,
      baselineValue: left?.value ?? null,
      candidateValue: right?.value ?? null,
      valueDelta:
        left?.value == null || right?.value == null
          ? null
          : roundMoney(right.value - left.value),
    };
  });
  const baselineTags = new Set(baseline.marketingTags);
  const candidateTags = new Set(candidate.marketingTags);
  const marketingTags = {
    added: candidate.marketingTags.filter((tag) => !baselineTags.has(tag)),
    removed: baseline.marketingTags.filter((tag) => !candidateTags.has(tag)),
  };
  const weight =
    baseline.weight && candidate.weight
      ? {
          baselineTotalKg: baseline.weight.totalKg,
          candidateTotalKg: candidate.weight.totalKg,
          deltaKg:
            baseline.weight.complete && candidate.weight.complete
              ? roundMoney(candidate.weight.totalKg - baseline.weight.totalKg)
              : null,
          complete: baseline.weight.complete && candidate.weight.complete,
        }
      : null;
  const warnings = [
    ...(weight && !weight.complete
      ? ["Peso parcial: um ou mais SKUs não possuem peso válido no catálogo."]
      : []),
    ...(promotions.some(
      (item) => item.baselineValue === null || item.candidateValue === null,
    )
      ? ["Há promoções cujo valor não foi informado pela VTEX."]
      : []),
  ];
  const sectionDiff =
    shipping.postalCodeChanged ||
    shipping.deliveryTypesChanged ||
    shipping.slasChanged ||
    (shipping.valueDelta ?? 0) !== 0 ||
    promotions.some((item) => item.status !== "unchanged") ||
    marketingTags.added.length > 0 ||
    marketingTags.removed.length > 0 ||
    (weight?.deltaKg ?? 0) !== 0;

  return {
    baselineId: baseline.id,
    candidateId: candidate.id,
    hasDifferences:
      totalDelta !== 0 ||
      items.some((item) => item.type !== "unchanged") ||
      sectionDiff,
    summary,
    totalDelta,
    items: items.sort((left, right) => {
      const order: Record<DifferenceType, number> = {
        changed: 0,
        removed: 1,
        added: 2,
        unchanged: 3,
      };
      return (
        order[left.type] - order[right.type] ||
        left.name.localeCompare(right.name, "pt-BR")
      );
    }),
    priceBreakdown,
    shipping,
    promotions,
    marketingTags,
    weight,
    warnings,
  };
}
