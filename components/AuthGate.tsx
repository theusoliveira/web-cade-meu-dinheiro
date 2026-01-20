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

  const busy = useBusy();

  React.useEffect(() => {
    let alive = true;

    // Mostra loading global enquanto checa sessão inicial
    busy
      .run(async () => {
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        setSignedIn(!!data.session);
        setChecking(false);
      })
      .catch(() => {
        // se der erro, a gente só libera a tela
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
    // você pode limpar os demais também, se quiser:
    // setFullName(""); setDisplayName(""); setCpf("");
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim()) return setError("Informe seu e-mail.");
    if (!password) return setError("Informe sua senha.");

    await busy.run(async () => {
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

    await busy.run(async () => {
      // 1) Checar se CPF já existe
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

      // 2) Criar usuário no Supabase Auth
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

        // Se por corrida/conflito o CPF duplicar (unique constraint), você pode receber erro do DB
        if (msg.includes("duplicate") || msg.includes("unique") || msg.includes("cpf")) {
          setError("Este CPF já está cadastrado. Faça login ou use outro CPF.");
          return;
        }

        // Se provider email/signup estiver desabilitado, costuma cair aqui também
        setError(error.message);
        return;
      }

      // Se confirm email estiver ligado, session vem null
      if (!data.session) {
        setMessage(
          "Conta criada! Se você ativou confirmação de e-mail, verifique sua caixa de entrada."
        );
        goToLogin("Conta criada! Agora faça login.");
        return;
      }

      // Se criou e já logou, fazemos signOut e voltamos pro login (como você pediu)
      await supabase.auth.signOut();
      goToLogin("Conta criada com sucesso! Agora faça login.");
    });
  }

  if (checking) {
    // você pode manter essa tela; o overlay global também vai aparecer por causa do busy.run no getSession()
    return (
      <div className="min-h-screen grid place-items-center bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Carregando…</p>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="min-h-screen grid place-items-center bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-lg font-semibold">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {mode === "login"
              ? "Faça login para acessar a aplicação"
              : "Preencha seus dados para criar uma conta"}
          </p>

          {mode === "login" ? (
            <form onSubmit={signIn} className="mt-4 grid gap-3">
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-950"
              />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-950"
              />

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

              <Button type="submit" className="w-full">
                Entrar
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setMessage(null);
                  setPassword("");
                  setConfirmPassword("");
                }}
              >
                Criar conta
              </Button>
            </form>
          ) : (
            <form onSubmit={signUp} className="mt-4 grid gap-3">
              <input
                type="text"
                placeholder="Nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-950"
              />

              <input
                type="text"
                placeholder="Apelido"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-950"
              />

              <input
                type="text"
                placeholder="CPF"
                value={cpf}
                onChange={(e) => setCpf(maskCPF(e.target.value))}
                inputMode="numeric"
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-950"
              />

              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-950"
              />

              <input
                type="password"
                placeholder="Senha (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-950"
              />

              <input
                type="password"
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-950"
              />

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

              <Button type="submit" className="w-full">
                Criar conta
              </Button>

              <Button type="button" variant="ghost" className="w-full" onClick={() => goToLogin()}>
                Já tenho conta
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return <HomeClient />;
}
