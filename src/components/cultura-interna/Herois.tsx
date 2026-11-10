import Capitulo from "./Capitulo";
import Icone, { type NomeIcone } from "./icones";

const ICONES: Record<string, NomeIcone> = { davi: "harpa", moises: "tabuas", salomao: "coroa" };

const BIBLICOS = [
  { id: "davi", nome: "Rei Davi" },
  { id: "moises", nome: "Moisés" },
  { id: "salomao", nome: "Salomão" },
];

export default function Herois() {
  return (
    <Capitulo id="herois" numero={2} eyebrow="Passo 2 · Quem e quais histórias nos inspiram" titulo="Heróis" definicao="Quem e quais histórias nos inspiram.">
      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr_1fr_1fr]">
        {/* o herói de hoje: quem representar melhor a cultura */}
        <a
          href="#trofeus"
          data-reveal
          className="group relative flex min-h-[18rem] flex-col justify-between overflow-hidden rounded-3xl border border-[rgba(211,184,127,0.55)] bg-gradient-to-br from-[rgba(211,184,127,0.22)] via-[rgba(211,184,127,0.06)] to-transparent p-7 transition hover:-translate-y-1.5 hover:shadow-[0_28px_70px_-30px_rgba(211,184,127,0.6)] lg:row-span-1"
        >
          <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(246,227,168,0.35),transparent_65%)]" />
          <span className="relative inline-flex w-fit items-center gap-2 rounded-full bg-[#d3b87f] px-3 py-1 font-eyebrow text-xs font-bold uppercase tracking-[0.18em] text-[#1a1409]">
            <Icone nome="trofeu" className="h-4 w-4" /> Herói da Cultura
          </span>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/cppem.png" alt="" width={72} height={72} className="mb-4 h-16 w-16 object-contain drop-shadow-[0_8px_18px_rgba(211,184,127,0.4)]" />
            <h3 className="text-2xl font-extrabold leading-tight text-white sm:text-[1.7rem]">Quem representar melhor a cultura</h3>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#d3b87f]">
              Ver o troféu
              <svg viewBox="0 0 24 24" className="h-4 w-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </div>
        </a>

        {BIBLICOS.map((h, i) => (
          <div
            key={h.id}
            data-reveal
            style={{ ["--d" as string]: `${(i + 1) * 110}ms` }}
            className="group relative flex min-h-[18rem] flex-col justify-between overflow-hidden rounded-3xl border border-[rgba(211,184,127,0.22)] bg-gradient-to-b from-white/[0.06] to-white/[0.015] p-7 transition duration-300 hover:-translate-y-1.5 hover:border-[rgba(211,184,127,0.55)]"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(211,184,127,0.35)] bg-[rgba(211,184,127,0.08)] text-[#e8cf94] transition duration-500 group-hover:scale-110 group-hover:bg-[rgba(211,184,127,0.16)]">
              <Icone nome={ICONES[h.id]} className="h-10 w-10" />
            </div>
            <h3 className="ci-gold-text text-3xl font-extrabold">{h.nome}</h3>
          </div>
        ))}
      </div>
    </Capitulo>
  );
}
