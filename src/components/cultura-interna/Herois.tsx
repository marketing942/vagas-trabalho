import Capitulo from "./Capitulo";
import Icone, { type NomeIcone } from "./icones";

const ICONES: Record<string, NomeIcone> = { cultura: "trofeu", davi: "harpa", moises: "tabuas", salomao: "coroa" };

const BIBLICOS = [
  { id: "cultura", nome: "Quem representar melhor a cultura" },
  { id: "davi", nome: "Rei Davi" },
  { id: "moises", nome: "Moisés" },
  { id: "salomao", nome: "Salomão" },
];

/** Cruz dourada com raios de luz: o emblema do maior herói. */
function Emblema() {
  const raios = Array.from({ length: 24 }, (_, i) => i);
  return (
    <svg viewBox="0 0 240 240" className="h-full w-full overflow-visible" aria-hidden focusable="false">
      <defs>
        <linearGradient id="cruz-ouro" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff6d2" />
          <stop offset="0.45" stopColor="#f1d28a" />
          <stop offset="1" stopColor="#b8924f" />
        </linearGradient>
        <radialGradient id="cruz-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#f6e3a8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f6e3a8" stopOpacity="0" />
        </radialGradient>
        <filter id="cruz-brilho" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="120" cy="120" r="118" fill="url(#cruz-halo)" />
      <g className="ci-anim" style={{ transformOrigin: "120px 120px", animation: "ci-spin 90s linear infinite" }}>
        {raios.map((i) => (
          <line
            key={i}
            x1="120"
            y1={i % 2 ? 22 : 12}
            x2="120"
            y2={i % 2 ? 34 : 40}
            stroke="#e8cf94"
            strokeWidth={i % 2 ? 1.4 : 2.2}
            strokeLinecap="round"
            opacity={i % 2 ? 0.55 : 0.9}
            transform={`rotate(${i * 15} 120 120)`}
          />
        ))}
      </g>
      <circle cx="120" cy="120" r="84" fill="none" stroke="#d3b87f" strokeOpacity="0.55" strokeWidth="1.4" />
      <circle cx="120" cy="120" r="76" fill="rgba(6,7,11,0.55)" stroke="#d3b87f" strokeOpacity="0.25" />
      <g filter="url(#cruz-brilho)" fill="url(#cruz-ouro)">
        <rect x="111" y="64" width="18" height="118" rx="3" />
        <rect x="80" y="90" width="80" height="18" rx="3" />
      </g>
    </svg>
  );
}

export default function Herois() {
  return (
    <Capitulo id="herois" numero={2} eyebrow="Passo 2 · Quem e quais histórias nos inspiram" titulo="Heróis" definicao="Quem e quais histórias nos inspiram.">
      {/* ---------- O maior herói ---------- */}
      <div
        data-reveal
        className="relative mb-6 overflow-hidden rounded-[2rem] border border-[rgba(246,227,168,0.65)] bg-gradient-to-br from-[rgba(246,227,168,0.18)] via-[rgba(211,184,127,0.06)] to-transparent shadow-[0_40px_120px_-50px_rgba(246,227,168,0.6)]"
      >
        <div aria-hidden className="absolute -left-24 top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(246,227,168,0.22),transparent_65%)]" />
        <div className="relative grid items-center gap-8 px-6 py-12 sm:px-12 sm:py-16 md:grid-cols-[15rem_1fr] md:gap-14 lg:grid-cols-[18rem_1fr]">
          <div className="mx-auto h-48 w-48 md:h-60 md:w-60 lg:h-72 lg:w-72">
            <Emblema />
          </div>
          <div className="text-center md:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f1d28a] px-4 py-1.5 font-eyebrow text-xs font-bold uppercase tracking-[0.22em] text-[#1a1409]">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.400 6.100 20.500l1.200-6.500L2.500 9.400l6.600-.9L12 2.500Z" />
              </svg>
              O maior herói
            </span>
            <h3 className="ci-gold-text mt-5 text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl lg:text-8xl">Jesus Cristo</h3>
            <div className="mx-auto mt-7 h-px w-40 bg-gradient-to-r from-[#f1d28a] to-transparent md:mx-0" />
          </div>
        </div>
      </div>

      {/* ---------- Os demais heróis ---------- */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {BIBLICOS.map((h, i) => (
          <div
            key={h.id}
            data-reveal
            style={{ ["--d" as string]: `${(i + 1) * 110}ms` }}
            className="group relative flex min-h-[16rem] flex-col justify-between overflow-hidden rounded-3xl border border-[rgba(211,184,127,0.22)] bg-gradient-to-b from-white/[0.06] to-white/[0.015] p-7 transition duration-300 hover:-translate-y-1.5 hover:border-[rgba(211,184,127,0.55)]"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(211,184,127,0.35)] bg-[rgba(211,184,127,0.08)] text-[#e8cf94] transition duration-500 group-hover:scale-110 group-hover:bg-[rgba(211,184,127,0.16)]">
              <Icone nome={ICONES[h.id]} className="h-10 w-10" />
            </div>
            <h3 className="ci-gold-text text-2xl font-extrabold leading-tight sm:text-3xl">{h.nome}</h3>
          </div>
        ))}
      </div>
    </Capitulo>
  );
}
