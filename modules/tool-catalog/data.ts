import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { favoriteTool, platformUpdate, recentTool, toolPermission, toolState } from "@/lib/db/schema";
import { canAccessTool, type Principal } from "@/lib/auth/permissions";
import { findTool, toolCatalog, type ToolStatus } from "./catalog";

export async function getToolAccess(principal: Principal & { id: string }, toolId: string) {
  const tool = findTool(toolId);
  if (!tool) return { allowed: false as const, reason: "unknown" as const };

  const [[state], [permission]] = await Promise.all([
    db.select({ status: toolState.status }).from(toolState).where(eq(toolState.toolId, toolId)).limit(1),
    db.select({ allowed: toolPermission.allowed }).from(toolPermission).where(and(eq(toolPermission.userId, principal.id), eq(toolPermission.toolId, toolId))).limit(1),
  ]);
  const status = (state?.status as ToolStatus | undefined) ?? tool.defaultStatus;
  const allowed = canAccessTool(principal, tool.requiredCapability, permission?.allowed !== false) && (status === "available" || status === "beta");
  return { allowed, reason: allowed ? null : status };
}

export async function getVisibleTools(principal: Principal & { id: string }) {
  const toolIds = toolCatalog.map((tool) => tool.id);
  const [states, permissions, favorites, recents] = await Promise.all([
    db.select().from(toolState).where(inArray(toolState.toolId, toolIds)),
    db.select().from(toolPermission).where(and(eq(toolPermission.userId, principal.id), inArray(toolPermission.toolId, toolIds))),
    db.select().from(favoriteTool).where(eq(favoriteTool.userId, principal.id)),
    db.select().from(recentTool).where(eq(recentTool.userId, principal.id)).orderBy(desc(recentTool.usedAt)).limit(5),
  ]);

  const stateById = new Map(states.map((state) => [state.toolId, state.status as ToolStatus]));
  const permissionById = new Map(permissions.map((permission) => [permission.toolId, permission.allowed]));
  const favoriteIds = new Set(favorites.map((favorite) => favorite.toolId));
  const recentById = new Map(recents.map((recent) => [recent.toolId, recent.usedAt]));

  return toolCatalog
    .filter((tool) => canAccessTool(principal, tool.requiredCapability, permissionById.get(tool.id) !== false))
    .map((tool) => ({
      ...tool,
      status: stateById.get(tool.id) ?? tool.defaultStatus,
      favorite: favoriteIds.has(tool.id),
      lastUsedAt: recentById.get(tool.id),
    }));
}

export async function getPlatformUpdates() {
  return db.select().from(platformUpdate).orderBy(desc(platformUpdate.publishedAt), desc(platformUpdate.sortOrder)).limit(3);
}
