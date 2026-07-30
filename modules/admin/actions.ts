"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { preservesActiveAdministrator } from "@/lib/auth/permissions";
import { requirePrincipal } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { adminAuditLog, session, toolPermission, toolState, user } from "@/lib/db/schema";
import { findTool } from "@/modules/tool-catalog/catalog";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/modules/authentication/domain/password-policy";

const roleSchema = z.enum(["EMPLOYEE", "ADMIN"]);
const toolStatusSchema = z.enum(["available", "beta", "maintenance", "coming-soon"]);

const go = (path: string, kind: "success" | "error", message: string): never => redirect(`${path}?${kind}=${encodeURIComponent(message)}`);

async function activeAdminCount() {
  const [result] = await db.select({ value: count() }).from(user).where(and(eq(user.role, "ADMIN"), eq(user.banned, false)));
  return result?.value ?? 0;
}

const audit = (actorId: string, action: string, targetType: string, targetId: string, summary: string) => ({
  id: crypto.randomUUID(), actorId, action, targetType, targetId, summary,
});

export async function createUser(formData: FormData) {
  const actor = await requirePrincipal("users:manage");
  const parsed = z.object({ name: z.string().trim().min(2), email: z.email().transform((value) => value.toLowerCase()), password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH), role: roleSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return go("/admin/usuarios", "error", parsed.error.issues[0]?.message ?? "Dados inválidos");
  const data = parsed.data;

  try {
    const result = await auth.api.createUser({ body: data });
    await db.insert(adminAuditLog).values(audit(actor.id, "user.created", "user", result.user.id, `Usuário criado com papel ${data.role}`));
  } catch {
    go("/admin/usuarios", "error", "Não foi possível criar o usuário. Verifique se o e-mail já existe.");
  }
  revalidatePath("/admin/usuarios");
  go("/admin/usuarios", "success", "Usuário criado com sucesso.");
}

export async function changeUserRole(formData: FormData) {
  const actor = await requirePrincipal("users:manage");
  const parsed = z.object({ userId: z.uuid(), role: roleSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return go("/admin/usuarios", "error", "Alteração inválida.");
  const data = parsed.data;
  const [target] = await db.select({ role: user.role, banned: user.banned }).from(user).where(eq(user.id, data.userId)).limit(1);
  if (!target) return go("/admin/usuarios", "error", "Usuário não encontrado.");
  const currentRole = roleSchema.safeParse(target.role);
  if (!currentRole.success) return go("/admin/usuarios", "error", "O usuário possui um papel inválido.");
  if (!preservesActiveAdministrator({ currentRole: currentRole.data, currentActive: !target.banned, nextRole: data.role, nextActive: !target.banned, activeAdminCount: await activeAdminCount() })) return go("/admin/usuarios", "error", "Mantenha ao menos um administrador ativo.");

  await db.transaction(async (tx) => {
    await tx.update(user).set({ role: data.role, updatedAt: new Date() }).where(eq(user.id, data.userId));
    await tx.delete(session).where(eq(session.userId, data.userId));
    await tx.insert(adminAuditLog).values(audit(actor.id, "user.role_changed", "user", data.userId, `Papel alterado de ${target.role} para ${data.role}`));
  });
  revalidatePath("/admin/usuarios");
  go("/admin/usuarios", "success", "Papel atualizado e sessões anteriores encerradas.");
}

export async function setUserActive(formData: FormData) {
  const actor = await requirePrincipal("users:manage");
  const parsed = z.object({ userId: z.uuid(), active: z.enum(["true", "false"]).transform((value) => value === "true") }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return go("/admin/usuarios", "error", "Alteração inválida.");
  const data = parsed.data;
  const [target] = await db.select({ role: user.role, banned: user.banned }).from(user).where(eq(user.id, data.userId)).limit(1);
  if (!target) return go("/admin/usuarios", "error", "Usuário não encontrado.");
  const currentRole = roleSchema.safeParse(target.role);
  if (!currentRole.success) return go("/admin/usuarios", "error", "O usuário possui um papel inválido.");
  if (!preservesActiveAdministrator({ currentRole: currentRole.data, currentActive: !target.banned, nextRole: currentRole.data, nextActive: data.active, activeAdminCount: await activeAdminCount() })) return go("/admin/usuarios", "error", "O último administrador ativo não pode ser desativado.");

  await db.transaction(async (tx) => {
    await tx.update(user).set({ banned: !data.active, banReason: data.active ? null : "Desativado por administrador", updatedAt: new Date() }).where(eq(user.id, data.userId));
    if (!data.active) await tx.delete(session).where(eq(session.userId, data.userId));
    await tx.insert(adminAuditLog).values(audit(actor.id, data.active ? "user.activated" : "user.deactivated", "user", data.userId, data.active ? "Acesso reativado" : "Acesso desativado logicamente"));
  });
  revalidatePath("/admin/usuarios");
  go("/admin/usuarios", "success", data.active ? "Usuário reativado." : "Usuário desativado e sessões encerradas.");
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
