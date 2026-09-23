import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/lib/db/schema";

type VexaDatabase = ReturnType<typeof drizzle<typeof schema>>;

let database: VexaDatabase | undefined;
let sqlClient: ReturnType<typeof postgres> | undefined;

export function getDatabase(): VexaDatabase {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for database-backed operations.");
  }

  if (!sqlClient) {
    sqlClient = postgres(databaseUrl, {
      // A serverless function can be replicated many times. Keep each Vercel
      // instance to one pooled connection so a traffic spike cannot exhaust
      // the database; local long-running development can reuse a wider pool.
      max: process.env.VERCEL ? 1 : 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
    database = drizzle(sqlClient, { schema });
  }

  return database!;
}

export async function closeDatabase(): Promise<void> {
  if (sqlClient) await sqlClient.end();
  sqlClient = undefined;
  database = undefined;
}
