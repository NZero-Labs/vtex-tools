import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { getServerEnv } from "@/lib/env";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/modules/authentication/domain/password-policy";

const env = getServerEnv();

async function sendResetEmail({ user, url }: { user: { email: string }; url: string }) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) throw new Error("Serviço de recuperação de senha não configurado");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: user.email,
      subject: "Redefinição de senha — VTEX Tools",
      html: `<p>Use o link abaixo para redefinir sua senha da VTEX Tools. Ele expira em uma hora.</p><p><a href="${url}">Redefinir senha</a></p>`,
    }),
  });

  if (!response.ok) throw new Error("Falha ao enviar e-mail de recuperação");
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: sendResetEmail,
  },
  session: { expiresIn: 60 * 60 * 8, updateAge: 60 * 30 },
  rateLimit: { enabled: true, window: 60, max: 100 },
  plugins: [
    admin({
      roles: { ADMIN: adminAc, EMPLOYEE: userAc },
      defaultRole: "EMPLOYEE",
      adminRoles: ["ADMIN"],
      bannedUserMessage: "Seu acesso está desativado. Procure um administrador.",
    }),
    nextCookies(),
  ],
  advanced: { database: { generateId: () => crypto.randomUUID() } },
});
