"use client";

import { useState } from "react";

/** Cor das barras: azul-marinho da marca (contraste ≥ 3:1 sobre o branco do painel). */
const BAR = "#1e2f5e";

const nf = new Intl.NumberFormat("pt-BR");

/** Teto "redondo" para o eixo (1, 2, 5 x 10^n). */
function niceMax(v: number): number {
  if (v <= 4) return Math.max(1, Math.ceil(v));
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (v <= m * p) return m * p;
  return 10 * p;
}

export interface Datum {
  label: string;
  value: number;
  /** Texto do tooltip / leitura acessível (opcional) */
  detail?: string;
}

/** Card padrão dos gráficos do painel. */
export function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5" aria-label={title}>
      <h2 className="font-bold text-brand-950">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-brand-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Barras horizontais ordenadas (uma série, uma cor), valor na ponta. */
export function RankBars({ data, empty = "Sem dados no período." }: { data: Datum[]; empty?: string }) {
  if (!data.length || data.every((d) => d.value === 0)) return <p className="text-sm text-brand-500">{empty}</p>;
  const max = Math.max(...data.map((d) => d.value));
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.label} className="grid grid-cols-[minmax(0,40%)_1fr] items-center gap-3" title={d.detail}>
          <span className="truncate text-sm text-brand-800">{d.label}</span>
          <span className="flex items-center gap-2">
            <span
              className="h-4 rounded-r-[4px]"
              style={{ width: `${max ? (d.value / max) * 85 : 0}%`, minWidth: d.value ? 3 : 0, background: BAR }}
              aria-hidden
            />
            <span className="text-sm font-semibold tabular-nums text-brand-900">{nf.format(d.value)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Colunas ao longo do tempo, com eixo, tooltip ao passar o mouse/foco e tabela opcional. */
export function ColumnChart({ data, unit, unitOne, height = 180 }: { data: Datum[]; unit: string; unitOne: string; height?: number }) {
  const u = (n: number) => (n === 1 ? unitOne : unit);
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const ticks = [max, max / 2, 0];
  return (
    <div>
      <div className="flex gap-2">
        {/* eixo Y */}
        <div className="flex flex-col justify-between text-right text-xs tabular-nums text-brand-500" style={{ height }} aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0">
              {nf.format(Math.round(t))}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          {/* grade */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden>
            {ticks.map((t) => (
              <span key={t} className="h-px w-full bg-brand-100" />
            ))}
          </div>
          <div className="relative flex items-end gap-[2px]" style={{ height }} role="list" aria-label={`Gráfico de ${unit}`}>
            {data.map((d, i) => (
              <div
                key={d.label + i}
                role="listitem"
                tabIndex={0}
                aria-label={`${d.detail ?? d.label}: ${nf.format(d.value)} ${u(d.value)}`}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className="group relative flex h-full flex-1 items-end justify-center outline-none"
              >
                <span
                  className="w-full max-w-[24px] rounded-t-[4px] transition-opacity group-hover:opacity-80 group-focus-visible:ring-2 group-focus-visible:ring-accent-500"
                  style={{ height: `${max ? (d.value / max) * 100 : 0}%`, minHeight: d.value ? 2 : 0, background: BAR }}
                />
                {hover === i && (
                  <span className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg bg-brand-950 px-2.5 py-1.5 text-xs text-white shadow-lg">
                    <strong className="text-sm">{nf.format(d.value)}</strong> {u(d.value)}
                    <span className="block text-brand-200">{d.detail ?? d.label}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
          {/* eixo X: primeiro, meio e último rótulos */}
          <div className="mt-1.5 flex justify-between text-xs text-brand-500" aria-hidden>
            <span>{data[0]?.label}</span>
            {data.length > 2 && <span>{data[Math.floor(data.length / 2)]?.label}</span>}
            <span>{data[data.length - 1]?.label}</span>
          </div>
        </div>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-brand-600 hover:text-brand-900">Ver em tabela</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-xs uppercase text-brand-500">
            <tr>
              <th className="py-1 font-semibold">Período</th>
              <th className="py-1 text-right font-semibold">{unit}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {data.map((d, i) => (
              <tr key={d.label + i}>
                <td className="py-1 text-brand-800">{d.detail ?? d.label}</td>
                <td className="py-1 text-right tabular-nums text-brand-900">{nf.format(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

/** Indicador (stat tile): rótulo, valor e variação opcional. */
export function StatTile({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string;
  /** Variação em % contra o período anterior (positivo = subiu) */
  delta?: number | null;
  hint?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-sm text-brand-600">{label}</p>
      <p className="mt-1 text-3xl font-bold text-brand-950">{value}</p>
      {delta != null && Number.isFinite(delta) ? (
        <p className={`mt-1 text-xs font-semibold ${delta > 0 ? "text-emerald-700" : delta < 0 ? "text-rose-700" : "text-brand-500"}`}>
          {delta > 0 ? "▲" : delta < 0 ? "▼" : "="} {Math.abs(Math.round(delta))}% <span className="font-normal text-brand-500">vs. período anterior</span>
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-brand-500">{hint}</p>
      )}
    </div>
  );
}
