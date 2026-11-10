import Capitulo from "./Capitulo";
import Livros from "./Livros";
import VideoTrofeu from "./VideoTrofeu";
import { FRASES, SALAS, SIMBOLOS_DEF } from "@/lib/cultura-interna";

function Sub({ eyebrow, titulo, children }: { eyebrow?: string; titulo: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 max-w-2xl" data-reveal>
      {eyebrow && <span className="font-eyebrow text-xs font-bold uppercase tracking-[0.24em] text-[#d3b87f]">{eyebrow}</span>}
      <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{titulo}</h3>
      {children && <p className="mt-3 text-base leading-relaxed text-[#c9c3b4] sm:text-lg">{children}</p>}
    </div>
  );
}

export default function Simbolos() {
  return (
    <Capitulo id="simbolos" numero={1} eyebrow="Passo 1 · O que vemos e reconhecemos" titulo="Símbolos" definicao={SIMBOLOS_DEF}>
      {/* ---------- Camisas ---------- */}
      <div id="camisas" className="scroll-mt-20">
        <Sub eyebrow="Valor: Disciplina" titulo="Camisas">
          A camisa do time leva a frase que resume a disciplina: <strong className="text-[#f6e3a8]">“Eu faço o que precisa ser feito.”</strong>
        </Sub>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            { src: "/cultura-interna/camisa-preta.webp", alt: "Camisa preta do time CPPEM: logo no peito, bandeira do Brasil na manga e, nas costas, a frase Eu faço o que precisa ser feito, com a palavra feito em dourado." },
            { src: "/cultura-interna/camisa-cinza.webp", alt: "Camisa preta do time CPPEM, versão minimalista: logo discreto no peito e, nas costas, a frase Eu faço o que precisa ser feito." },
          ].map((c, i) => (
            <figure
              key={c.src}
              data-reveal
              style={{ ["--d" as string]: `${i * 120}ms` }}
              className="group overflow-hidden rounded-3xl border border-[rgba(211,184,127,0.28)] bg-black shadow-[0_30px_70px_-34px_rgba(0,0,0,0.9)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.src}
                alt={c.alt}
                width={1000}
                height={1000}
                loading="lazy"
                className="aspect-square w-full object-cover transition duration-700 group-hover:scale-[1.04]"
              />
            </figure>
          ))}
        </div>
      </div>

      {/* ---------- Troféus ---------- */}
      <div id="trofeus" className="mt-24 scroll-mt-20 sm:mt-32">
        <Sub eyebrow="Reconhecimento" titulo="Troféus">
          Os troféus que entregamos a quem faz a cultura acontecer.
        </Sub>
        <div className="grid gap-10 lg:grid-cols-2">
          <figure data-reveal>
            <VideoTrofeu src="/cultura-interna/trofeu-vendedor-de-elite.mp4" poster="/cultura-interna/trofeu-vendedor-de-elite.jpg" titulo="Troféu Vendedor de Elite girando" />
            <figcaption className="mt-5">
              <h4 className="text-2xl font-extrabold text-white">Vendedor de Elite</h4>
              <p className="mt-1 text-[#c9c3b4]">Reconhecimento 2026 · Parceiro de sucesso</p>
            </figcaption>
          </figure>
          <figure data-reveal style={{ ["--d" as string]: "120ms" }}>
            <VideoTrofeu src="/cultura-interna/trofeu-heroi-da-cultura.mp4" poster="/cultura-interna/trofeu-heroi-da-cultura.jpg" titulo="Troféu Herói da Cultura girando" />
            <figcaption className="mt-5">
              <h4 className="text-2xl font-extrabold text-white">Herói da Cultura</h4>
              <p className="mt-1 text-[#c9c3b4]">
                “Chegando no topo” · Para quem representar melhor a cultura.{" "}
                <a href="#herois" className="font-semibold text-[#d3b87f] underline decoration-[#d3b87f]/50 underline-offset-4 hover:text-[#f6e3a8]">
                  Ver os heróis
                </a>
              </p>
            </figcaption>
          </figure>
        </div>
      </div>

      {/* ---------- Nome das salas e frases ---------- */}
      <div className="mt-24 grid gap-14 sm:mt-32 lg:grid-cols-2 lg:gap-12">
        <div id="salas" className="scroll-mt-20">
          <Sub eyebrow="No ambiente" titulo="Nome das salas" />
          <ul className="space-y-4">
            {SALAS.map((s, i) => (
              <li
                key={s.tipo}
                data-reveal
                style={{ ["--d" as string]: `${i * 100}ms` }}
                className="flex flex-col gap-1 rounded-2xl border border-[rgba(211,184,127,0.25)] bg-white/[0.03] px-6 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
              >
                <span className="font-eyebrow text-sm font-bold uppercase tracking-[0.2em] text-[#8f897b]">{s.tipo}</span>
                <span className="ci-gold-text text-2xl font-extrabold sm:text-right">{s.nome}</span>
              </li>
            ))}
          </ul>
        </div>

        <div id="frases" className="scroll-mt-20">
          <Sub eyebrow="No ambiente" titulo="Frases" />
          <ul className="space-y-4">
            {FRASES.map((f, i) => (
              <li
                key={f}
                data-reveal
                style={{ ["--d" as string]: `${i * 100}ms` }}
                className="relative overflow-hidden rounded-2xl border border-[rgba(211,184,127,0.25)] bg-gradient-to-br from-[rgba(211,184,127,0.1)] to-transparent px-6 py-5"
              >
                <span aria-hidden className="absolute -left-1 -top-6 select-none font-display text-8xl font-extrabold leading-none text-[#d3b87f]/20">
                  “
                </span>
                <p className="relative text-xl font-extrabold leading-snug text-white sm:text-2xl">{f}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Livros />
    </Capitulo>
  );
}
