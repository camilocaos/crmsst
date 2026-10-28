import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";
import { seedSeVazio } from "./seed";

const DB_PATH = process.env.CRM_DB_PATH ?? path.join(process.cwd(), "data", "crm.db");

function criarDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  seedSeVazio(db);
  return db;
}

export type DB = ReturnType<typeof criarDb>;

// Reaproveita a conexão entre recarregamentos do `next dev`
const globalDb = globalThis as unknown as { __crmDb?: DB };
export const db = globalDb.__crmDb ?? (globalDb.__crmDb = criarDb());
