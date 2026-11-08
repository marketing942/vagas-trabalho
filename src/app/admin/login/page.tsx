"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";
import { SYSTEM_NAME } from "@/lib/constants";

export default function LoginPage() {

  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }

    router.replace("/admin/dashboard");
    router.refresh();
  }

  return (
    <main className="rh flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-950">
            <Logo className="h-7" />
          </span>
          <div className="leading-tight">
            <h1 className="text-lg font-semibold tracking-tight text-brand-950">
              RH <span className="text-accent-600">CPPEM</span>
            </h1>
            <p className="text-[13px] text-stone-500">Recrutamento e seleção · CPPEM Colégio e Cursos</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6">
          <p className="text-sm font-medium text-brand-950">Entre com seu e-mail da equipe</p>
          <div>
            <label className="label" htmlFor="email">
              E-mail
            </label>
            <input id="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="seu@cppem.com.br" />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Senha
            </label>
            <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" />
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-60">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-stone-500">{SYSTEM_NAME} · acesso restrito à equipe</p>
      </div>
    </main>
  );
}
