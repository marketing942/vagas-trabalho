import Capitulo from "./Capitulo";
import Icone, { type NomeIcone } from "./icones";
import { ARISTOCRATAS, OLIGARCAS, PRIORIDADES, PRIORIDADES_FECHO } from "@/lib/cultura-interna";

const ICONES_ARI: NomeIcone[] = ["premio", "grupo", "alvo", "balanca", "crescimento"];
const ICONES_OLI: NomeIcone[] = ["chefe", "camadas", "cadeado", "terno", "queda"];

function Lado({ lado, titulo, itens, icones }: { lado: "ari" | "oli"; titulo: string; itens: string[]; icones: NomeIcone[] }) {
  const ari = lado === "ari";
  return (
    <div
      data-reveal={ari ? "left" : "right"}
      className={`rounded-3xl border p-6 sm:p-8 ${
        ari
          ? "border-[rgba(211,184,127,0.55)] bg-gradient-to-b from-[rgba(211,184,127,0.14)] to-[rgba(211,184,127,0.02)] shadow-[0_30px_80px_-44px_rgba(211,184,127,0.6)]"
          : "border-white/15 bg-gradient-to-b from-white/[0.05] to-transparent"
      }`}
    >
      <header className="flex items-center gap-4 border-b border-white/10 pb-6">
        <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${ari ? "bg-[#d3b87f] text-[#1a1409]" : "bg-white/10 text-[#b9b2a0]"}`}>
          <Icone nome={ari ? "coroa" : "moedas"} className="h-8 w-8" />
        </span>
        <div>
          <h4 className={`text-2xl font-extrabold uppercase tracking-wide sm:text-3xl ${ari ? "ci-gold-text" : "text-[#cfc9ba]"}`}>{titulo}</h4>
          <p className="font-eyebrow text-xs font-bold uppercase tracking-[0.28em] text-[#8f897b]">Na empresa</p>
        </div>
      </header>
      <ul className="mt-2">
        {itens.map((t, i) => (
          <li key={t} className="flex items-center gap-4 border-b border-white/[0.07] py-4 last:border-0">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ari ? "text-[#e8cf94]" : "text-[#9d978a]"}`}>
              <Icone nome={icones[i]} className="h-7 w-7" />
            </span>
            <span className={`text-[1.02rem] leading-snug ${ari ? "text-white" : "text-[#cfc9ba]"}`}>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Camadas da pirâmide (viewBox 600 x 520). */
const CAMADAS = [
  { d: "M300,8 L436,196 L164,196 Z", topo: 20 },
  { d: "M174,212 L426,212 L508,364 L92,364 Z", topo: 53 },
  { d: "M84,380 L516,380 L590,512 L10,512 Z", topo: 78 },
];
const ICONES_PIR: NomeIcone[] = ["predio", "grupo", "grupo"];

export default function Praticas() {
  return (
    <Capitulo id="praticas" numero={3} eyebrow="Passo 3 · Como agimos no dia a dia" titulo="Práticas" definicao="Como agimos no dia a dia.">
      {/* ---------- Aristocratas x oligarcas ---------- */}
      <div id="aristocratas" className="scroll-mt-20">
        <div className="mb-10 max-w-2xl" data-reveal>
          <span className="font-eyebrow text-xs font-bold uppercase tracking-[0.24em] text-[#d3b87f]">No âmbito empresarial</span>
          <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Aristocratas ou oligarcas?</h3>
        </div>
        <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
          <Lado lado="ari" titulo="Aristocratas" itens={ARISTOCRATAS} icones={ICONES_ARI} />
          <div aria-hidden className="relative flex items-center justify-center py-2 lg:py-0">
            <span className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-[#d3b87f]/50 to-transparent lg:inset-x-auto lg:inset-y-4 lg:left-1/2 lg:h-auto lg:w-px lg:bg-gradient-to-b" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#d3b87f] bg-[#06070b] font-display text-xl font-extrabold text-[#f6e3a8] shadow-[0_0_40px_-6px_rgba(211,184,127,0.7)]">VS</span>
          </div>
          <Lado lado="oli" titulo="Oligarcas" itens={OLIGARCAS} icones={ICONES_OLI} />
        </div>
      </div>

      {/* ---------- Ordem de prioridades ---------- */}
      <div id="prioridades" className="mt-24 scroll-mt-20 sm:mt-32">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div data-reveal>
            <span className="font-eyebrow text-xs font-bold uppercase tracking-[0.24em] text-[#d3b87f]">Nosso modelo de pensamento</span>
            <h3 className="ci-gold-text mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">Uma ordem de prioridades</h3>
            <p className="mt-5 text-xl leading-relaxed text-[#d6d0c2]">Toda decisão começa olhando para o todo.</p>
            <p className="mt-8 inline-flex items-center gap-3 rounded-full border border-[rgba(211,184,127,0.4)] bg-[rgba(211,184,127,0.08)] px-6 py-3 text-base font-semibold text-[#f6e3a8]">{PRIORIDADES_FECHO}</p>
          </div>

          <div data-reveal="zoom" className="mx-auto w-full max-w-xl" style={{ containerType: "inline-size" }}>
            <div className="relative" style={{ aspectRatio: "600 / 520" }}>
              <svg viewBox="0 0 600 520" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden focusable="false">
                <defs>
                  <linearGradient id="pir-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#d3b87f" stopOpacity="0.28" />
                    <stop offset="1" stopColor="#d3b87f" stopOpacity="0.05" />
                  </linearGradient>
                  <filter id="pir-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {CAMADAS.map((c, i) => (
                  <path key={i} d={c.d} fill="url(#pir-fill)" stroke="#e8cf94" strokeWidth="2.5" strokeLinejoin="round" filter="url(#pir-glow)" opacity={1 - i * 0.12} />
                ))}
              </svg>
              {PRIORIDADES.map((p, i) => (
                <div key={p.nome} className="pointer-events-none absolute inset-x-0 flex -translate-y-1/2 flex-col items-center text-center" style={{ top: `${i === 0 ? 27 : i === 1 ? 56 : 86}%` }}>
                  <Icone nome={ICONES_PIR[i]} className="text-[#f6e3a8]" style={{ width: "max(22px, 5.5cqw)", height: "max(22px, 5.5cqw)" }} />
                  <span className="mt-1 font-extrabold uppercase tracking-wide text-white" style={{ fontSize: "max(16px, 4.6cqw)" }}>
                    {p.nome}
                  </span>
                  <span className="text-[#d6d0c2]" style={{ fontSize: "max(11px, 2.7cqw)" }}>
                    {p.texto}
                  </span>
                </div>
              ))}
              {/* ordem: 1, 2, 3 */}
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  aria-hidden
                  className="absolute left-0 flex -translate-y-1/2 items-center justify-center rounded-full border border-[#d3b87f]/60 bg-[#06070b] font-display font-extrabold text-[#d3b87f]"
                  style={{ top: `${i === 0 ? 27 : i === 1 ? 56 : 86}%`, width: "max(24px, 6cqw)", height: "max(24px, 6cqw)", fontSize: "max(12px, 3cqw)" }}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Capitulo>
  );
}
