"use client";

import { useState } from "react";

interface Valor {
  titulo: string;
  texto: string;
}

/** Círculos da tríade: em cima, embaixo à esquerda, embaixo à direita (todos na mesma cor dourada). */
const COR = "#d3b87f";
const OPACIDADE = 0.26;
const POS = [
  { cx: 240, cy: 135, tx: 240, ty: 100 },
  { cx: 160, cy: 270, tx: 120, ty: 284 },
  { cx: 320, cy: 270, tx: 360, ty: 284 },
];

/**
 * Tríade dos valores: os três círculos e, ao lado, a definição de cada valor.
 * Clicar, tocar ou usar o teclado em um valor o seleciona: o círculo é destacado e a descrição abre.
 */
export default function TriadeValores({ valores }: { valores: Valor[] }) {
  // O valor escolhido (clique, toque ou teclado) fica selecionado até a pessoa escolher outro.
  const [ativo, setAtivo] = useState<number>(0);

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
      <div data-reveal="zoom" className="ci-panel mx-auto w-full max-w-xl p-5 sm:p-8">
        <svg viewBox="0 0 480 410" role="img" aria-label={`Tríade dos valores do CPPEM: ${valores.map((v) => v.titulo).join(", ")}.`} className="h-auto w-full">
          <defs>
            <radialGradient id="tv-brilho" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#fbf6e9" stopOpacity="0.6" />
              <stop offset="1" stopColor="#fbf6e9" stopOpacity="0" />
            </radialGradient>
          </defs>
          {POS.map((p, i) => (
            <circle
              key={`f${i}`}
              cx={p.cx}
              cy={p.cy}
              r={120}
              fill={COR}
              fillOpacity={ativo === i ? OPACIDADE * 2 : OPACIDADE * 0.55}
              style={{ transition: "fill-opacity .35s" }}
            />
          ))}
          <circle cx={240} cy={225} r={62} fill="url(#tv-brilho)" opacity={0.6} style={{ transition: "opacity .35s" }} />
          {POS.map((p, i) => (
            <circle
              key={`c${i}`}
              cx={p.cx}
              cy={p.cy}
              r={120}
              fill="none"
              stroke="#d3b87f"
              strokeWidth={ativo === i ? 3.5 : 2}
              strokeOpacity={ativo === i ? 0.95 : 0.45}
              style={{ transition: "all .35s" }}
            />
          ))}
          {POS.map((p, i) => (
            <text
              key={`t${i}`}
              x={p.tx}
              y={p.ty}
              textAnchor="middle"
              fontSize={21}
              fontWeight={800}
              fill="#fff"
              opacity={ativo === i ? 1 : 0.55}
              style={{ fontFamily: "var(--font-display), system-ui, sans-serif", transition: "opacity .35s" }}
            >
              {valores[i].titulo}
            </text>
          ))}
          {/* áreas clicáveis (só o miolo de cada círculo) */}
          {POS.map((p, i) => (
            <circle
              key={`a${i}`}
              cx={p.cx}
              cy={p.cy}
              r={78}
              fill="transparent"
              role="button"
              tabIndex={0}
              aria-label={`${valores[i].titulo}: ${valores[i].texto}`}
              style={{ cursor: "pointer", outline: "none" }}
              onClick={() => setAtivo(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setAtivo(i);
                }
              }}
            />
          ))}
        </svg>
      </div>

      <ul className="space-y-3">
        {valores.map((v, i) => {
          const on = ativo === i;
          return (
            <li
              key={v.titulo}
              className={`rounded-3xl border transition-colors duration-300 ${
                on ? "border-[rgba(211,184,127,0.75)] bg-[rgba(211,184,127,0.1)] shadow-[0_24px_60px_-30px_rgba(211,184,127,0.7)]" : "border-[rgba(211,184,127,0.2)] bg-white/[0.03]"
              }`}
            >
              <button
                type="button"
                onClick={() => setAtivo(i)}
                aria-expanded={on}
                aria-controls={`valor-desc-${i}`}
                className="flex w-full items-center gap-3 rounded-3xl p-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d3b87f] sm:p-6"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d3b87f] font-display text-sm font-extrabold text-[#1a1409]">{i + 1}</span>
                <span className="ci-gold-text text-2xl font-extrabold">{v.titulo}</span>
              </button>
              {/* a descrição abre e fecha suavemente, sem mudar o resto da página de lugar */}
              <div id={`valor-desc-${i}`} className={`grid transition-[grid-template-rows] duration-300 ease-out ${on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <p className={`px-5 pb-6 text-[1.02rem] leading-relaxed text-[#d6d0c2] transition-opacity duration-300 sm:px-6 ${on ? "opacity-100" : "opacity-0"}`}>{v.texto}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
