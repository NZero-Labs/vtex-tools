import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { getServerEnv } from "@/lib/env";
const env = getServerEnv();

export const auth = betterAuth({
  socialProviders: {
    microsoft: {
      clientId: env.AZURE_CLIENT_ID,
      clientSecret: env.AZURE_CLIENT_SECRET,
      redirectURI: env.AZURE_REDIRECT_URI,
      tenantId: env.AZURE_TENANT_ID,
      authority: "https://login.microsoftonline.com", // Authentication authority URL
      prompt: "select_account", // Forces account selection
    },
  },
  trustedOrigins: ["http://localhost:3000", "https://vtex-tools.vercel.app"],
  basePath: "/api/auth",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  account: {
    accountLinking: {
      trustedProviders: ["microsoft"],
      requireLocalEmailVerified: false,
    },
  },
  session: {
    expiresIn: 60 * 60 * 8,
    updateAge: 60 * 30,
    cookieCache: { enabled: true, maxAge: 5 * 60, strategy: "compact" },
  },
  rateLimit: { enabled: true, window: 60, max: 100 },
  plugins: [
    admin({
      roles: { ADMIN: adminAc, EMPLOYEE: userAc, VISITOR: userAc },
      defaultRole: "VISITOR",
      adminRoles: ["ADMIN"],
      bannedUserMessage:
        "Seu acesso está desativado. Procure um administrador.",
    }),
    nextCookies(),
  ],
  advanced: { database: { generateId: () => crypto.randomUUID() } },
});
