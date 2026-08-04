import "server-only";

import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { budgetComparisonHistory } from "@/lib/db/schema";
import type { ComparisonReport } from "./presentation/export-report";

export type ComparisonHistoryRecord = {
  id: string;
  kind: "budget" | "cart" | "version";
  report: ComparisonReport;
  createdAt: Date;
};

function getKind(report: ComparisonReport): ComparisonHistoryRecord["kind"] {
  const candidateKind = report.budgets[1]?.kind;
  return candidateKind === "cart" || candidateKind === "version" ? candidateKind : "budget";
}

function normalizeKind(value: string): ComparisonHistoryRecord["kind"] {
  return value === "cart" || value === "version" ? value : "budget";
}

export async function saveComparisonHistory(userId: string, report: ComparisonReport) {
  const id = randomUUID();
  await db.insert(budgetComparisonHistory).values({
    id,
    userId,
    kind: getKind(report),
    report,
  });
  return id;
}

export async function listComparisonHistory(userId: string) {
  const records = await db
    .select({
      id: budgetComparisonHistory.id,
      kind: budgetComparisonHistory.kind,
      createdAt: budgetComparisonHistory.createdAt,
    })
    .from(budgetComparisonHistory)
    .where(eq(budgetComparisonHistory.userId, userId))
    .orderBy(desc(budgetComparisonHistory.createdAt))
    .limit(50);

  return records.map((record) => ({ ...record, kind: normalizeKind(record.kind) }));
}

export async function getComparisonHistory(id: string) {
  const [record] = await db
    .select()
    .from(budgetComparisonHistory)
    .where(eq(budgetComparisonHistory.id, id))
    .limit(1);

  if (!record) return null;
  return {
    id: record.id,
    kind: normalizeKind(record.kind),
    report: record.report as ComparisonReport,
    createdAt: record.createdAt,
  } satisfies ComparisonHistoryRecord;
}
