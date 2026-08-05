"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { preservesActiveAdministrator } from "@/lib/auth/permissions";
import { requirePrincipal } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { adminAuditLog, session, toolPermission, toolState, user } from "@/lib/db/schema";
import { findTool } from "@/modules/tool-catalog/catalog";

const roleSchema = z.enum(["VISITOR", "EMPLOYEE", "ADMIN"]);
const toolStatusSchema = z.enum(["available", "beta", "maintenance", "coming-soon"]);

const go = (path: string, kind: "success" | "error", message: string): never => redirect(`${path}?${kind}=${encodeURIComponent(message)}`);

async function activeAdminCount() {
  const [result] = await db.select({ value: count() }).from(user).where(and(eq(user.role, "ADMIN"), eq(user.banned, false)));
  return result?.value ?? 0;
}

const audit = (actorId: string, action: string, targetType: string, targetId: string, summary: string) => ({
  id: crypto.randomUUID(), actorId, action, targetType, targetId, summary,
});

export async function changeUserRole(formData: FormData) {
  const actor = await requirePrincipal("users:manage");
  const parsed = z.object({ userId: z.uuid(), role: roleSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return go("/admin/usuarios", "error", "Alteração inválida.");
  const data = parsed.data;
  const [target] = await db.select({ role: user.role, banned: user.banned }).from(user).where(eq(user.id, data.userId)).limit(1);
  if (!target) return go("/admin/usuarios", "error", "Usuário não encontrado.");
  const currentRole = roleSchema.safeParse(target.role);
  if (!currentRole.success) return go("/admin/usuarios", "error", "O usuário possui um Cargo inválido.");
  if (!preservesActiveAdministrator({ currentRole: currentRole.data, currentActive: !target.banned, nextRole: data.role, nextActive: !target.banned, activeAdminCount: await activeAdminCount() })) return go("/admin/usuarios", "error", "Mantenha ao menos um administrador ativo.");

  await db.transaction(async (tx) => {
    await tx.update(user).set({ role: data.role, updatedAt: new Date() }).where(eq(user.id, data.userId));
    await tx.delete(session).where(eq(session.userId, data.userId));
    await tx.insert(adminAuditLog).values(audit(actor.id, "user.role_changed", "user", data.userId, `Cargo alterado de ${target.role} para ${data.role}`));
  });
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/permissoes");
  go("/admin/usuarios", "success", "Cargo atualizado e sessões anteriores encerradas.");
}

export async function updateToolStatus(formData: FormData) {
  const actor = await requirePrincipal("tools:manage");
  const parsed = z.object({ toolId: z.string(), status: toolStatusSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success || !findTool(parsed.data.toolId)) return go("/admin/ferramentas", "error", "Ferramenta ou status inválido.");
  const data = parsed.data;

  await db.transaction(async (tx) => {
    await tx.insert(toolState).values({ toolId: data.toolId, status: data.status, updatedBy: actor.id, updatedAt: new Date() }).onConflictDoUpdate({ target: toolState.toolId, set: { status: data.status, updatedBy: actor.id, updatedAt: new Date() } });
    await tx.insert(adminAuditLog).values(audit(actor.id, "tool.status_changed", "tool", data.toolId, `Status alterado para ${data.status}`));
  });
  revalidatePath("/dashboard");
  revalidatePath("/ferramentas");
  go("/admin/ferramentas", "success", "Disponibilidade atualizada.");
}

export async function updateToolPermission(formData: FormData) {
  const actor = await requirePrincipal("users:manage");
  const parsed = z.object({ userId: z.uuid(), toolId: z.string(), access: z.enum(["inherit", "allow", "deny"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success || !findTool(parsed.data.toolId)) return go("/admin/permissoes", "error", "Permissão inválida.");
  const data = parsed.data;
  const where = and(eq(toolPermission.userId, data.userId), eq(toolPermission.toolId, data.toolId));

  await db.transaction(async (tx) => {
    if (data.access === "inherit") await tx.delete(toolPermission).where(where);
    else await tx.insert(toolPermission).values({ userId: data.userId, toolId: data.toolId, allowed: data.access === "allow" }).onConflictDoUpdate({ target: [toolPermission.userId, toolPermission.toolId], set: { allowed: data.access === "allow" } });
    await tx.insert(adminAuditLog).values(audit(actor.id, "tool.permission_changed", "user", data.userId, `Permissão de ${data.toolId}: ${data.access}`));
  });
  revalidatePath("/admin/permissoes");
  go("/admin/permissoes", "success", "Permissão atualizada.");
}
