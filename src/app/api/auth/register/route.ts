import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db/client";
import { newId } from "@/lib/finance/id";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidCPF(cpf: string) {
  // 11 digits only, not all-same (basic sanity check)
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  return true;
}

export async function POST(req: NextRequest) {
  const sql = getDb();
  try {
    const body = await req.json();
    const { email, password, fullName, displayName, cpf } = body as Record<string, string>;

    // Input validation
    if (!email || !password || !fullName || !cpf) {
      return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "A senha precisa ter pelo menos 6 caracteres." }, { status: 400 });
    }
    if (!isValidCPF(cpf)) {
      return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
    }

    // Check uniqueness in a single query for efficiency
    const conflictCheck = await sql(
      `SELECT
         (EXISTS (SELECT 1 FROM public.users WHERE cpf = $1)) AS cpf_taken,
         (EXISTS (SELECT 1 FROM public.users WHERE email = $2)) AS email_taken`,
      [cpf, email.toLowerCase().trim()],
    );
    const { cpf_taken, email_taken } = conflictCheck[0] as { cpf_taken: boolean; email_taken: boolean };

    if (cpf_taken) {
      return NextResponse.json({ error: "Este CPF já está cadastrado. Faça login ou use outro CPF." }, { status: 409 });
    }
    if (email_taken) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 12);
    const id = newId();

    await sql(
      `INSERT INTO public.users (id, email, password, full_name, display_name, cpf)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, email.toLowerCase().trim(), hash, fullName.trim(), displayName?.trim() ?? null, cpf],
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("register error:", err);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}
