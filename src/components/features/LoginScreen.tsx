"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
  return open ? <Eye className="h-4 w-4" aria-hidden /> : <EyeOff className="h-4 w-4" aria-hidden />;
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
      <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
    ) : (
      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
    );

  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${styles}`}>
      {icon}
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── LoginScreen ─────────────────────────────────────────────────────────────────

export function LoginScreen() {
  const router = useRouter();

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
      else router.refresh();
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
    if (!password || password.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.");
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
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Erro ao criar conta. Tente novamente.");
        return;
      }
      goToLogin("Conta criada com sucesso! Agora faça login.");
    });
  }

  return (
    <div className="min-h-[100dvh] flex bg-[var(--background)]">
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[380px]">

          {/* Logo */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
                <path
                  d="M12 6v12M8 10c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v.5c0 1.1-.9 2-2 2h-4c-1.1 0-2 .9-2 2v.5c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2"
                  stroke="white" strokeWidth="1.8" strokeLinecap="round"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Cadê meu dinheiro?</h1>
          </div>

          {/* Heading */}
          <div className="mb-5 text-center">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {mode === "login"
                ? "Entre com seu e-mail e senha para continuar."
                : "Preencha os dados abaixo para criar sua conta."}
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
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
                    placeholder="Mínimo 8 caracteres"
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
              className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 cursor-pointer transition-colors"
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