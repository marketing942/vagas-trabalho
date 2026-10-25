"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";

interface AlignmentCheckProps {
  bemVindo: string[];
  naoBemVindo: string[];
}

type Column = "bem" | "nao";

/**
 * "Isso é a sua cara?": a cultura como filtro. A pessoa marca o que a descreve
 * e vê, na hora, se combina com o jeito de trabalhar do CPPEM.
 * Nada é enviado nem guardado: as respostas existem só nesta página.
 */
export default function AlignmentCheck({ bemVindo, naoBemVindo }: AlignmentCheckProps) {
  const [marked, setMarked] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const count = (col: Column) => [...marked].filter((k) => k.startsWith(`${col}-`)).length;
  const good = count("bem");
  const bad = count("nao");

  let result: { title: string; text: string; tone: "idle" | "good" | "mixed" | "bad" };
  if (good + bad === 0) {
    result = {
      title: "Marque o que descreve você.",
      text: "Seja sincero(a): a nossa cultura também é isso. Ninguém vê as suas respostas.",
      tone: "idle",
    };
  } else if (bad === 0) {
    result = {
      title: "Você combina com a gente.",
      text: `Você se reconheceu em ${good} de ${bemVindo.length} sinais de quem é bem-vindo(a) e em nenhum do outro lado. Vamos conversar?`,
      tone: "good",
    };
  } else if (good > bad) {
    result = {
      title: "Você se reconhece nos dois lados.",
      text: "Tudo bem ser honesto(a) com isso. Releia os mandamentos com calma e pense se esse é o jeito de trabalhar que você quer.",
      tone: "mixed",
    };
  } else {
    result = {
      title: "Talvez aqui não seja o seu lugar agora.",
      text: "E tudo bem. Preferimos que você saiba disso antes de se candidatar, e não depois.",
      tone: "bad",
    };
  }

  const toneBar =
    result.tone === "good" ? "bg-emerald-400" : result.tone === "bad" ? "bg-rose-400" : result.tone === "mixed" ? "bg-accent-400" : "bg-white/30";

  const renderList = (col: Column, items: string[]) => (
    <ul className="space-y-3">
      {items.map((item, i) => {
        const key = `${col}-${i}`;
        const on = marked.has(key);
        const isGood = col === "bem";
        return (
          <li key={key}>
            <input
              id={`al-${key}`}
              type="checkbox"
              checked={on}
              onChange={() => toggle(key)}
              className="peer sr-only"
            />
            <label
              htmlFor={`al-${key}`}
              className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-300 ${
                on
                  ? isGood
                    ? "border-emerald-300/70 bg-emerald-400/15"
                    : "border-rose-300/70 bg-rose-400/15"
                  : "border-white/15 bg-white/[0.04] hover:border-white/35"
              }`}
            >
              <span
                aria-hidden
                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition-colors ${
                  on
                    ? isGood
                      ? "border-emerald-300 bg-emerald-300 text-brand-950"
                      : "border-rose-300 bg-rose-300 text-brand-950"
                    : "border-white/40 text-transparent"
                }`}
              >
                <Icon name={isGood ? "check" : "close"} className="h-4 w-4" strokeWidth={3} />
              </span>
              <span className="text-lg font-semibold leading-snug text-white">{item}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <fieldset>
          <legend className="flex w-full items-center justify-between gap-3 border-b border-emerald-300/40 pb-3">
            <span className="inline-flex items-center gap-2 font-display text-xl font-extrabold text-emerald-300">
              <Icon name="check" className="h-5 w-5" /> Quem é bem-vindo(a) aqui
            </span>
            <span className="font-display text-sm font-bold tabular-nums text-emerald-300/80">
              {good}/{bemVindo.length}
            </span>
          </legend>
          <div className="mt-5">{renderList("bem", bemVindo)}</div>
        </fieldset>

        <fieldset>
          <legend className="flex w-full items-center justify-between gap-3 border-b border-rose-300/40 pb-3">
            <span className="inline-flex items-center gap-2 font-display text-xl font-extrabold text-rose-300">
              <Icon name="close" className="h-5 w-5" /> Quem NÃO é bem-vindo(a) aqui
            </span>
            <span className="font-display text-sm font-bold tabular-nums text-rose-300/80">
              {bad}/{naoBemVindo.length}
            </span>
          </legend>
          <div className="mt-5">{renderList("nao", naoBemVindo)}</div>
        </fieldset>
      </div>

      {/* Resultado */}
      <div className="mt-12 overflow-hidden rounded-3xl border border-white/15 bg-white/[0.06]">
        <div className={`h-1.5 transition-colors ${toneBar}`} />
        <div role="status" aria-live="polite" className="flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="font-display text-2xl font-extrabold text-white sm:text-3xl">{result.title}</p>
            <p className="mt-2 text-lg leading-relaxed text-brand-100">{result.text}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {result.tone === "good" && (
              <Link href="/carreiras#vagas" className="btn-primary">
                Ver vagas abertas
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
            )}
            {(result.tone === "mixed" || result.tone === "bad") && (
              <a href="#mandamentos" className="btn-ghost">
                Reler os mandamentos
              </a>
            )}
            {marked.size > 0 && (
              <button type="button" onClick={() => setMarked(new Set())} className="px-2 text-sm font-semibold text-brand-200 underline underline-offset-4 hover:text-white">
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-brand-200">Nada do que você marcar sai desta página. Não guardamos nenhuma resposta.</p>
    </div>
  );
}
