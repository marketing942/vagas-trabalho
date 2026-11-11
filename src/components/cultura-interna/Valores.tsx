import Capitulo from "./Capitulo";
import TriadeValores from "./TriadeValores";
import { COMO_AGIMOS, COMO_NAO_AGIMOS, VALORES, VALORES_FRASE } from "@/lib/cultura-interna";

function Lista({ titulo, itens, bom }: { titulo: string; itens: string[]; bom: boolean }) {
  return (
    <div
      data-reveal={bom ? "left" : "right"}
      className={`rounded-3xl border p-7 ${bom ? "border-emerald-400/35 bg-emerald-400/[0.04]" : "border-rose-400/35 bg-rose-400/[0.04]"}`}
    >
      <h4 className={`inline-flex items-center gap-2.5 rounded-xl px-4 py-2 text-lg font-extrabold ${bom ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"}`}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {bom ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <path d="M6 6l12 12M18 6 6 18" />}
        </svg>
        {titulo}
      </h4>
      <ul className="mt-6 space-y-3.5">
        {itens.map((t) => (
          <li key={t} className="flex items-start gap-3 leading-snug text-[#e9e4d6]">
            <svg viewBox="0 0 24 24" className={`mt-0.5 h-5 w-5 shrink-0 ${bom ? "text-emerald-300" : "text-rose-300"}`} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {bom ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <path d="M6 6l12 12M18 6 6 18" />}
            </svg>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Valores() {
  return (
    <Capitulo id="valores" numero={4} eyebrow="Passo 4 · O que orienta nossas escolhas" titulo="Valores" definicao="O que orienta nossas escolhas.">
      <blockquote data-reveal className="relative mx-auto mb-16 max-w-4xl text-center sm:mb-20">
        <span aria-hidden className="absolute -top-10 left-1/2 -translate-x-1/2 select-none font-display text-[8rem] font-extrabold leading-none text-[#d3b87f]/20">
          “
        </span>
        <p className="relative text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          A <span className="ci-gold-text">fé</span> nos mantém firmes, a <span className="ci-gold-text">disciplina</span> nos faz avançar e a{" "}
          <span className="ci-gold-text">proatividade</span> nos coloca à frente.
        </p>
        <span className="sr-only">{VALORES_FRASE}</span>
      </blockquote>

      <TriadeValores valores={VALORES} />

      <div id="agir" className="mt-24 scroll-mt-20 sm:mt-32">
        <div className="mb-10 max-w-3xl" data-reveal>
          <span className="font-eyebrow text-xs font-bold uppercase tracking-[0.24em] text-[#d3b87f]">O nosso jeito de agir</span>
          <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">A forma como agimos, e como não agimos</h3>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Lista titulo="A forma como agimos" itens={COMO_AGIMOS} bom />
          <Lista titulo="A forma como NÃO agimos" itens={COMO_NAO_AGIMOS} bom={false} />
        </div>
      </div>
    </Capitulo>
  );
}
