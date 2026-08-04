import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getComparisonHistory } from "@/modules/budget-audit/history";
import { ComparisonResults } from "@/modules/budget-audit/presentation/comparison-report";

export const metadata: Metadata = { title: "Comparação salva" };

export default async function SavedComparisonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comparison = await getComparisonHistory(id);
  if (!comparison) notFound();

  return <ComparisonResults data={comparison.report} comparisonId={comparison.id} />;
}
