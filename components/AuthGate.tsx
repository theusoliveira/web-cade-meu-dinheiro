"use client";

import * as React from "react";
import { supabase } from "../lib/supabaseClient";
import { Button } from "./Button";
import { HomeClient } from "./HomeClient";
import { useBusy } from "./BusyProvider";

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

const inputBase =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-400/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-green-500 dark:placeholder:text-zinc-500";

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

  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const { run } = useBusy();

  React.useEffect(() => {
    let alive = true;

    run(async () => {
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        setSignedIn(!!data.session);
        setChecking(false);
      })
      .catch(() => {
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
    if (!password || password.length < 6)
      return setError("A senha precisa ter pelo menos 6 caracteres.");
    if (password !== confirmPassword) return setError("As senhas não conferem.");

    await run(async () => {
      const { data: cpfUsed, error: cpfErr } = await supabase.rpc("cpf_exists", {
        cpf_in: cpfDigits,
      });

      if (cpfErr) {
        console.error(cpfErr);
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
      <div className="min-h-[100dvh] grid place-items-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-zinc-950">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Carregando…</p>
        </div>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="min-h-[100dvh] grid place-items-center bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-green-950 dark:via-zinc-950 dark:to-zinc-950 px-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-green-600 shadow-lg text-3xl mb-4">
              💸
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              Cadê meu dinheiro?
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {mode === "login"
                ? "Faça login para acessar sua conta"
                : "Crie sua conta gratuitamente"}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-base font-bold text-zinc-900 dark:text-zinc-50">
              {mode === "login" ? "Entrar" : "Criar conta"}
            </h2>

            {mode === "login" ? (
              <form onSubmit={signIn} className="grid gap-3">
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputBase}
                />
                <input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputBase}
                />

                {error ? (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                    {error}
                  </p>
                ) : null}
                {message ? (
                  <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
                    {message}
                  </p>
                ) : null}

                <Button type="submit" className="mt-1 w-full">
                  Entrar
                </Button>

                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs text-zinc-400 dark:bg-zinc-950">ou</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full border border-zinc-200 dark:border-zinc-800"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setMessage(null);
                    setPassword("");
                    setConfirmPassword("");
                  }}
                >
                  Criar conta nova
                </Button>
              </form>
            ) : (
              <form onSubmit={signUp} className="grid gap-3">
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputBase}
                />
                <input
                  type="text"
                  placeholder="Como quer ser chamado?"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputBase}
                />
                <input
                  type="text"
                  placeholder="CPF"
                  value={cpf}
                  onChange={(e) => setCpf(maskCPF(e.target.value))}
                  inputMode="numeric"
                  className={inputBase}
                />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputBase}
                />
                <input
                  type="password"
                  placeholder="Senha (mín. 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputBase}
                />
                <input
                  type="password"
                  placeholder="Confirmar senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputBase}
                />

                {error ? (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                    {error}
                  </p>
                ) : null}
                {message ? (
                  <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
                    {message}
                  </p>
                ) : null}

                <Button type="submit" className="mt-1 w-full">
                  Criar conta
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => goToLogin()}>
                  Já tenho conta — fazer login
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <HomeClient />;
}
