import type { ReactNode } from "react";

interface CapituloProps {
  id: string;
  numero?: number;
  eyebrow: string;
  titulo: string;
  definicao?: string;
  children: ReactNode;
}

/** Abertura de cada capítulo: número gigante vazado, título dourado e a definição do dicionário. */
export default function Capitulo({ id, numero, eyebrow, titulo, definicao, children }: CapituloProps) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="relative scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="relative mb-12 sm:mb-16" data-reveal>
          {numero != null && (
            <span
              aria-hidden
              className="pointer-events-none absolute -top-8 right-0 select-none font-display text-[9rem] font-extrabold leading-none text-transparent sm:-top-14 sm:text-[15rem]"
              style={{ WebkitTextStroke: "1.5px rgba(211,184,127,0.22)" }}
            >
              {String(numero).padStart(2, "0")}
            </span>
          )}
          <span className="font-eyebrow text-sm font-bold uppercase tracking-[0.24em] text-[#d3b87f]">{eyebrow}</span>
          <h2 id={`${id}-titulo`} className="ci-gold-text mt-3 text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
            {titulo}
          </h2>
          {definicao && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#c9c3b4] sm:text-xl">{definicao}</p>}
          <div className="mt-8 h-px w-40 bg-gradient-to-r from-[#d3b87f] to-transparent" />
        </header>
        {children}
      </div>
    </section>
  );
}
