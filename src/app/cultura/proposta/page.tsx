import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import Manifesto from "@/components/cultura/Manifesto";
import AlignmentCheck from "@/components/cultura/AlignmentCheck";
import { getSettings } from "@/lib/settings";
import { BEM_VINDO, CULTURA_DEFINICAO, DESTAQUES, MANDAMENTOS, NAO_BEM_VINDO } from "@/lib/cultura";

export const revalidate = 300;

// Rascunho para avaliação: sem link no site e fora do Google.
export const metadata: Metadata = {
  title: "Proposta: nossa cultura | Carreiras CPPEM",
  robots: { index: false, follow: false },
};

export default async function CulturaPropostaPage() {
  const settings = await getSettings();

  return (
    <>
      <Header formUrl={settings.form_url} />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        {/* ---------- Header: tipografia, sem enrolação ---------- */}
        <section className="relative isolate overflow-hidden bg-brand-950 text-white" aria-labelledby="cultura-titulo">
          <div className="pointer-events-none absolute -right-40 -top-48 -z-10 h-[44rem] w-[44rem] rounded-full bg-accent-500/15 blur-3xl" />
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
          />
          {/* o 10, gigante, só o contorno */}
          <svg
            aria-hidden
            viewBox="0 0 760 520"
            className="pointer-events-none absolute -right-8 -top-4 -z-10 h-[250px] w-auto select-none sm:h-[330px] lg:-right-10 lg:-top-12 lg:h-[470px]"
          >
            <text
              x="760"
              y="470"
              textAnchor="end"
              fontSize="560"
              fontWeight="800"
              fill="none"
              stroke="#c9ae7a"
              strokeOpacity="0.55"
              strokeWidth="2"
              style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
            >
              10
            </text>
          </svg>

          <div className="container-page flex min-h-[600px] flex-col justify-end pb-16 pt-24 sm:min-h-[680px] lg:min-h-[740px] lg:pb-24">
            <div className="animate-fade-up">
              <span className="font-eyebrow text-sm font-bold uppercase tracking-[0.22em] text-accent-300">Cultura CPPEM</span>
              <h1
                id="cultura-titulo"
                className="mt-5 max-w-4xl text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-7xl lg:text-[6.5rem]"
              >
                Nossa cultura,
                <br />
                <span className="bg-gradient-to-r from-accent-200 via-accent-400 to-accent-500 bg-clip-text text-transparent">
                  sem enrolação.
                </span>
              </h1>
              <p className="mt-7 max-w-2xl text-xl leading-snug text-brand-100 sm:text-2xl">
                A forma como trabalhamos e como não trabalhamos.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#mandamentos" className="btn-primary">
                  Ver os 10 mandamentos
                  <Icon name="arrow" className="h-4 w-4 rotate-90" />
                </a>
                <a href="#alinhamento" className="btn-ghost">
                  Isso é para mim?
                </a>
              </div>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-accent-500/60 to-transparent" />
        </section>

        {/* ---------- O que é ---------- */}
        <section className="py-16 sm:py-24" aria-labelledby="o-que-e">
          <div className="container-page max-w-4xl">
            <span className="eyebrow">O que é a nossa cultura?</span>
            <h2 id="o-que-e" className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-6xl">
              A forma{" "}
              <span className="text-good underline decoration-good/40 decoration-[5px] underline-offset-[8px]">como trabalhamos</span> e{" "}
              <span className="text-bad underline decoration-bad/40 decoration-[5px] underline-offset-[8px]">como não trabalhamos</span>
              , sem enrolação.
            </h2>
            <p className="mt-10 max-w-3xl border-l-4 border-accent-500 pl-6 text-xl leading-relaxed text-inksoft sm:text-2xl">
              {CULTURA_DEFINICAO}
            </p>
          </div>
        </section>

        {/* ---------- Os 10 mandamentos ---------- */}
        <section id="mandamentos" className="scroll-mt-20 bg-canvas2 py-16 sm:py-24" aria-labelledby="mandamentos-titulo">
          <div className="container-page">
            <div className="mb-10 sm:mb-14">
              <span className="eyebrow">Do 01 ao 10</span>
              <h2 id="mandamentos-titulo" className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
                Nossos 10 mandamentos
              </h2>
            </div>
            <Manifesto items={MANDAMENTOS} highlights={DESTAQUES} />
          </div>
        </section>

        {/* ---------- Isso é a sua cara? ---------- */}
        <section id="alinhamento" className="scroll-mt-20 bg-brand-950 py-16 text-white sm:py-24" aria-labelledby="alinhamento-titulo">
          <div className="container-page">
            <div className="mb-12 max-w-3xl">
              <span className="font-eyebrow text-sm font-bold uppercase tracking-[0.22em] text-accent-300">Antes de se candidatar</span>
              <h2 id="alinhamento-titulo" className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">
                Isso é a sua cara?
              </h2>
              <p className="mt-5 text-xl leading-snug text-brand-100">
                Nossa cultura funciona como um filtro. Marque o que descreve você hoje e veja, na hora, se combinamos.
              </p>
            </div>
            <AlignmentCheck bemVindo={BEM_VINDO} naoBemVindo={NAO_BEM_VINDO} />
          </div>
        </section>

        {/* ---------- Convite ---------- */}
        <section className="py-16 sm:py-24">
          <div className="container-page max-w-4xl text-center">
            <h2 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-6xl">
              Se esse é o seu jeito de trabalhar, venha construir com a gente.
            </h2>
            <Link href="/carreiras#vagas" className="btn-primary mt-10">
              Ver vagas abertas
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer settings={settings} />
    </>
  );
}
