import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { newId } from "@/lib/finance/id";

export async function POST(req: NextRequest) {
  const sql = getDb();
  try {
    const { email, password, fullName, displayName, cpf } = await req.json();

    if (!email || !password || !fullName || !cpf) {
      return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha precisa ter pelo menos 6 caracteres." },
        { status: 400 },
      );
    }

    const cpfCheck = await sql`
      SELECT id FROM public.users WHERE cpf = ${cpf} LIMIT 1
    `;
    if (cpfCheck.length > 0) {
      return NextResponse.json(
        { error: "Este CPF já está cadastrado. Faça login ou use outro CPF." },
        { status: 409 },
      );
    }

    const emailCheck = await sql`
      SELECT id FROM public.users WHERE email = ${email} LIMIT 1
    `;
    if (emailCheck.length > 0) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado." },
        { status: 409 },
      );
    }

    const hash = await bcrypt.hash(password, 12);
    const id = newId();

    await sql`
      INSERT INTO public.users (id, email, password, full_name, display_name, cpf)
      VALUES (${id}, ${email}, ${hash}, ${fullName}, ${displayName ?? null}, ${cpf})
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("register error:", err);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}
