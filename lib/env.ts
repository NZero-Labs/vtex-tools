import { z } from "zod";

const serverEnvSchema = z.object({
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET deve ter ao menos 32 caracteres"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  CRON_SECRET: z.string().min(16, "CRON_SECRET deve ter ao menos 16 caracteres").optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  VTEX_ACCOUNT: z.preprocess((value) => value === "" ? undefined : value, z.string().regex(/^[a-z0-9-]+$/).optional()),
  VTEX_ENVIRONMENT: z.string().regex(/^[a-z0-9-]+$/).default("vtexcommercestable"),
  VTEX_APP_KEY: z.string().optional(),
  VTEX_APP_TOKEN: z.string().optional(),
  VTEX_BUDGET_ENTITY: z.string().regex(/^[A-Za-z0-9_-]+$/).default("BD"),
  VTEX_MONEY_SCALE: z.coerce.number().positive().default(100),
  VTEX_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  USE_VTEX_FIXTURES: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | undefined;

export function getServerEnv() {
  if (cachedEnv) return cachedEnv;

  const result = serverEnvSchema.safeParse({
    ...process.env,
    VTEX_BUDGET_ENTITY: process.env.VTEX_BUDGET_ENTITY || process.env.VTEX_MASTERDATA_ENTITY || process.env.MASTERDATA_ENTITY,
    VTEX_MONEY_SCALE: process.env.VTEX_MONEY_SCALE || process.env.VTEX_BUDGET_MONEY_SCALE,
    VTEX_TIMEOUT_MS: process.env.VTEX_TIMEOUT_MS || process.env.VTEX_REQUEST_TIMEOUT_MS,
  });
  if (!result.success) {
    const missing = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Configuração inválida: ${missing}`);
  }

  cachedEnv = result.data;
  return result.data;
}
