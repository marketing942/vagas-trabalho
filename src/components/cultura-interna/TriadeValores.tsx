"use client";

import { useState } from "react";

interface Valor {
  titulo: string;
  texto: string;
}

/** Círculos da tríade: em cima, embaixo à esquerda, embaixo à direita. */
const POS = [
  { cx: 240, cy: 135, tx: 240, ty: 100, fill: "#d3b87f", op: 0.3 },
  { cx: 160, cy: 270, tx: 120, ty: 284, fill: "#6f89d1", op: 0.36 },
  { cx: 320, cy: 270, tx: 360, ty: 284, fill: "#f6e3a8", op: 0.18 },
];

/**
 * Tríade dos valores: os três círculos e, ao lado, a definição de cada valor.
 * Passar o mouse, tocar ou usar o teclado em um valor destaca o círculo e o texto dele.
 */
export default function TriadeValores({ valores }: { valores: Valor[] }) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const alvo = (i: number | null) => ({
    onMouseEnter: () => setAtivo(i),
    onMouseLeave: () => setAtivo(null),
    onFocus: () => setAtivo(i),
    onBlur: () => setAtivo(null),
  });

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
              fill={p.fill}
              fillOpacity={ativo === i ? p.op * 2 : ativo === null ? p.op : p.op * 0.55}
              style={{ transition: "fill-opacity .35s" }}
            />
          ))}
          <circle cx={240} cy={225} r={62} fill="url(#tv-brilho)" opacity={ativo === null ? 1 : 0.5} style={{ transition: "opacity .35s" }} />
          {POS.map((p, i) => (
            <circle
              key={`c${i}`}
              cx={p.cx}
              cy={p.cy}
              r={120}
              fill="none"
              stroke="#d3b87f"
              strokeWidth={ativo === i ? 3.5 : 2}
              strokeOpacity={ativo === null || ativo === i ? 0.95 : 0.45}
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
              opacity={ativo === null || ativo === i ? 1 : 0.5}
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
              {...alvo(i)}
            />
          ))}
        </svg>
      </div>

      <ul className="space-y-4">
        {valores.map((v, i) => (
          <li
            key={v.titulo}
            data-reveal="right"
            style={{ ["--d" as string]: `${i * 110}ms` }}
            {...alvo(i)}
            onClick={() => setAtivo(i)}
            className={`rounded-3xl border p-6 transition duration-300 sm:p-7 ${
              ativo === i
                ? "border-[rgba(211,184,127,0.75)] bg-[rgba(211,184,127,0.12)] shadow-[0_24px_60px_-30px_rgba(211,184,127,0.7)]"
                : "border-[rgba(211,184,127,0.2)] bg-white/[0.03]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d3b87f] font-display text-sm font-extrabold text-[#1a1409]">{i + 1}</span>
              <h4 className="ci-gold-text text-2xl font-extrabold">{v.titulo}</h4>
            </div>
            <p className="mt-3 text-[1.02rem] leading-relaxed text-[#d6d0c2]">{v.texto}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
