"use client";

import { useEffect, useRef, useState } from "react";

export interface ItemCapitulo {
  id: string;
  rotulo: string;
}

/** Barra fixa no alto: marca, capítulos (o atual fica dourado) e linha de progresso da leitura. */
export default function BarraCapitulos({ itens }: { itens: ItemCapitulo[] }) {
  const [ativo, setAtivo] = useState<string>("");
  const progresso = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const secoes = itens.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);

    const atualizar = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (progresso.current) progresso.current.style.transform = `scaleX(${p})`;

      const linha = window.innerHeight * 0.35;
      let atual = "";
      for (const s of secoes) if (s.getBoundingClientRect().top <= linha) atual = s.id;
      setAtivo((a) => (a === atual ? a : atual));
    };

    let quadro = 0;
    const agendar = () => {
      if (!quadro) quadro = requestAnimationFrame(() => ((quadro = 0), atualizar()));
    };
    atualizar();
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar);
    return () => {
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
      if (quadro) cancelAnimationFrame(quadro);
    };
  }, [itens]);

  // No celular, mantém o capítulo atual visível na faixa de botões.
  useEffect(() => {
    const el = lista.current?.querySelector<HTMLElement>('[aria-current="true"]');
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [ativo]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[rgba(211,184,127,0.16)] bg-[rgba(6,7,11,0.72)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#topo" className="flex shrink-0 items-center gap-2.5" aria-label="Voltar ao início">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/cppem.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
          <span className="hidden font-eyebrow text-sm font-bold uppercase tracking-[0.22em] text-[#d3b87f] sm:inline">Cultura</span>
        </a>
        <nav aria-label="Capítulos" className="min-w-0 flex-1">
          <div ref={lista} className="ci-scroll-x flex gap-1 overflow-x-auto py-2 sm:justify-end">
            {itens.map((i) => {
              const on = ativo === i.id;
              return (
                <a
                  key={i.id}
                  href={`#${i.id}`}
                  aria-current={on ? "true" : undefined}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[0.8rem] font-semibold transition-colors ${
                    on ? "bg-[#d3b87f] text-[#1a1409]" : "text-[#cfc8b8] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {i.rotulo}
                </a>
              );
            })}
          </div>
        </nav>
      </div>
      <div className="h-[2px] w-full bg-white/5">
        <div
          ref={progresso}
          className="h-full origin-left bg-gradient-to-r from-[#9c7a3c] via-[#f6e3a8] to-[#d3b87f]"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </header>
  );
}
