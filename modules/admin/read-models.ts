import "server-only";

import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  adminAuditLog,
  toolPermission,
  toolState,
  user,
} from "@/lib/db/schema";
import { toolCatalog } from "@/modules/tool-catalog/catalog";

const USER_PAGE_SIZE = 10;

export async function getAdminOverview() {
  const [[users], [active], [admins], recentLogs] = await Promise.all([
    db.select({ value: count() }).from(user),
    db.select({ value: count() }).from(user).where(eq(user.banned, false)),
    db.select({ value: count() }).from(user).where(eq(user.role, "ADMIN")),
    db
      .select()
      .from(adminAuditLog)
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(5),
  ]);

  return {
    userCount: users?.value ?? 0,
    activeUserCount: active?.value ?? 0,
    adminCount: admins?.value ?? 0,
    toolCount: toolCatalog.length,
    recentLogs,
  };
}

export async function getAdminUsers(input: {
  query?: string;
  status?: string;
  page: number;
}) {
  const filters: SQL[] = [];
  if (input.query) {
    const search = `%${input.query}%`;
    const nameOrEmail = or(ilike(user.name, search), ilike(user.email, search));
    if (nameOrEmail) filters.push(nameOrEmail);
  }
  if (input.status === "active") filters.push(eq(user.banned, false));
  if (input.status === "inactive") filters.push(eq(user.banned, true));
  const where = filters.length ? and(...filters) : undefined;

  const [[total], users] = await Promise.all([
    db.select({ value: count() }).from(user).where(where),
    db
      .select()
      .from(user)
      .where(where)
      .orderBy(asc(user.name))
      .limit(USER_PAGE_SIZE)
      .offset((input.page - 1) * USER_PAGE_SIZE),
  ]);
  const totalCount = total?.value ?? 0;

  return {
    users,
    totalCount,
    pageCount: Math.max(1, Math.ceil(totalCount / USER_PAGE_SIZE)),
  };
}

export async function getPermissionMatrix() {
  const [users, permissions] = await Promise.all([
    db
      .select()
      .from(user)
      .where(eq(user.banned, false))
      .orderBy(asc(user.name)),
    db.select().from(toolPermission),
  ]);
  const access = new Map(
    permissions.map((item) => [
      `${item.userId}:${item.toolId}`,
      item.allowed ? "allow" : "deny",
    ]),
  );

  return { users, access };
}

export async function getToolStatuses() {
  const states = await db.select().from(toolState);
  return new Map(states.map((state) => [state.toolId, state.status]));
}

export function getRecentAdminAuditLogs() {
  return db
    .select({
      id: adminAuditLog.id,
      action: adminAuditLog.action,
      targetType: adminAuditLog.targetType,
      targetId: adminAuditLog.targetId,
      summary: adminAuditLog.summary,
      createdAt: adminAuditLog.createdAt,
      actorName: user.name,
    })
    .from(adminAuditLog)
    .leftJoin(user, eq(adminAuditLog.actorId, user.id))
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(100);
}
