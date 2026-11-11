import Logos from "./Logos";

/** Brasas fixas (sempre as mesmas, para o servidor e o navegador desenharem igual). */
const BRASAS = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  tam: 2 + ((i * 5) % 4),
  dur: 9 + ((i * 7) % 9),
  atraso: -((i * 3.1) % 14),
  dx: ((i * 13) % 80) - 40,
}));

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
        {/* montanha (a escalada), bem suave */}
        <svg viewBox="0 0 1440 600" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[75%] w-full opacity-[0.16]" focusable="false">
          <defs>
            <linearGradient id="hero-mont" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f6e3a8" />
              <stop offset="1" stopColor="#d3b87f" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path d="M0 600V430l130-90 110 70 150-150 120 100 170-230 140 190 110-90 150 150 120-110 140 130V600Z" fill="url(#hero-mont)" opacity="0.5" />
          <path d="M0 600V500l180-120 140 110 220-280 120 140 90-80 130 160 170-170 130 120 120-90 140 90V600Z" fill="url(#hero-mont)" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#06070b] to-transparent" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8 lg:px-8">
        <div>
          <h1
            id="hero-titulo"
            data-reveal
            style={{ ["--d" as string]: "80ms" }}
            className="text-[3.4rem] font-extrabold leading-[0.95] tracking-tight sm:text-8xl lg:text-[7.2rem]"
          >
            <span className="ci-gold-text">Cultura</span>
            <br />
            <span className="text-white">CPPEM.</span>
          </h1>

          <p data-reveal style={{ ["--d" as string]: "180ms" }} className="mt-8 max-w-xl text-xl leading-relaxed text-[#d6d0c2] sm:text-2xl">
            <span className="font-semibold text-[#f6e3a8]">Seja bem-vindo(a) ao time.</span>
          </p>
        </div>

        {/* as duas marcas, grandes, lado a lado */}
        <div data-reveal="zoom" className="flex justify-center lg:justify-end">
          <Logos tam="h-40 min-[420px]:h-44 sm:h-60 lg:h-72 xl:h-80" prioridade className="gap-4 drop-shadow-[0_20px_40px_rgba(211,184,127,0.3)] sm:gap-8" />
        </div>
      </div>

      <a href="#dicionario" aria-label="Rolar para baixo" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[#8f897b] transition hover:text-[#d3b87f] sm:flex">
        <span className="font-eyebrow text-[0.7rem] font-bold uppercase tracking-[0.3em]">Role</span>
        <span className="h-9 w-[1.5px] bg-gradient-to-b from-[#d3b87f] to-transparent" />
      </a>
    </section>
  );
}
