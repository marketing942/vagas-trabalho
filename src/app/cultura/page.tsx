import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import Jornada from "@/components/cultura/Jornada";
import { getSettings } from "@/lib/settings";
import { SITE_NAME } from "@/lib/site";
import { BEM_VINDO, CULTURA_DEFINICAO, DESTAQUES, MANDAMENTOS, NAO_BEM_VINDO } from "@/lib/cultura";

export const revalidate = 300;

const TITLE = "Nossa cultura | Carreiras CPPEM";
const DESCRIPTION =
  "Os 10 mandamentos e o jeito de trabalhar do CPPEM: quem é bem-vindo e quem não é. Conheça a nossa cultura antes de se candidatar.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/cultura" },
  openGraph: { type: "website", locale: "pt_BR", siteName: SITE_NAME, title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default async function CulturaPage() {
  const settings = await getSettings();

  return (
    <>
      <Header formUrl={settings.form_url} />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        {/* ---------- Header: só tipografia, fundo limpo ---------- */}
        <section className="relative isolate overflow-hidden bg-brand-950 text-white" aria-labelledby="cultura-titulo">
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
              <span className="text-good">como trabalhamos</span> e{" "}
              <span className="text-bad">como não trabalhamos</span>
              , sem enrolação.
            </h2>
            <p className="mt-10 max-w-3xl border-l-4 border-accent-500 pl-6 text-xl leading-relaxed text-inksoft sm:text-2xl">
              {CULTURA_DEFINICAO}
            </p>
          </div>
        </section>

        {/* ---------- Os 10 mandamentos ---------- */}
        <section id="mandamentos" className="scroll-mt-20 bg-canvas2 pb-16 pt-16 sm:pb-24 sm:pt-24" aria-labelledby="mandamentos-titulo">
          <div className="container-page">
            <div className="mb-8 sm:mb-10">
              <span className="eyebrow">Do 01 ao 10</span>
              <h2 id="mandamentos-titulo" className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
                Nossos 10 mandamentos
              </h2>
            </div>
            <Jornada items={MANDAMENTOS} highlights={DESTAQUES} />
          </div>
        </section>

        {/* ---------- Quem é / quem não é bem-vindo ---------- */}
        <section id="perfil" className="scroll-mt-20 py-14 sm:py-20" aria-labelledby="perfil-titulo">
          <div className="container-page">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <span className="eyebrow">O perfil de quem sobe com a gente</span>
              <h2 id="perfil-titulo" className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
                Quem é bem-vindo(a) aqui, e quem não é
              </h2>
            </div>

            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
              <div className="card border-good/40 p-7">
                <h3 className="inline-flex items-center gap-3 rounded-xl bg-goodsoft px-4 py-2 text-lg font-extrabold text-good">
                  <Icon name="check" className="h-5 w-5" /> Quem é bem-vindo(a) aqui
                </h3>
                <ul className="mt-6 space-y-4">
                  {BEM_VINDO.map((item) => (
                    <li key={item} className="flex items-start gap-3 leading-snug text-ink">
                      <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-good" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card border-bad/40 p-7">
                <h3 className="inline-flex items-center gap-3 rounded-xl bg-badsoft px-4 py-2 text-lg font-extrabold text-bad">
                  <Icon name="close" className="h-5 w-5" /> Quem NÃO é bem-vindo(a) aqui
                </h3>
                <ul className="mt-6 space-y-4">
                  {NAO_BEM_VINDO.map((item) => (
                    <li key={item} className="flex items-start gap-3 leading-snug text-ink">
                      <Icon name="close" className="mt-0.5 h-5 w-5 shrink-0 text-bad" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
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
      <ExitIntentPopup whatsappUrl={settings.whatsapp_group_url} />
    </>
  );
}
