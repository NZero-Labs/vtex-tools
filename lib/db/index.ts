import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getServerEnv } from "@/lib/env";
import * as schema from "./schema";

const databaseUrl = getServerEnv().DATABASE_URL;
const globalDatabase = globalThis as typeof globalThis & { databasePool?: Pool };
const pool = globalDatabase.databasePool ?? new Pool({ connectionString: databaseUrl, max: 10 });

if (process.env.NODE_ENV !== "production") globalDatabase.databasePool = pool;

export const db = drizzle(pool, { schema });
