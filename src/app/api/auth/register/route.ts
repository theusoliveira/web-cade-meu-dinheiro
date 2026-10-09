import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db/client";
import { newId } from "@/lib/finance/id";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";

function isValidEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Valida CPF com os dois dígitos verificadores. */
function isValidCPF(cpf: string) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digits = cpf.split("").map(Number);
  for (const len of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += digits[i] * (len + 1 - i);
    const check = ((sum * 10) % 11) % 10;
    if (check !== digits[len]) return false;
  }
  return true;
}

function str(v: unknown, max: number) {
  return typeof v === "string" ? v.trim().slice(0, max + 1) : "";
}

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`register:${clientIp(req.headers)}`, 5, 60 * 60_000)) {
    return error("Muitas tentativas. Tente novamente mais tarde.", 429);
  }
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return error("Requisição inválida.", 415);
  }

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") return error("Requisição inválida.", 400);

    const email = str(body.email, 254).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const fullName = str(body.fullName, 120);
    const displayName = str(body.displayName, 60);
    const cpf = str(body.cpf, 14).replace(/\D/g, "");

    if (!email || !password || !fullName || !cpf) return error("Campos obrigatórios faltando.", 400);
    if (fullName.length > 120 || displayName.length > 60) return error("Nome muito longo.", 400);
    if (!isValidEmail(email)) return error("E-mail inválido.", 400);
    if (password.length < 8 || password.length > 72) {
      return error("A senha precisa ter entre 8 e 72 caracteres.", 400);
    }
    if (!isValidCPF(cpf)) return error("CPF inválido.", 400);

    const sql = getDb();
    const [{ cpf_taken, email_taken }] = (await sql(
      `SELECT
         (EXISTS (SELECT 1 FROM public.users WHERE cpf = $1)) AS cpf_taken,
         (EXISTS (SELECT 1 FROM public.users WHERE email = $2)) AS email_taken`,
      [cpf, email],
    )) as { cpf_taken: boolean; email_taken: boolean }[];

    if (cpf_taken || email_taken) {
      return error("Não foi possível criar a conta com esses dados. Se já tem cadastro, faça login.", 409);
    }

    const hash = await bcrypt.hash(password, 12);
    await sql(
      `INSERT INTO public.users (id, email, password, full_name, display_name, cpf)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [newId(), email, hash, fullName, displayName || null, cpf],
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("register error:", err);
    return error("Erro interno. Tente novamente.", 500);
  }
}
