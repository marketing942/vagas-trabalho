import { DONOS } from "@/lib/cultura-interna";

/** Brasas fixas (sempre as mesmas, para o servidor e o navegador desenharem igual). */
const BRASAS = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  tam: 2 + ((i * 5) % 4),
  dur: 9 + ((i * 7) % 9),
  atraso: -((i * 3.1) % 14),
  dx: ((i * 13) % 80) - 40,
}));

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

export default function Hero() {
  return (
    <section id="topo" className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-20" aria-labelledby="hero-titulo">
      {/* brilho de fundo + brasas */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(211,184,127,0.18),transparent_65%)] lg:left-[72%]" />
        {BRASAS.map((b, i) => (
          <span
            key={i}
            className="ci-ember"
            style={{
              left: `${b.left}%`,
              ["--s" as string]: `${b.tam}px`,
              ["--t" as string]: `${b.dur}s`,
              ["--dl" as string]: `${b.atraso}s`,
              ["--dx" as string]: `${b.dx}px`,
            }}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#06070b] to-transparent" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:px-8">
        <div>
          <span
            data-reveal
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(211,184,127,0.35)] bg-[rgba(211,184,127,0.08)] px-4 py-1.5 font-eyebrow text-xs font-bold uppercase tracking-[0.22em] text-[#e8cf94]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#d3b87f]" /> Material interno · Nova cultura empresarial
          </span>

          <h1
            id="hero-titulo"
            data-reveal
            style={{ ["--d" as string]: "80ms" }}
            className="mt-7 text-[3.4rem] font-extrabold leading-[0.95] tracking-tight sm:text-8xl lg:text-[7.2rem]"
          >
            <span className="ci-gold-text">Cultura</span>
            <br />
            <span className="text-white">CPPEM.</span>
          </h1>

          <p data-reveal style={{ ["--d" as string]: "180ms" }} className="mt-8 max-w-xl text-xl leading-relaxed text-[#d6d0c2] sm:text-2xl">
            O que vemos, quem nos inspira, como agimos, o que repetimos juntos e o que orienta as nossas escolhas.{" "}
            <span className="font-semibold text-[#f6e3a8]">Seja bem-vindo(a) ao time.</span>
          </p>

          <div data-reveal style={{ ["--d" as string]: "280ms" }} className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#dicionario"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#f0dcb0] via-[#c9ae7a] to-[#af9256] px-7 py-3.5 text-sm font-bold text-[#1a1409] shadow-[0_14px_34px_-12px_rgba(175,146,86,0.7)] transition hover:-translate-y-0.5"
            >
              Começar pelo dicionário
              <svg viewBox="0 0 24 24" className="h-4 w-4 rotate-90" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a href="#valores" className="text-sm font-semibold text-[#cfc8b8] underline decoration-[#d3b87f]/60 decoration-2 underline-offset-[6px] transition hover:text-white">
              Ir direto aos valores
            </a>
          </div>

          {/* donos da cultura */}
          <div data-reveal style={{ ["--d" as string]: "380ms" }} className="mt-12 max-w-2xl border-t border-[rgba(211,184,127,0.2)] pt-7">
            <p className="font-eyebrow text-xs font-bold uppercase tracking-[0.2em] text-[#8f897b]">Donos da cultura</p>
            <ul className="mt-3 flex flex-wrap gap-2.5">
              {DONOS.map((d) => (
                <li key={d} className="inline-flex items-center gap-2 rounded-full border border-[rgba(211,184,127,0.25)] bg-white/[0.04] py-1 pl-1 pr-3.5 text-sm font-semibold text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#f0dcb0] to-[#9c7a3c] text-[0.7rem] font-extrabold text-[#1a1409]">
                    {iniciais(d)}
                  </span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* o leão, com anéis girando */}
        <div data-reveal="zoom" className="relative mx-auto aspect-square w-full max-w-[26rem] lg:max-w-none">
          <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <linearGradient id="hero-anel" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f6e3a8" />
                <stop offset="1" stopColor="#9c7a3c" />
              </linearGradient>
            </defs>
            <g className="ci-anim" style={{ transformOrigin: "200px 200px", animation: "ci-spin 60s linear infinite" }}>
              <circle cx="200" cy="200" r="192" fill="none" stroke="url(#hero-anel)" strokeWidth="1.2" strokeDasharray="2 9" strokeLinecap="round" opacity="0.8" />
            </g>
            <g className="ci-anim" style={{ transformOrigin: "200px 200px", animation: "ci-spin-rev 90s linear infinite" }}>
              <circle cx="200" cy="200" r="165" fill="none" stroke="url(#hero-anel)" strokeWidth="1" strokeDasharray="60 14 6 14" opacity="0.45" />
              <circle cx="200" cy="35" r="4" fill="#f6e3a8" />
              <circle cx="365" cy="200" r="3" fill="#d3b87f" />
              <circle cx="60" cy="316" r="3" fill="#d3b87f" />
            </g>
            <circle cx="200" cy="200" r="138" fill="rgba(211,184,127,0.05)" stroke="rgba(211,184,127,0.3)" />
          </svg>
          <div className="ci-anim absolute inset-[14%] flex items-center justify-center" style={{ animation: "ci-float 7s ease-in-out infinite" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/cppem.png"
              alt="CPPEM"
              width={480}
              height={480}
              fetchPriority="high"
              className="h-full w-full object-contain drop-shadow-[0_20px_40px_rgba(211,184,127,0.3)]"
            />
          </div>
        </div>
      </div>

      <a href="#dicionario" aria-label="Rolar para baixo" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[#8f897b] transition hover:text-[#d3b87f] sm:flex">
        <span className="font-eyebrow text-[0.7rem] font-bold uppercase tracking-[0.3em]">Role</span>
        <span className="h-9 w-[1.5px] bg-gradient-to-b from-[#d3b87f] to-transparent" />
      </a>
    </section>
  );
}
