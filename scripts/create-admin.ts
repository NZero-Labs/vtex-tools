import { eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/modules/authentication/domain/password-policy";

const input = z
  .object({
    ADMIN_NAME: z.string().trim().min(2),
    ADMIN_EMAIL: z.email().transform((email) => email.toLowerCase()),
    ADMIN_PASSWORD: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  })
  .parse(process.env);

const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, input.ADMIN_EMAIL)).limit(1);

if (existing) {
  await db.update(user).set({ role: "ADMIN", banned: false, banReason: null, updatedAt: new Date() }).where(eq(user.id, existing.id));
  console.info(`Administrador atualizado: ${input.ADMIN_EMAIL}`);
} else {
  await auth.api.createUser({
    body: {
      name: input.ADMIN_NAME,
      email: input.ADMIN_EMAIL,
      password: input.ADMIN_PASSWORD,
      role: "ADMIN",
    },
  });
  console.info(`Administrador criado: ${input.ADMIN_EMAIL}`);
}

process.exit(0);
