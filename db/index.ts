import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy initialization — DATABASE_URL is only needed at runtime, not at build time
let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set. Required for database access.");
    }
    const sql = neon(process.env.DATABASE_URL);
    _db = drizzle({
      client: sql,
      schema: { ...schema },
      casing: "snake_case",
    });
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const dbInstance = getDb();
    // Dynamic proxy — forwards any property access to the lazily-initialised drizzle instance.
    // biome-ignore lint/suspicious/noExplicitAny: dynamic proxy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (dbInstance as any)[prop];
  },
});

export type Database = ReturnType<typeof drizzle>;
