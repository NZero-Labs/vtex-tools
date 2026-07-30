import { defineConfig } from "drizzle-kit"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run Drizzle commands")
}
if (!process.env.NEON_BRANCH || process.env.NEON_BRANCH !== process.env.DATABASE_ENV) {
  throw new Error("NEON_BRANCH must match DATABASE_ENV before running Drizzle commands")
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
})
