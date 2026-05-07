"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { HomeClient } from "@/components/features/HomeClient";
import { useBusy } from "@/components/features/BusyProvider";

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

// ─── Logo Icon ────────────────────────────────────────────────────────────────

function LogoIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden>
      <circle cx="24" cy="24" r="24" fill="url(#logo-grad)" />
      <path
        d="M16 28c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4v-2c0-2.2-1.8-4-4-4h-8c-2.2 0-4-1.8-4-4v-2c0-2.2 1.8-4 4-4h8c2.2 0 4 1.8 4 4"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M24 12v24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Floating dots decoration ─────────────────────────────────────────────────

function BackgroundDecoration() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Large blurred circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/8 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-500/8 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-3xl" />

      {/* Dots grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
    </div>
  );
}

// ─── Feature badge ─────────────────────────────────────────────────────────────

function FeatureBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
      <span className="text-[var(--accent)]">{icon}</span>
      {text}
    </div>
  );
}

// ─── Eye icon for password ────────────────────────────────────────────────────

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

// ─── AuthGate ─────────────────────────────────────────────────────────────────

export function AuthGate() {
  const [checking, setChecking] = React.useState(true);
  const [signedIn, setSignedIn] = React.useState(false);
  const [mode, setMode] = React.useState<"login" | "signup">("login");

  // Signup extras
  const [fullName, setFullName] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [cpf, setCpf] = React.useState("");

  // Shared
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const { run, isBusy } = useBusy();

  React.useEffect(() => {
    let alive = true;

    run(async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setSignedIn(!!data.session);
      setChecking(false);
    }).catch(() => {
      if (!alive) return;
      setChecking(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
      setChecking(false);
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goToLogin(withMessage?: string) {
    setMode("login");
    setError(null);
    setMessage(withMessage ?? null);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirm(false);
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim()) return setError("Informe seu e-mail.");
    if (!password) return setError("Informe sua senha.");

    await run(async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) setError(error.message);
    });
  }

  async function signUp(e: React.FormEvent) {
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
      const { data: cpfUsed, error: cpfErr } = await supabase.rpc("cpf_exists", { cpf_in: cpfDigits });

      if (cpfErr) {
        setError("Não foi possível validar o CPF agora. Tente novamente.");
        return;
      }
      if (cpfUsed) {
        setError("Este CPF já está cadastrado. Faça login ou use outro CPF.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            display_name: displayName.trim(),
            cpf: cpfDigits,
          },
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("duplicate") || msg.includes("unique") || msg.includes("cpf")) {
          setError("Este CPF já está cadastrado. Faça login ou use outro CPF.");
          return;
        }
        setError(error.message);
        return;
      }

      if (!data.session) {
        goToLogin("Conta criada! Agora faça login.");
        return;
      }

      await supabase.auth.signOut();
      goToLogin("Conta criada com sucesso! Agora faça login.");
    });
  }

  if (checking) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin" />
          </div>
          <p className="text-sm text-[var(--muted)]">Carregando…</p>
        </div>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="relative min-h-[100dvh] flex items-center justify-center bg-[var(--background)] px-4 py-8">
        <BackgroundDecoration />

        <div className="relative z-10 w-full max-w-md animate-fade-in">
          {/* Logo & brand */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex items-center justify-center rounded-2xl bg-[var(--surface)] p-3 shadow-lg shadow-black/10 border border-[var(--border)]">
              <LogoIcon />
            </div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
              Cadê meu dinheiro?
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {mode === "login"
                ? "Gerencie suas finanças com inteligência"
                : "Crie sua conta e comece agora"}
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl shadow-black/8 overflow-hidden">
            {/* Tab switcher */}
            <div className="flex border-b border-[var(--border)]">
              <button
                type="button"
                onClick={() => { setMode("login"); setError(null); setMessage(null); }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-all cursor-pointer ${
                  mode === "login"
                    ? "text-[var(--accent)] border-b-2 border-[var(--accent)] bg-[var(--accent)]/5"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)]"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setMessage(null);
                  setPassword("");
                  setConfirmPassword("");
                }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-all cursor-pointer ${
                  mode === "signup"
                    ? "text-[var(--accent)] border-b-2 border-[var(--accent)] bg-[var(--accent)]/5"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)]"
                }`}
              >
                Criar conta
              </button>
            </div>

            <div className="p-6">
              {mode === "login" ? (
                <form onSubmit={signIn} className="grid gap-4">
                  <Input
                    type="email"
                    label="E-mail"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                    leftIcon={
                      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                        <path d="M2.5 6.667A1.667 1.667 0 0 1 4.167 5h11.666A1.667 1.667 0 0 1 17.5 6.667v6.666A1.667 1.667 0 0 1 15.833 15H4.167A1.667 1.667 0 0 1 2.5 13.333V6.667z" stroke="currentColor" strokeWidth="1.5" />
                        <path d="m2.5 6.667 7.5 5 7.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    }
                  />

                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium text-[var(--foreground)]">Senha</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-[var(--muted)] pointer-events-none">
                        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                          <rect x="3" y="9" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M7 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Sua senha"
                        autoComplete="current-password"
                        className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-10 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-light)] outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        <EyeIcon open={showPassword} />
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 px-3 py-2.5">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-rose-500 shrink-0">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
                    </div>
                  )}

                  {message && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 px-3 py-2.5">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-emerald-500 shrink-0">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p>
                    </div>
                  )}

                  <Button type="submit" loading={isBusy} className="w-full mt-1">
                    Entrar
                  </Button>
                </form>
              ) : (
                <form onSubmit={signUp} className="grid gap-3.5">
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

                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium text-[var(--foreground)]">Senha</label>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-3 pr-10 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-light)] outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                      >
                        <EyeIcon open={showPassword} />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium text-[var(--foreground)]">Confirmar senha</label>
                    <div className="relative flex items-center">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a senha"
                        className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-3 pr-10 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-light)] outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                      >
                        <EyeIcon open={showConfirm} />
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 px-3 py-2.5">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-rose-500 shrink-0">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
                    </div>
                  )}

                  <Button type="submit" loading={isBusy} className="w-full mt-1">
                    Criar conta
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
            <FeatureBadge
              icon={<svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.5 5.5-4 4a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7 9.293l3.646-3.647a.5.5 0 0 1 .708.708z"/></svg>}
              text="Dados seguros"
            />
            <FeatureBadge
              icon={<svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3A1.5 1.5 0 0 1 15 10.5v3A1.5 1.5 0 0 1 13.5 15h-3A1.5 1.5 0 0 1 9 13.5v-3z"/></svg>}
              text="Suporte PWA"
            />
            <FeatureBadge
              icon={<svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H0V4zm0 3h16v5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V7zm3 2a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1H3zm2.5 0a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5z"/></svg>}
              text="PJ e pessoal"
            />
          </div>
        </div>
      </div>
    );
  }

  return <HomeClient />;
}
