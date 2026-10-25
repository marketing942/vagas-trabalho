"use client";

import { useEffect, useRef, useState } from "react";

interface ManifestoProps {
  items: string[];
  /** Trecho de cada item que ganha destaque (mesma ordem de `items`). */
  highlights: string[];
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Quebra o texto em volta do trecho destacado. */
function Highlighted({ text, mark }: { text: string; mark: string }) {
  const at = mark ? text.indexOf(mark) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="underline decoration-accent-500 decoration-[5px] underline-offset-[6px] [text-decoration-skip-ink:none]">{mark}</span>
      {text.slice(at + mark.length)}
    </>
  );
}

/**
 * Os mandamentos como um manifesto: texto grande, e um marcador que acompanha
 * a leitura (número gigante no computador, barra fixa no celular).
 * Sem JavaScript, tudo continua legível: o destaque do item atual é um extra.
 */
export default function Manifesto({ items, highlights }: ManifestoProps) {
  const [active, setActive] = useState(-1);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    // Considera "atual" o item que cruza uma faixa estreita no meio da tela.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-42% 0px -52% 0px" }
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const current = Math.max(active, 0);
  const progress = ((current + 1) / items.length) * 100;

  return (
    <div className="grid gap-x-16 lg:grid-cols-[220px_1fr]">
      {/* Celular: barra fixa com o andamento */}
      <div className="sticky top-[68px] z-20 -mx-4 mb-4 border-b border-line bg-canvas2/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <div className="flex items-baseline justify-between">
          <span className="font-eyebrow text-sm font-bold uppercase tracking-[0.18em] text-goldink">Mandamento</span>
          <span className="font-display text-lg font-extrabold tabular-nums text-ink">
            {pad(current + 1)} <span className="text-inkmuted">/ {items.length}</span>
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-accent-500 transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Computador: número gigante + índice clicável */}
      <aside className="hidden lg:block">
        <div className="sticky top-28">
          <p
            aria-hidden
            className="font-display text-[8.5rem] font-extrabold leading-none tabular-nums text-transparent [-webkit-text-stroke:2px_rgb(var(--c-goldink))]"
          >
            {pad(current + 1)}
          </p>
          <p className="mt-1 font-eyebrow text-sm font-bold uppercase tracking-[0.18em] text-inkmuted">de {items.length} mandamentos</p>

          <nav aria-label="Ir para um mandamento" className="mt-8">
            <ul className="space-y-1">
              {items.map((_, i) => (
                <li key={i}>
                  <a
                    href={`#mandamento-${i + 1}`}
                    aria-current={i === active ? "true" : undefined}
                    className={`flex items-center gap-3 rounded-md py-1 font-display text-sm font-bold tabular-nums transition-colors ${
                      i === active ? "text-ink" : i < active ? "text-goldink" : "text-inkmuted hover:text-ink"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`h-[3px] rounded-full transition-all duration-300 ${
                        i === active ? "w-10 bg-accent-500" : i < active ? "w-5 bg-goldline" : "w-5 bg-line2"
                      }`}
                    />
                    {pad(i + 1)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      <ol>
        {items.map((text, i) => (
          <li
            key={text}
            id={`mandamento-${i + 1}`}
            data-index={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={`scroll-mt-[35vh] border-t border-line2 py-9 transition-opacity duration-300 last:border-b sm:py-12 ${
              active >= 0 && i !== active ? "opacity-35" : "opacity-100"
            }`}
          >
            <span className="font-eyebrow text-sm font-bold uppercase tracking-[0.2em] text-goldink lg:hidden">
              {pad(i + 1)}
            </span>
            <p className="mt-2 text-[1.75rem] font-extrabold leading-[1.12] tracking-tight text-ink sm:text-4xl lg:mt-0 lg:text-[2.6rem]">
              <span className="sr-only">Mandamento {i + 1}: </span>
              <Highlighted text={text} mark={highlights[i] ?? ""} />
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
