import { DICIONARIO } from "@/lib/cultura-interna";

/** O dicionário da cultura: cinco passos, cada um leva ao próximo (como as setas do documento). */
export default function Dicionario() {
  return (
    <section id="dicionario" aria-labelledby="dicionario-titulo" className="relative scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-12 max-w-3xl sm:mb-16" data-reveal>
          <span className="font-eyebrow text-sm font-bold uppercase tracking-[0.24em] text-[#d3b87f]">Antes de tudo</span>
          <h2 id="dicionario-titulo" className="ci-gold-text mt-3 text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
            O dicionário da cultura
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[#c9c3b4] sm:text-xl">
            Cultura não é um quadro na parede. É uma sequência: o que vemos vira inspiração, a inspiração vira prática, e tudo isso sustenta os valores.
          </p>
        </header>

        <ol className="grid gap-3 lg:grid-cols-4 lg:gap-0">
          {DICIONARIO.map((d, i) => (
            <li key={d.id} data-reveal style={{ ["--d" as string]: `${i * 110}ms` }} className="relative flex flex-col items-stretch lg:flex-row">
              {(() => {
                const Cartao = d.capitulo ? "a" : "div";
                const props = d.capitulo ? { href: `#${d.id}` } : {};
                return (
                  <Cartao
                    {...props}
                    className={`group relative flex-1 overflow-hidden rounded-3xl border bg-gradient-to-b from-white/[0.06] to-white/[0.015] p-6 transition duration-300 lg:mx-1.5 lg:p-7 ${
                      d.capitulo
                        ? "border-[rgba(211,184,127,0.22)] hover:-translate-y-1.5 hover:border-[rgba(211,184,127,0.6)] hover:shadow-[0_24px_60px_-28px_rgba(211,184,127,0.5)]"
                        : "border-dashed border-[rgba(211,184,127,0.18)]"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="absolute -right-1 -top-4 select-none font-display text-8xl font-extrabold text-transparent transition group-hover:scale-110"
                      style={{ WebkitTextStroke: "1.2px rgba(211,184,127,0.28)" }}
                    >
                      {i + 1}
                    </span>
                    <span className="relative font-eyebrow text-xs font-bold uppercase tracking-[0.22em] text-[#8f897b]">Passo {i + 1}</span>
                    <h3 className="relative mt-4 text-2xl font-extrabold text-white lg:text-[1.65rem]">{d.nome}</h3>
                    <p className="relative mt-2 text-[0.95rem] leading-snug text-[#c9c3b4]">{d.def}</p>
                    {d.capitulo ? (
                      <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#d3b87f]">
                        Ver
                        <svg viewBox="0 0 24 24" className="h-4 w-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </span>
                    ) : (
                      <span className="relative mt-5 inline-block text-sm font-semibold text-[#8f897b]">Em breve</span>
                    )}
                  </Cartao>
                );
              })()}

              {i < DICIONARIO.length - 1 && (
                <span aria-hidden className="flex items-center justify-center py-1 text-[#d3b87f] lg:-mx-3 lg:z-10 lg:w-3 lg:py-0">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 rotate-90 lg:hidden" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                  <svg viewBox="0 0 24 24" className="hidden h-7 w-7 shrink-0 rounded-full bg-[#06070b] lg:block" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
