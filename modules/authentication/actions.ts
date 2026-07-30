"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requirePrincipal } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

export async function updateProfile(formData: FormData) {
  const principal = await requirePrincipal("dashboard:view");
  const parsed = z.object({ name: z.string().trim().min(2).max(100) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/perfil?error=${encodeURIComponent("Informe um nome válido.")}`);

  await db.update(user).set({ name: parsed.data.name, updatedAt: new Date() }).where(eq(user.id, principal.id));
  revalidatePath("/perfil");
  redirect(`/perfil?success=${encodeURIComponent("Perfil atualizado.")}`);
}
