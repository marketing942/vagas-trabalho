"use client";

import { useActionState } from "react";
import Logos from "./Logos";
import { entrar, type EstadoAcesso } from "@/app/interno/cultura/actions";

/** Tela de senha da página interna (só aparece se CULTURA_INTERNA_SENHA estiver definida). */
export default function Acesso() {
  const [estado, acao, pendente] = useActionState<EstadoAcesso, FormData>(entrar, { erro: null });

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center px-4 py-16">
      <div aria-hidden className="absolute left-1/2 top-1/3 -z-10 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(211,184,127,0.16),transparent_65%)]" />
      <form action={acao} className="ci-panel w-full max-w-sm p-8 text-center">
        <div className="flex justify-center">
          <Logos tam="h-20" />
        </div>
        <h1 className="ci-gold-text mt-4 text-3xl font-extrabold">Cultura CPPEM</h1>
        <p className="mt-2 text-sm text-[#c9c3b4]">Material interno da equipe. Digite a senha para entrar.</p>
        <label htmlFor="senha" className="sr-only">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          placeholder="Senha da equipe"
          className="mt-6 w-full rounded-xl border border-[rgba(211,184,127,0.3)] bg-black/40 px-4 py-3 text-center text-white placeholder:text-[#8f897b] focus:border-[#d3b87f] focus:outline-none focus:ring-2 focus:ring-[#d3b87f]/40"
        />
        {estado.erro && (
          <p role="alert" className="mt-3 text-sm font-semibold text-rose-300">
            {estado.erro}
          </p>
        )}
        <button
          type="submit"
          disabled={pendente}
          className="mt-5 w-full rounded-full bg-gradient-to-br from-[#f0dcb0] via-[#c9ae7a] to-[#af9256] px-6 py-3 text-sm font-bold text-[#1a1409] transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {pendente ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
