import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  inArray,
  lt,
  or,
  sql,
} from "drizzle-orm";

import { hasCapability } from "@/lib/auth/permissions";
import { getCurrentPrincipal } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { activeUpdateItem, activeUpdateJob, user } from "@/lib/db/schema";
import { TOOL_IDS } from "@/modules/tool-catalog/catalog";
import { getToolAccess, recordToolUse } from "@/modules/tool-catalog/data";
import {
  HISTORY_PAGE_SIZE,
  maskCnpj,
  maskEmail,
  PROCESS_BATCH_SIZE,
  type ActiveUpdateRow,
} from "./domain/active-update";
import type { ActiveUpdateResult } from "./domain/active-update";

export type ActiveUpdatePrincipal = NonNullable<
  Awaited<ReturnType<typeof getCurrentPrincipal>>
>;
export type ActiveUpdateJobStatus =
  | "uploading"
  | "ready"
  | "running"
  | "paused"
  | "completed"
  | "failed";

export async function getActiveUpdatePrincipal(): Promise<
  | { ok: true; principal: ActiveUpdatePrincipal }
  | { ok: false; status: 401 | 403; error: string }
> {
  const principal = await getCurrentPrincipal();
  if (!principal)
    return {
      ok: false,
      status: 401,
      error: "Sessão expirada. Entre novamente.",
    };
  if (!hasCapability(principal, "active:update"))
    return { ok: false, status: 403, error: "Acesso negado." };
  if (!(await getToolAccess(principal, TOOL_IDS.activeUpdate)).allowed) {
    return {
      ok: false,
      status: 403,
      error: "Esta ferramenta não está disponível para sua conta.",
    };
  }
  return { ok: true, principal };
}

const expiresIn90Days = () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1_000);

export async function createActiveUpdateJob(
  principal: ActiveUpdatePrincipal,
  fileName: string,
) {
  const id = crypto.randomUUID();
  const [job] = await db
    .insert(activeUpdateJob)
    .values({
      id,
      userId: principal.id,
      fileName,
      expiresAt: expiresIn90Days(),
    })
    .returning({ id: activeUpdateJob.id, status: activeUpdateJob.status });

  await recordToolUse(principal.id, TOOL_IDS.activeUpdate);
  return job;
}

async function ownedJob(userId: string, jobId: string) {
  const [job] = await db
    .select()
    .from(activeUpdateJob)
    .where(
      and(eq(activeUpdateJob.id, jobId), eq(activeUpdateJob.userId, userId)),
    )
    .limit(1);
  return job;
}

async function jobWithOwner(jobId: string) {
  const [job] = await db
    .select({
      ...getTableColumns(activeUpdateJob),
      ownerName: user.name,
    })
    .from(activeUpdateJob)
    .innerJoin(user, eq(activeUpdateJob.userId, user.id))
    .where(eq(activeUpdateJob.id, jobId))
    .limit(1);
  return job;
}

export async function appendActiveUpdateItems(
  principal: ActiveUpdatePrincipal,
  jobId: string,
  rows: ActiveUpdateRow[],
) {
  const job = await ownedJob(principal.id, jobId);
  if (!job)
    return {
      ok: false as const,
      status: 404 as const,
      error: "Processamento não encontrado.",
    };
  if (job.status !== "uploading")
    return {
      ok: false as const,
      status: 409 as const,
      error: "A importação deste arquivo já foi encerrada.",
    };

  const inserted = await db
    .insert(activeUpdateItem)
    .values(
      rows.map((row) => ({
        jobId,
        rowNumber: row.rowNumber,
        email: row.email,
        cnpjDoc: row.cnpjDoc,
      })),
    )
    .onConflictDoNothing()
    .returning({ rowNumber: activeUpdateItem.rowNumber });

  if (inserted.length) {
    await db
      .update(activeUpdateJob)
      .set({
        totalCount: sql`${activeUpdateJob.totalCount} + ${inserted.length}`,
        updatedAt: new Date(),
      })
      .where(eq(activeUpdateJob.id, jobId));
  }
  return { ok: true as const, inserted: inserted.length };
}

export async function changeActiveUpdateJob(
  principal: ActiveUpdatePrincipal,
  jobId: string,
  action: "finish-upload" | "fail-upload" | "pause" | "resume",
  message?: string,
) {
  const job = await ownedJob(principal.id, jobId);
  if (!job)
    return {
      ok: false as const,
      status: 404 as const,
      error: "Processamento não encontrado.",
    };
  const now = new Date();

  if (action === "finish-upload") {
    if (job.status !== "uploading" || job.totalCount === 0)
      return {
        ok: false as const,
        status: 409 as const,
        error: "O arquivo não possui registros prontos para processamento.",
      };
    await db
      .update(activeUpdateJob)
      .set({ status: "running", startedAt: now, updatedAt: now })
      .where(eq(activeUpdateJob.id, jobId));
  } else if (action === "fail-upload") {
    if (job.status !== "uploading")
      return {
        ok: false as const,
        status: 409 as const,
        error: "A importação já foi encerrada.",
      };
    await db
      .update(activeUpdateJob)
      .set({ status: "failed", completedAt: now, updatedAt: now })
      .where(eq(activeUpdateJob.id, jobId));
    if (message) {
      await db
        .update(activeUpdateItem)
        .set({
          resultCode: "UPLOAD_FAILED",
          resultMessage: message,
          updatedAt: now,
        })
        .where(eq(activeUpdateItem.jobId, jobId));
    }
  } else if (action === "pause") {
    if (job.status !== "running")
      return {
        ok: false as const,
        status: 409 as const,
        error: "Este processamento não está em execução.",
      };
    await db
      .update(activeUpdateJob)
      .set({ status: "paused", updatedAt: now })
      .where(eq(activeUpdateJob.id, jobId));
  } else {
    if (job.status !== "paused")
      return {
        ok: false as const,
        status: 409 as const,
        error: "Este processamento não está pausado.",
      };
    await db
      .update(activeUpdateJob)
      .set({ status: "running", updatedAt: now })
      .where(eq(activeUpdateJob.id, jobId));
  }
  return { ok: true as const };
}

function jobDto(
  job: typeof activeUpdateJob.$inferSelect & { ownerName?: string | null },
  principalId: string,
) {
  const processedCount =
    job.updatedCount + job.unchangedCount + job.failedCount;
  return {
    id: job.id,
    fileName: job.fileName,
    status: job.status as ActiveUpdateJobStatus,
    totalCount: job.totalCount,
    processedCount,
    pendingCount: Math.max(0, job.totalCount - processedCount),
    updatedCount: job.updatedCount,
    unchangedCount: job.unchangedCount,
    failedCount: job.failedCount,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
    ownerName: job.ownerName ?? null,
    canControl: job.userId === principalId,
  };
}

export async function getActiveUpdateJob(
  principal: ActiveUpdatePrincipal,
  jobId: string,
) {
  const job = await jobWithOwner(jobId);
  if (!job || (principal.role !== "ADMIN" && job.userId !== principal.id))
    return null;

  const items = await db
    .select({
      rowNumber: activeUpdateItem.rowNumber,
      email: activeUpdateItem.email,
      cnpjDoc: activeUpdateItem.cnpjDoc,
      status: activeUpdateItem.status,
      message: activeUpdateItem.resultMessage,
      updatedAt: activeUpdateItem.updatedAt,
    })
    .from(activeUpdateItem)
    .where(
      and(
        eq(activeUpdateItem.jobId, jobId),
        inArray(activeUpdateItem.status, ["updated", "unchanged", "failed"]),
      ),
    )
    .orderBy(desc(activeUpdateItem.updatedAt))
    .limit(20);

  return {
    ...jobDto(job, principal.id),
    items: items.map((item) => ({
      rowNumber: item.rowNumber,
      email: maskEmail(item.email),
      cnpjDoc: maskCnpj(item.cnpjDoc),
      status: item.status as ActiveUpdateResult["status"],
      message: item.message,
      updatedAt: item.updatedAt.toISOString(),
    })),
  };
}

export async function getActiveUpdateProgress(
  principal: ActiveUpdatePrincipal,
  jobId: string,
) {
  const job = await jobWithOwner(jobId);
  if (!job || (principal.role !== "ADMIN" && job.userId !== principal.id))
    return null;
  return jobDto(job, principal.id);
}

export async function listActiveUpdateJobs(
  principal: ActiveUpdatePrincipal,
  ownerId?: string,
  page = 0,
) {
  const requestedOwner = principal.role === "ADMIN" ? ownerId : principal.id;
  const [rows, collaborators, [activeJob]] = await Promise.all([
    db
      .select({
        ...getTableColumns(activeUpdateJob),
        ownerName: user.name,
      })
      .from(activeUpdateJob)
      .innerJoin(user, eq(activeUpdateJob.userId, user.id))
      .where(
        requestedOwner ? eq(activeUpdateJob.userId, requestedOwner) : undefined,
      )
      .orderBy(desc(activeUpdateJob.createdAt))
      .limit(HISTORY_PAGE_SIZE + 1)
      .offset(page * HISTORY_PAGE_SIZE),
    principal.role === "ADMIN"
      ? db
          .selectDistinct({ id: user.id, name: user.name })
          .from(activeUpdateJob)
          .innerJoin(user, eq(activeUpdateJob.userId, user.id))
          .orderBy(asc(user.name))
      : Promise.resolve([]),
    db
      .select({ id: activeUpdateJob.id })
      .from(activeUpdateJob)
      .where(
        and(
          eq(activeUpdateJob.userId, principal.id),
          inArray(activeUpdateJob.status, ["uploading", "running", "paused"]),
        ),
      )
      .orderBy(desc(activeUpdateJob.createdAt))
      .limit(1),
  ]);
  const hasMore = rows.length > HISTORY_PAGE_SIZE;
  const jobs = hasMore ? rows.slice(0, HISTORY_PAGE_SIZE) : rows;
  return {
    jobs: jobs.map((job) => jobDto(job, principal.id)),
    collaborators,
    activeJobId: activeJob?.id ?? null,
    hasMore,
    page,
  };
}

export async function claimActiveUpdateItems(
  principal: ActiveUpdatePrincipal,
  jobId: string,
) {
  const job = await ownedJob(principal.id, jobId);
  if (!job || job.status !== "running") return [];
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + 2 * 60 * 1_000);

  return db.transaction(async (tx) => {
    const [lockedJob] = await tx
      .select({ leaseUntil: activeUpdateJob.leaseUntil })
      .from(activeUpdateJob)
      .where(
        and(
          eq(activeUpdateJob.id, jobId),
          eq(activeUpdateJob.status, "running"),
        ),
      )
      .limit(1)
      .for("update");
    if (!lockedJob || (lockedJob.leaseUntil && lockedJob.leaseUntil > now))
      return [];
    await tx
      .update(activeUpdateJob)
      .set({ leaseUntil, updatedAt: now })
      .where(eq(activeUpdateJob.id, jobId));

    const rows = await tx
      .select({
        rowNumber: activeUpdateItem.rowNumber,
        email: activeUpdateItem.email,
        cnpjDoc: activeUpdateItem.cnpjDoc,
      })
      .from(activeUpdateItem)
      .where(
        and(
          eq(activeUpdateItem.jobId, jobId),
          or(
            eq(activeUpdateItem.status, "pending"),
            and(
              eq(activeUpdateItem.status, "processing"),
              lt(activeUpdateItem.leaseUntil, now),
            ),
          ),
        ),
      )
      .orderBy(asc(activeUpdateItem.rowNumber))
      .limit(PROCESS_BATCH_SIZE)
      .for("update", { skipLocked: true });

    if (!rows.length) {
      await tx
        .update(activeUpdateJob)
        .set({ leaseUntil: null })
        .where(eq(activeUpdateJob.id, jobId));
      return [];
    }
    await tx
      .update(activeUpdateItem)
      .set({ status: "processing", leaseUntil, updatedAt: now })
      .where(
        and(
          eq(activeUpdateItem.jobId, jobId),
          inArray(
            activeUpdateItem.rowNumber,
            rows.map((row) => row.rowNumber),
          ),
        ),
      );
    return rows;
  });
}

export async function saveActiveUpdateResults(
  jobId: string,
  results: Array<{ rowNumber: number; result: ActiveUpdateResult }>,
) {
  const now = new Date();
  await db.transaction(async (tx) => {
    let updated = 0;
    let unchanged = 0;
    let failed = 0;
    for (const { rowNumber, result } of results) {
      const saved = await tx
        .update(activeUpdateItem)
        .set({
          status: result.status,
          attempts: result.attempts,
          resultCode: result.code,
          resultMessage: result.message,
          leaseUntil: null,
          processedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(activeUpdateItem.jobId, jobId),
            eq(activeUpdateItem.rowNumber, rowNumber),
            eq(activeUpdateItem.status, "processing"),
          ),
        )
        .returning({ rowNumber: activeUpdateItem.rowNumber });
      if (!saved.length) continue;
      if (result.status === "updated") updated += 1;
      else if (result.status === "unchanged") unchanged += 1;
      else failed += 1;
    }

    if (updated || unchanged || failed) {
      const [current] = await tx
        .select()
        .from(activeUpdateJob)
        .where(eq(activeUpdateJob.id, jobId))
        .limit(1);
      if (current)
        await tx
          .update(activeUpdateJob)
          .set({
            updatedCount: current.updatedCount + updated,
            unchangedCount: current.unchangedCount + unchanged,
            failedCount: current.failedCount + failed,
            leaseUntil: null,
            updatedAt: now,
          })
          .where(eq(activeUpdateJob.id, jobId));
    }

    const [remaining] = await tx
      .select({ value: count() })
      .from(activeUpdateItem)
      .where(
        and(
          eq(activeUpdateItem.jobId, jobId),
          inArray(activeUpdateItem.status, ["pending", "processing"]),
        ),
      );
    if ((remaining?.value ?? 0) === 0) {
      await tx
        .update(activeUpdateJob)
        .set({ status: "completed", completedAt: now, updatedAt: now })
        .where(eq(activeUpdateJob.id, jobId));
    }
  });
}

export async function getActiveUpdateExportJob(
  principal: ActiveUpdatePrincipal,
  jobId: string,
) {
  const [job] = await db
    .select()
    .from(activeUpdateJob)
    .where(eq(activeUpdateJob.id, jobId))
    .limit(1);
  if (!job || (principal.role !== "ADMIN" && job.userId !== principal.id))
    return null;
  return job;
}

export async function getActiveUpdateExportRows(
  jobId: string,
  afterRow: number,
  limit = 500,
) {
  return db
    .select({
      rowNumber: activeUpdateItem.rowNumber,
      email: activeUpdateItem.email,
      cnpjDoc: activeUpdateItem.cnpjDoc,
      status: activeUpdateItem.status,
      code: activeUpdateItem.resultCode,
      message: activeUpdateItem.resultMessage,
      attempts: activeUpdateItem.attempts,
      processedAt: activeUpdateItem.processedAt,
    })
    .from(activeUpdateItem)
    .where(
      and(
        eq(activeUpdateItem.jobId, jobId),
        gt(activeUpdateItem.rowNumber, afterRow),
      ),
    )
    .orderBy(asc(activeUpdateItem.rowNumber))
    .limit(limit);
}

export async function deleteExpiredActiveUpdates() {
  return db
    .delete(activeUpdateJob)
    .where(lt(activeUpdateJob.expiresAt, new Date()))
    .returning({ id: activeUpdateJob.id });
}
