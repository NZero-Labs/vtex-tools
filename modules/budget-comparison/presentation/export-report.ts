import type {
  BudgetComparison,
  DifferenceType,
  Impact,
  NormalizedBudget,
} from "../domain/budget-comparison";

export type ComparisonReport = {
  source: "fixture" | "vtex";
  budgets: NormalizedBudget[];
  comparisons: BudgetComparison[];
};

export const typeLabels: Record<DifferenceType, string> = {
  added: "Adicionado",
  removed: "Removido",
  changed: "Alterado",
  unchanged: "Sem alteração",
};

export const impactLabels: Record<Impact, string> = {
  critical: "Crítico",
  high: "Alto",
  medium: "Médio",
  low: "Baixo",
  none: "Nenhum",
};

const headers = [
  "Orçamento base",
  "Orçamento comparado",
  "Resultado",
  "Diferença total",
  "Adicionados",
  "Removidos",
  "Alterados",
  "Sem alteração",
  "Subtotal base",
  "Descontos base",
  "Frete base",
  "Impostos base",
  "Total base",
  "Subtotal comparado",
  "Descontos comparado",
  "Frete comparado",
  "Impostos comparado",
  "Total comparado",
  "SKU",
  "Produto",
  "Classificação",
  "Impacto",
  "Alterações",
  "Quantidade base",
  "Preço lista base",
  "Preço venda base",
  "Total item base",
  "Vendedores base",
  "Quantidade comparada",
  "Preço lista comparado",
  "Preço venda comparado",
  "Total item comparado",
  "Vendedores comparado",
  "Impacto financeiro",
];

function csvCell(value: unknown) {
  if (value == null) return "";
  const text = typeof value === "number" ? String(value).replace(".", ",") : String(value);
  return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function serializeComparisonCsv(report: ComparisonReport) {
  const baseline = report.budgets[0];
  if (!baseline) return `\uFEFF${headers.join(";")}\r\n`;

  const rows = report.comparisons.flatMap((comparison, comparisonIndex) => {
    const candidate = report.budgets[comparisonIndex + 1];
    if (!candidate) return [];

    return (comparison.items.length ? comparison.items : [undefined]).map((item) => [
      comparison.baselineId,
      comparison.candidateId,
      comparison.hasDifferences ? "Com divergências" : "Sem divergências",
      comparison.totalDelta,
      comparison.summary.added,
      comparison.summary.removed,
      comparison.summary.changed,
      comparison.summary.unchanged,
      baseline.totals.subtotal,
      baseline.totals.discount,
      baseline.totals.shipping,
      baseline.totals.tax,
      baseline.totals.total,
      candidate.totals.subtotal,
      candidate.totals.discount,
      candidate.totals.shipping,
      candidate.totals.tax,
      candidate.totals.total,
      item?.skuId,
      item?.name,
      item ? typeLabels[item.type] : undefined,
      item ? impactLabels[item.impact] : undefined,
      item?.changes.map((change) => ({ quantity: "Quantidade", listPrice: "Preço de lista", sellingPrice: "Preço de venda", totalPrice: "Total", seller: "Vendedor" })[change]).join(", "),
      item?.baseline?.quantity,
      item?.baseline?.listPrice,
      item?.baseline?.sellingPrice,
      item?.baseline?.totalPrice,
      item?.baseline?.sellerIds.join(", "),
      item?.candidate?.quantity,
      item?.candidate?.listPrice,
      item?.candidate?.sellingPrice,
      item?.candidate?.totalPrice,
      item?.candidate?.sellerIds.join(", "),
      item?.financialDelta,
    ]);
  });

  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n")}\r\n`;
}

export function serializeComparisonJson(report: ComparisonReport, exportedAt = new Date()) {
  return JSON.stringify({ exportedAt: exportedAt.toISOString(), ...report }, null, 2);
}

export function exportFilename(report: ComparisonReport, extension: "csv" | "json", date = new Date()) {
  const ids = report.budgets.map((budget) => budget.id.replaceAll(/[^a-zA-Z0-9_-]/g, "-")).join("-x-");
  return `comparacao-${ids}-${date.toISOString().slice(0, 10)}.${extension}`;
}
