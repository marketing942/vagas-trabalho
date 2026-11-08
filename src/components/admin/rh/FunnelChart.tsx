const NF = new Intl.NumberFormat("pt-BR");
// Azul-marinho → azul → dourado CPPEM (texto branco com contraste ≥ 4.5:1 em todos)
const FILL = ["#0b1a40", "#1e2f5e", "#8a7040", "#6e5a33"];

export interface FunnelChartStep {
  label: string;
  value: number;
  /** Texto depois da % de conversão em relação à etapa anterior */
  conversionLabel?: string;
}

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

/**
 * Funil em forma de funil (estilo funil de vendas): cada faixa afina até a seguinte.
 * A largura acompanha o número (com um mínimo para a faixa continuar legível).
 */
export default function FunnelChart({ steps }: { steps: FunnelChartStep[] }) {
  const top = Math.max(1, steps[0]?.value ?? 0);
  const width = (v: number) => 34 + 66 * (v / top);
  const first = steps[0]?.value ?? 0;

  return (
    <ol className="space-y-[3px]" aria-label="Funil de recrutamento">
      {steps.map((s, i) => {
        const wTop = width(s.value);
        const next = steps[i + 1];
        const wBottom = next ? width(next.value) : Math.max(24, wTop - 10);
        const t = (100 - wTop) / 2;
        const b = (100 - wBottom) / 2;
        const prev = steps[i - 1];
        return (
          <li key={s.label} className="grid items-center gap-x-6 gap-y-1.5 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div
              className="grid h-[72px] place-items-center text-white"
              style={{ background: FILL[i % FILL.length], clipPath: `polygon(${t}% 0, ${100 - t}% 0, ${100 - b}% 100%, ${b}% 100%)` }}
              aria-hidden
            >
              <span className="text-2xl font-semibold tabular-nums">{NF.format(s.value)}</span>
            </div>
            <div className="min-w-0 sm:border-l sm:border-stone-200 sm:pl-5">
              <p className="text-sm font-semibold text-brand-950">
                <span className="sr-only">{NF.format(s.value)} </span>
                {s.label}
              </p>
              {prev ? (
                <p className="mt-0.5 text-[13px] text-stone-600">
                  <strong className="font-semibold tabular-nums text-brand-950">{pct(s.value, prev.value)}%</strong> {s.conversionLabel ?? `de ${prev.label.toLowerCase()}`}
                  {i > 1 && <span className="text-stone-500"> · {pct(s.value, first)}% do total</span>}
                </p>
              ) : (
                <p className="mt-0.5 text-[13px] text-stone-600">ponto de partida (100%)</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
