"use client";

import * as React from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { HomeClient } from "@/components/features/HomeClient";
import { useBusy } from "@/components/features/BusyProvider";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function maskCPF(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <Input
      type={show ? "text" : "password"}
      label={label}
      placeholder={placeholder ?? "••••••"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      rightIcon={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          tabIndex={-1}
        >
          <EyeIcon open={show} />
        </button>
      }
    />
  );
}

function AlertBanner({ type, message }: { type: "error" | "success"; message: string }) {
  const styles =
    type === "error"
      ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300"
      : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300";

  const icon =
    type === "error" ? (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-rose-500">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-emerald-500">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
    );

  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${styles}`}>
      {icon}
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Brand panel (left side) ──────────────────────────────────────────────────

function BrandPanel() {
  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M7 9h10M7 12h7M7 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
      text: "Lançamentos pessoais e PJ",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
        </svg>
      ),
      text: "Metas e planejamento",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
          <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M6 15h3M15 15h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
      text: "Controle de gastos",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
          <path d="M21 21H3M21 3H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M6 21V12M10 21V6M14 21V10M18 21V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
      text: "Distribuição de salário",
    },
  ];

  return (
    <div
      className="hidden lg:flex flex-col justify-between p-10 w-[400px] shrink-0 relative overflow-hidden"
      style={{ backgroundColor: "#0f172a" }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #10b981, transparent)" }}
      />
      <div
        className="absolute bottom-0 left-0 h-56 w-56 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }}
      />

      {/* Logo */}
      <div className="relative">
        <div className="flex items-center gap-3 mb-12">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
              <path
                d="M12 6v12M8 10c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v.5c0 1.1-.9 2-2 2h-4c-1.1 0-2 .9-2 2v.5c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-none">Cadê meu</p>
            <p className="text-emerald-400 font-bold text-base leading-none">dinheiro?</p>
          </div>
        </div>

        <h2 className="text-white text-2xl font-bold leading-snug mb-3">
          Controle financeiro{" "}
          <span className="text-emerald-400">inteligente</span>
        </h2>
        <p className="text-white/50 text-sm leading-relaxed mb-10">
          Gerencie receitas, despesas e investimentos pessoais e PJ em um só lugar, com clareza e simplicidade.
        </p>

        {/* Feature pills */}
        <div className="grid gap-3">
          {features.map(({ icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="text-emerald-400 shrink-0">{icon}</span>
              <span className="text-white/70 text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-white/25 text-xs relative">© {new Date().getFullYear()} Cadê Meu Dinheiro?</p>
    </div>
  );
}

// ─── AuthGate ─────────────────────────────────────────────────────────────────

export function AuthGate() {
  const { status } = useSession();
  const checking = status === "loading";
  const signedIn = status === "authenticated";

  const [mode, setMode] = React.useState<"login" | "signup">("login");

  // Signup fields
  const [fullName, setFullName] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [cpf, setCpf] = React.useState("");

  // Shared fields
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const { run, isBusy } = useBusy();

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setError(null);
    setMessage(null);
    setPassword("");
    setConfirmPassword("");
  }

  function goToLogin(withMessage?: string) {
    switchMode("login");
    setMessage(withMessage ?? null);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!email.trim()) return setError("Informe seu e-mail.");
    if (!password) return setError("Informe sua senha.");

    await run(async () => {
      const result = await signIn("credentials", { email: email.trim(), password, redirect: false });
      if (result?.error) setError("E-mail ou senha incorretos.");
    });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const cpfDigits = onlyDigits(cpf);
    if (!fullName.trim()) return setError("Informe seu nome completo.");
    if (!displayName.trim()) return setError("Informe como quer ser chamado.");
    if (!email.trim()) return setError("Informe seu e-mail.");
    if (cpfDigits.length !== 11) return setError("CPF inválido (precisa ter 11 dígitos).");
    if (!password || password.length < 6) return setError("A senha precisa ter pelo menos 6 caracteres.");
    if (password !== confirmPassword) return setError("As senhas não conferem.");

    await run(async () => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          displayName: displayName.trim(),
          cpf: cpfDigits,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Erro ao criar conta. Tente novamente.");
        return;
      }
      goToLogin("Conta criada com sucesso! Agora faça login.");
    });
  }

  // Loading state
  if (checking) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin" />
          <p className="text-sm text-[var(--muted)]">Carregando…</p>
        </div>
      </div>
    );
  }

  if (signedIn) return <HomeClient />;

  return (
    <div className="min-h-[100dvh] flex" style={{ backgroundColor: "var(--background)" }}>
      {/* Left brand panel */}
      <BrandPanel />

      {/* Right auth panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[380px] animate-fade-in">

          {/* Mobile-only logo */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/25">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
                <path
                  d="M12 6v12M8 10c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v.5c0 1.1-.9 2-2 2h-4c-1.1 0-2 .9-2 2v.5c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2"
                  stroke="white" strokeWidth="1.8" strokeLinecap="round"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Cadê meu dinheiro?</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">Controle financeiro inteligente</p>
          </div>

          {/* Heading */}
          <div className="mb-6 lg:block">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">
              {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {mode === "login"
                ? "Entre com seu e-mail e senha para continuar."
                : "Preencha os dados abaixo para criar sua conta."}
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="p-6">
              {mode === "login" ? (
                <form onSubmit={handleSignIn} className="grid gap-4">
                  <Input
                    type="email"
                    label="E-mail"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                  />
                  <PasswordField
                    label="Senha"
                    value={password}
                    onChange={setPassword}
                    placeholder="Sua senha"
                    autoComplete="current-password"
                  />

                  {error && <AlertBanner type="error" message={error} />}
                  {message && <AlertBanner type="success" message={message} />}

                  <Button type="submit" loading={isBusy} className="w-full mt-1">
                    Entrar
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="grid gap-3.5">
                  <Input
                    type="text"
                    label="Nome completo"
                    placeholder="João da Silva"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    autoFocus
                  />
                  <Input
                    type="text"
                    label="Como quer ser chamado"
                    placeholder="João"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  <Input
                    type="text"
                    label="CPF"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(maskCPF(e.target.value))}
                    inputMode="numeric"
                  />
                  <Input
                    type="email"
                    label="E-mail"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                  <PasswordField
                    label="Senha"
                    value={password}
                    onChange={setPassword}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                  />
                  <PasswordField
                    label="Confirmar senha"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                  />

                  {error && <AlertBanner type="error" message={error} />}

                  <Button type="submit" loading={isBusy} className="w-full mt-1">
                    Criar conta
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Mode switcher */}
          <p className="mt-5 text-center text-sm text-[var(--muted)]">
            {mode === "login" ? "Ainda não tem conta? " : "Já tem uma conta? "}
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer transition-colors"
            >
              {mode === "login" ? "Criar conta" : "Entrar"}
            </button>
          </p>

          <p className="mt-4 text-center text-xs text-[var(--muted-light)]">
            Seus dados são armazenados com segurança e nunca compartilhados.
          </p>
        </div>
      </div>
    </div>
  );
}