import "server-only";
import { auth } from "@/lib/auth";

/**
 * Helpers de segurança compartilhados pelas Server Actions.
 * Server Actions são endpoints públicos: todo argumento vindo do cliente
 * precisa ser validado aqui, mesmo que o TypeScript diga o contrário.
 */

export class ValidationError extends Error {}

export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Não autenticado");
  return id;
}

function fail(field: string): never {
  throw new ValidationError(`Valor inválido: ${field}`);
}

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const YM_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function vId(v: unknown, field = "id"): string {
  if (typeof v !== "string" || !ID_RE.test(v)) fail(field);
  return v;
}

export function vOptionalId(v: unknown, field = "id"): string | null {
  if (v === null || v === undefined || v === "") return null;
  return vId(v, field);
}

export function vIds(v: unknown, max = 500): string[] {
  if (!Array.isArray(v) || v.length > max) fail("ids");
  return v.map((x) => vId(x));
}

/** Mês YYYY-MM, ou a chave fixa "global" usada pelas telas de distribuição. */
export function vYm(v: unknown, field = "mês"): string {
  if (typeof v !== "string" || (v !== "global" && !YM_RE.test(v))) fail(field);
  return v;
}

export function vYear(v: unknown): string {
  if (typeof v !== "string" || !/^\d{4}$/.test(v)) fail("ano");
  return v;
}

export function vDate(v: unknown, field = "data"): string {
  if (typeof v !== "string" || !DATE_RE.test(v) || Number.isNaN(Date.parse(v))) fail(field);
  return v;
}

export function vText(v: unknown, field: string, { max = 200, required = false } = {}): string {
  if (v === null || v === undefined) v = "";
  if (typeof v !== "string") fail(field);
  const s = v.trim();
  if (s.length > max || (required && !s)) fail(field);
  return s;
}

/** Valores monetários: finitos, não-negativos e com teto razoável. */
export function vMoney(v: unknown, field = "valor", { allowNegative = false } = {}): number {
  const n = typeof v === "string" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n) || Math.abs(n) > 1e12) fail(field);
  if (!allowNegative && n < 0) fail(field);
  return Math.round(n * 100) / 100;
}

export function vOptionalMoney(v: unknown, field = "valor"): number | null {
  if (v === null || v === undefined || v === "") return null;
  return vMoney(v, field);
}

export function vNumber(v: unknown, field: string, min: number, max: number): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max) fail(field);
  return v;
}

export function vInt(v: unknown, field: string, min: number, max: number): number {
  return Math.trunc(vNumber(v, field, min, max));
}

export function vBool(v: unknown, field: string): boolean {
  if (typeof v !== "boolean") fail(field);
  return v;
}

export function vEnum<T extends string>(v: unknown, allowed: readonly T[], field: string): T {
  if (typeof v !== "string" || !allowed.includes(v as T)) fail(field);
  return v as T;
}

export function vObject(v: unknown, field = "dados"): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) fail(field);
  return v as Record<string, unknown>;
}

export const ENTRY_KINDS = ["income", "expense", "investment"] as const;
export const SCOPES = ["personal", "business"] as const;
