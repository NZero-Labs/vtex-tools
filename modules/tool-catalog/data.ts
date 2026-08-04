import { desc, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";
import { platformUpdate, recentTool } from "@/lib/db/schema";
import { canAccessTool, type Principal } from "@/lib/auth/permissions";
import { findTool, toolCatalog, type ToolStatus } from "./catalog";

const readPlatformUpdates = async () =>
  db
    .select({
      id: platformUpdate.id,
      title: platformUpdate.title,
      summary: platformUpdate.summary,
      publishedAt: platformUpdate.publishedAt,
    })
    .from(platformUpdate)
    .orderBy(desc(platformUpdate.publishedAt), desc(platformUpdate.sortOrder))
    .limit(3);

const getCachedPlatformUpdates =
  process.env.NODE_ENV === "development"
    ? readPlatformUpdates
    : unstable_cache(
        readPlatformUpdates,
        ["platform-updates"],
        { revalidate: 300, tags: ["platform-updates"] },
      );

export async function getToolAccess(principal: Principal & { id: string }, toolId: string) {
  const tool = findTool(toolId);
  if (!tool) return { allowed: false as const, reason: "unknown" as const };

  const result = await db.execute<{ status: string | null; allowed: boolean | null }>(sql`
    SELECT
      (SELECT status FROM tool_state WHERE tool_id = ${toolId}) AS status,
      (SELECT allowed FROM tool_permission WHERE user_id = ${principal.id} AND tool_id = ${toolId}) AS allowed
  `);
  const access = result.rows[0];
  const status = (access?.status as ToolStatus | undefined) ?? tool.defaultStatus;
  const allowed = canAccessTool(principal, tool.requiredCapability, access?.allowed !== false) && (status === "available" || status === "beta");
  return { allowed, reason: allowed ? null : status };
}

export async function getVisibleTools(principal: Principal & { id: string }) {
  type Snapshot = {
    states: Record<string, ToolStatus>;
    permissions: Record<string, boolean>;
    favorites: string[];
    recents: Array<{ toolId: string; usedAt: string }>;
  };
  const result = await db.execute<Snapshot>(sql`
    SELECT
      COALESCE((SELECT jsonb_object_agg(tool_id, status) FROM tool_state), '{}'::jsonb) AS states,
      COALESCE((SELECT jsonb_object_agg(tool_id, allowed) FROM tool_permission WHERE user_id = ${principal.id}), '{}'::jsonb) AS permissions,
      COALESCE((SELECT jsonb_agg(tool_id) FROM favorite_tool WHERE user_id = ${principal.id}), '[]'::jsonb) AS favorites,
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object('toolId', tool_id, 'usedAt', used_at) ORDER BY used_at DESC)
        FROM (
          SELECT tool_id, used_at
          FROM recent_tool
          WHERE user_id = ${principal.id}
          ORDER BY used_at DESC
          LIMIT 5
        ) AS recent_rows
      ), '[]'::jsonb) AS recents
  `);
  const snapshot = result.rows[0];
  const stateById = new Map(Object.entries(snapshot?.states ?? {}));
  const permissionById = new Map(Object.entries(snapshot?.permissions ?? {}));
  const favoriteIds = new Set(snapshot?.favorites ?? []);
  const recentById = new Map(
    (snapshot?.recents ?? []).map((recent) => [recent.toolId, new Date(recent.usedAt)]),
  );

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
  return getCachedPlatformUpdates();
}

export async function recordToolUse(userId: string, toolId: string) {
  const usedAt = new Date();
  await db
    .insert(recentTool)
    .values({ userId, toolId, usedAt })
    .onConflictDoUpdate({
      target: [recentTool.userId, recentTool.toolId],
      set: { usedAt },
    });
}
