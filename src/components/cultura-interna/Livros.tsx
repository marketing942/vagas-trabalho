import { LIVROS } from "@/lib/cultura-interna";

/** Livros no ambiente que reforçam a cultura: as capas das edições brasileiras numa estante. */
export default function Livros() {
  return (
    <div id="livros" className="mt-24 scroll-mt-20 sm:mt-32">
      <div className="mb-10 max-w-2xl" data-reveal>
        <span className="font-eyebrow text-xs font-bold uppercase tracking-[0.24em] text-[#d3b87f]">No ambiente</span>
        <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Livros que reforçam a cultura</h3>
      </div>

      <ul className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4 lg:gap-x-8">
        {LIVROS.map((l, i) => (
          <li key={l.titulo} data-reveal style={{ ["--d" as string]: `${i * 110}ms` }}>
            <a
              href={l.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
              aria-label={`${l.titulo}, de ${l.autor} (abre a página do livro no Google Livros)`}
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={l.capa}
                  alt={`Capa do livro ${l.titulo}, de ${l.autor}`}
                  width={575}
                  height={850}
                  loading="lazy"
                  className="aspect-[2/3] w-full rounded-[4px] object-cover shadow-[0_22px_40px_-16px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06)] transition duration-500 group-hover:-translate-y-3 group-hover:rotate-[-1.5deg] group-hover:shadow-[0_34px_50px_-18px_rgba(211,184,127,0.45),0_0_0_1px_rgba(211,184,127,0.4)]"
                />
                {/* lombada */}
                <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[6%] rounded-l-[4px] bg-gradient-to-r from-black/45 via-white/10 to-transparent" />
                {/* prateleira */}
                <span aria-hidden className="absolute -bottom-3 -left-2 -right-2 h-2 rounded-full bg-gradient-to-b from-[#6a4a2a] to-[#2b1a0d] shadow-[0_10px_14px_-4px_rgba(0,0,0,0.8)]" />
              </div>
              <p className="mt-6 text-base font-extrabold leading-snug text-white">{l.titulo}</p>
              <p className="mt-0.5 text-sm text-[#c9c3b4]">{l.autor}</p>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-xs text-[#8f897b]">Capas das edições brasileiras, pelo Google Livros. Clique em uma capa para ver o livro.</p>
    </div>
  );
}
