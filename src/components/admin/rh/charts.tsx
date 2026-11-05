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

/** Barras horizontais (uma série, uma cor): rótulo e valor em cima, barra embaixo. */
export function RankBars({ data, empty = "Sem dados no período.", unit, total }: { data: Datum[]; empty?: string; unit?: string; total?: number }) {
  if (!data.length || data.every((d) => d.value === 0)) return <p className="text-sm text-brand-500">{empty}</p>;
  const max = Math.max(...data.map((d) => d.value));
  return (
    <>
      <ul className="space-y-3">
        {data.map((d) => (
          <li key={d.label} title={d.detail}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-brand-800">{d.label}</span>
              <span className="shrink-0 tabular-nums">
                <strong className="font-bold text-brand-950">{nf.format(d.value)}</strong>
                {total ? <span className="ml-1.5 text-xs text-brand-500">{Math.round((d.value / total) * 100)}%</span> : null}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-50" aria-hidden>
              <div className="h-full rounded-full" style={{ width: `${max ? (d.value / max) * 100 : 0}%`, minWidth: d.value ? 4 : 0, background: BAR }} />
            </div>
          </li>
        ))}
      </ul>
      {unit && <DataTable data={data} unit={unit} first="Item" />}
    </>
  );
}

/* ------------------------------------------------------------------
 * Componentes do painel (visual inspirado em CRMs modernos)
 * ---------------------------------------------------------------- */

/** Filtro em pílulas (segmentado), ex.: 30D · 90D · 12M. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: T; label: string; title?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-brand-100 bg-white p-1 shadow-sm" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          title={o.title}
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
            value === o.key ? "bg-brand-900 text-white shadow" : "text-brand-600 hover:bg-brand-50 hover:text-brand-900"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Pílula de variação contra o período anterior. */
export function DeltaPill({ delta }: { delta: number | null | undefined }) {
  if (delta == null || !Number.isFinite(delta)) return null;
  const d = Math.round(delta);
  const tone = d > 0 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : d < 0 ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-brand-50 text-brand-600 ring-brand-100";
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ring-1 ${tone}`} title="vs. período anterior">
      {d > 0 ? "▲" : d < 0 ? "▼" : "="} {Math.abs(d)}%
    </span>
  );
}

/** Linha pequena de tendência (decorativa: o valor está no card). */
export function Sparkline({ values, className = "h-9 w-24" }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${30 - (v / max) * 26 - 2}`);
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={className} aria-hidden>
      <polygon points={`0,30 ${pts.join(" ")} 100,30`} fill={BAR} opacity={0.08} />
      <polyline points={pts.join(" ")} fill="none" stroke={BAR} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Card de indicador: ícone em círculo, rótulo, número grande, variação e linha de tendência. */
export function KpiCard({
  icon,
  label,
  value,
  hint,
  delta,
  spark,
  tone = "brand",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  delta?: number | null;
  spark?: number[];
  tone?: "brand" | "gold" | "green" | "violet";
}) {
  const ring = { brand: "bg-brand-50 text-brand-700", gold: "bg-accent-50 text-accent-700", green: "bg-emerald-50 text-emerald-700", violet: "bg-violet-50 text-violet-700" }[tone];
  return (
    <div className="flex flex-col justify-between rounded-[22px] border border-brand-100 bg-white p-5 shadow-[0_1px_2px_rgba(11,26,64,0.04),0_8px_24px_-12px_rgba(11,26,64,0.12)]">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${ring}`} aria-hidden>
          {icon}
        </span>
        <p className="text-sm font-medium leading-tight text-brand-600">{label}</p>
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[28px] font-extrabold leading-none tracking-tight text-brand-950 tabular-nums">{value}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-brand-500">
            <DeltaPill delta={delta} />
            {hint && <span>{hint}</span>}
          </div>
        </div>
        {spark && <Sparkline values={spark} />}
      </div>
    </div>
  );
}

/** Card de painel com título, subtítulo e ações à direita. */
export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-[22px] border border-brand-100 bg-white p-5 shadow-[0_1px_2px_rgba(11,26,64,0.04),0_8px_24px_-12px_rgba(11,26,64,0.12)] sm:p-6 ${className}`}
      aria-label={title}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-brand-950">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[13px] text-brand-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Gráfico de área ao longo do tempo, com linha-guia e tooltip ao passar o mouse / setas do teclado. */
export function AreaChart({ data, unit, unitOne, height = 220 }: { data: Datum[]; unit: string; unitOne: string; height?: number }) {
  const u = (n: number) => (n === 1 ? unitOne : unit);
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const ticks = [max, (max * 3) / 4, max / 2, max / 4, 0];
  const n = data.length;
  const x = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 100 - (max ? (v / max) * 100 : 0);
  const line = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const pick = (clientX: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const i = Math.round(((clientX - r.left) / r.width) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };
  const h = hover != null ? data[hover] : null;
  // Até 7 rótulos no eixo X; o último sempre aparece (e tira o vizinho se ficar colado)
  const labelEvery = Math.max(1, Math.ceil(n / 7));
  const shown = data.map((_, i) => i).filter((i) => i % labelEvery === 0 && n - 1 - i >= labelEvery / 2);
  if (n) shown.push(n - 1);
  return (
    <div>
      <div className="flex gap-3">
        <div className="relative w-8 shrink-0 text-right text-[11px] tabular-nums text-brand-400" style={{ height }} aria-hidden>
          {ticks.map((t, i) => (
            <span key={i} className="absolute right-0 -translate-y-1/2 leading-none" style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}>
              {nf.format(Math.round(t))}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="relative cursor-crosshair rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            style={{ height }}
            tabIndex={0}
            role="img"
            aria-label={`Gráfico de ${unit}. Use as setas para ler cada ponto.`}
            onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover((v) => v ?? n - 1)}
            onBlur={() => setHover(null)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") setHover((v) => Math.min(n - 1, (v ?? -1) + 1));
              if (e.key === "ArrowLeft") setHover((v) => Math.max(0, (v ?? n) - 1));
            }}
          >
            {ticks.map((_, i) => (
              <span key={i} className={`pointer-events-none absolute inset-x-0 h-px ${i === ticks.length - 1 ? "bg-brand-200" : "border-t border-dashed border-brand-100"}`} style={{ top: `${(i / (ticks.length - 1)) * 100}%` }} aria-hidden />
            ))}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
              <defs>
                <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={BAR} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={BAR} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              {n > 0 && <polygon points={`${x(0)},100 ${line} ${x(n - 1)},100`} fill="url(#area-fill)" />}
              <polyline points={line} fill="none" stroke={BAR} strokeWidth={2.25} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            {h && hover != null && (
              <>
                <span className="pointer-events-none absolute inset-y-0 w-px bg-brand-300" style={{ left: `${x(hover)}%` }} aria-hidden />
                <span
                  className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                  style={{ left: `${x(hover)}%`, top: `${y(h.value)}%`, background: BAR }}
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute top-0 z-10 whitespace-nowrap rounded-xl bg-brand-950 px-3 py-2 text-xs text-white shadow-lg"
                  style={{ left: `${x(hover)}%`, transform: `translate(${x(hover) > 70 ? "-100%" : x(hover) < 30 ? "0" : "-50%"}, calc(-100% - 8px))` }}
                  role="status"
                >
                  <strong className="text-sm tabular-nums">{nf.format(h.value)}</strong> {u(h.value)}
                  <span className="block text-brand-200">{h.detail ?? h.label}</span>
                </span>
              </>
            )}
          </div>
          <div className="relative mt-2 h-4 text-[11px] text-brand-400" aria-hidden>
            {shown.map((i) => (
              <span key={i} className="absolute whitespace-nowrap" style={{ left: `${x(i)}%`, transform: `translateX(${i === 0 ? "0" : i === n - 1 ? "-100%" : "-50%"})` }}>
                {data[i].label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <DataTable data={data} unit={unit} first="Período" />
    </div>
  );
}

/** "Ver em tabela": leitura exata dos números de qualquer gráfico. */
export function DataTable({ data, unit, first }: { data: Datum[]; unit: string; first: string }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-[13px] font-medium text-brand-500 hover:text-brand-900">Ver em tabela</summary>
      <table className="mt-2 w-full text-left">
        <thead className="text-xs uppercase text-brand-500">
          <tr>
            <th className="py-1 font-semibold">{first}</th>
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
  );
}

export interface FunnelStep {
  label: string;
  value: number;
}

/** Funil em degraus: barra proporcional ao total e conversão em relação à etapa anterior. */
export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const top = steps[0]?.value ?? 0;
  if (!top) return <p className="text-sm text-brand-500">Sem candidaturas no período.</p>;
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => {
        const prev = i ? steps[i - 1].value : null;
        const conv = prev ? Math.round((s.value / prev) * 100) : null;
        return (
          <li key={s.label}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate font-medium text-brand-800">{s.label}</span>
              <span className="shrink-0 tabular-nums">
                <strong className="text-brand-950">{nf.format(s.value)}</strong>
                {conv != null && (
                  <span className="ml-1.5 rounded-full bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-600" title="conversão em relação à etapa anterior">
                    {conv}%
                  </span>
                )}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-brand-50" aria-hidden>
              <div className="h-full rounded-full" style={{ width: `${(s.value / top) * 100}%`, minWidth: s.value ? 6 : 0, background: BAR, opacity: 1 - i * 0.12 }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Iniciais com fundo suave (cor estável por nome). */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const ini = ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
  const tones = ["bg-brand-100 text-brand-800", "bg-accent-100 text-accent-800", "bg-emerald-100 text-emerald-800", "bg-violet-100 text-violet-800", "bg-sky-100 text-sky-800", "bg-rose-100 text-rose-800"];
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const dim = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base" }[size];
  return (
    <span className={`grid shrink-0 place-items-center rounded-full font-bold ${dim} ${tones[hash % tones.length]}`} aria-hidden>
      {ini}
    </span>
  );
}

/** Medidor circular de 0 a 100 (ex.: chance de contratação). */
export function Ring({ value, label }: { value: number; label: string }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative grid h-12 w-12 shrink-0 place-items-center" role="img" aria-label={`${label}: ${value}%`}>
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="22" cy="22" r={r} fill="none" stroke="#e3e9f3" strokeWidth="4" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={BAR} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} />
      </svg>
      <span className="text-[11px] font-extrabold tabular-nums text-brand-950" aria-hidden>
        {value}%
      </span>
    </span>
  );
}
