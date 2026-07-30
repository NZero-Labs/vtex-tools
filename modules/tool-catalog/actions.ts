"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requirePrincipal } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { favoriteTool, recentTool } from "@/lib/db/schema";
import { findTool } from "./catalog";

export async function toggleFavorite(toolId: string) {
  const principal = await requirePrincipal("dashboard:view");
  if (!findTool(toolId)) throw new Error("Ferramenta inválida");

  const where = and(eq(favoriteTool.userId, principal.id), eq(favoriteTool.toolId, toolId));
  const [existing] = await db.select({ toolId: favoriteTool.toolId }).from(favoriteTool).where(where).limit(1);
  if (existing) await db.delete(favoriteTool).where(where);
  else await db.insert(favoriteTool).values({ userId: principal.id, toolId });

  revalidatePath("/dashboard");
  revalidatePath("/ferramentas");
}

export async function recordRecentTool(toolId: string) {
  const principal = await requirePrincipal("dashboard:view");
  if (!findTool(toolId)) throw new Error("Ferramenta inválida");

  await db
    .insert(recentTool)
    .values({ userId: principal.id, toolId, usedAt: new Date() })
    .onConflictDoUpdate({ target: [recentTool.userId, recentTool.toolId], set: { usedAt: new Date() } });
}
