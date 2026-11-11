import Logos from "./Logos";

/** Fecho da página: a frase que resume tudo e o aviso de que o material é interno. */
export default function Fecho() {
  return (
    <section aria-label="Encerramento" className="relative overflow-hidden py-28 sm:py-40">
      <div aria-hidden className="absolute left-1/2 top-1/2 -z-0 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(211,184,127,0.16),transparent_65%)]" />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <div data-reveal className="flex justify-center">
          <Logos tam="h-24 sm:h-28" className="drop-shadow-[0_10px_30px_rgba(211,184,127,0.45)]" />
        </div>
        <h2 data-reveal style={{ ["--d" as string]: "100ms" }} className="mt-8 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
          Fazemos o que precisa ser <span className="ci-gold-text">feito.</span>
        </h2>
        <p data-reveal style={{ ["--d" as string]: "200ms" }} className="mt-6 text-lg text-[#c9c3b4]">
          Seja bem-vindo(a) à cultura CPPEM.
        </p>
        <p className="mt-14 font-eyebrow text-xs font-bold uppercase tracking-[0.26em] text-[#8f897b]">Material interno · Não compartilhar fora da equipe</p>
      </div>
    </section>
  );
}
