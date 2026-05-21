import "server-only";
import { neon } from "@neondatabase/serverless";

// Singleton — reutiliza a conexão durante o lifecycle do servidor
// evita criar um novo cliente a cada chamada de Server Action
let _db: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing environment variable: DATABASE_URL");
  _db = neon(url);
  return _db;
}
