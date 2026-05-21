import "server-only";
import { neon } from "@neondatabase/serverless";

type QueryResult = Record<string, unknown>[];

type NeonClient = (query: string, params?: unknown[]) => Promise<QueryResult>;

let _db: NeonClient | null = null;

export function getDb(): NeonClient {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing environment variable: DATABASE_URL");
  const sql = neon(url);
  _db = (query, params) => sql(query, params) as Promise<QueryResult>;
  return _db;
}