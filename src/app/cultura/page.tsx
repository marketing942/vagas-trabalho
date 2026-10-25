import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import { getSettings } from "@/lib/settings";
import { SITE_NAME } from "@/lib/site";
import { BEM_VINDO, CULTURA_DEFINICAO, MANDAMENTOS, NAO_BEM_VINDO } from "@/lib/cultura";

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
        {/* ---------- Header: a subida até o topo ---------- */}
        <section className="relative isolate overflow-hidden bg-brand-950 text-white" aria-labelledby="cultura-titulo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cultura/montanha-1920.webp"
            srcSet="/cultura/montanha-1000.webp 1000w, /cultura/montanha-1920.webp 1920w"
            sizes="100vw"
            width={1920}
            height={1072}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-x-0 top-0 -z-10 h-[430px] w-full object-cover object-[36%_30%] md:inset-0 md:h-full md:object-[50%_28%]"
          />
          {/* escurece o pé da imagem para o texto ficar legível e a cena "descer" para o azul da página */}
          <div className="absolute inset-x-0 top-0 -z-10 h-[430px] bg-gradient-to-t from-brand-950 via-brand-950/70 to-transparent md:inset-0 md:h-full" />
          <div className="absolute inset-x-0 top-0 -z-10 hidden bg-gradient-to-r from-brand-950/55 via-transparent to-transparent md:block md:inset-0 md:h-full" />

          <div className="container-page flex min-h-[640px] flex-col justify-end pb-14 pt-8 sm:min-h-[700px] lg:min-h-[780px] sm:pb-20">
            <div className="max-w-3xl animate-fade-up">
              <span className="inline-flex items-center gap-2 font-eyebrow text-sm font-bold uppercase tracking-[0.2em] text-accent-300">
                <Icon name="mountain" className="h-5 w-5" /> Cultura CPPEM
              </span>
              <h1
                id="cultura-titulo"
                className="mt-4 text-5xl font-extrabold leading-[1.02] text-white sm:text-6xl lg:text-7xl"
              >
                Nossa cultura
              </h1>
              <p className="mt-5 max-w-2xl text-xl leading-snug text-brand-50 sm:text-2xl">
                Para chegar ao topo, é preciso saber como se caminha.
              </p>
              <a href="#mandamentos" className="btn-primary mt-8">
                Ver os 10 mandamentos
                <Icon name="arrow" className="h-4 w-4 rotate-90" />
              </a>
            </div>
          </div>
        </section>
        <div className="relative -mt-8 h-8 rounded-t-[36px] bg-canvas" />

        {/* ---------- O que é a nossa cultura ---------- */}
        <section className="py-14 sm:py-20" aria-labelledby="o-que-e">
          <div className="container-page max-w-3xl">
            <span className="eyebrow">Em uma frase</span>
            <h2 id="o-que-e" className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
              O que é a nossa cultura?
            </h2>
            <blockquote className="mt-8 border-l-4 border-accent-500 pl-6 text-2xl font-extrabold leading-snug text-ink sm:text-3xl">
              A forma <span className="text-good">como trabalhamos</span> e{" "}
              <span className="text-bad">como não trabalhamos</span>, sem enrolação.
            </blockquote>
            <p className="mt-6 text-lg leading-relaxed text-inksoft">{CULTURA_DEFINICAO}</p>
          </div>
        </section>

        {/* ---------- Os 10 mandamentos: a trilha ---------- */}
        <section id="mandamentos" className="scroll-mt-20 bg-canvas2 py-14 sm:py-20" aria-labelledby="mandamentos-titulo">
          <div className="container-page max-w-3xl">
            <span className="eyebrow">Os passos da trilha</span>
            <h2 id="mandamentos-titulo" className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
              Nossos 10 mandamentos
            </h2>

            <ol className="relative mt-12">
              {/* a trilha */}
              <span
                aria-hidden
                className="absolute bottom-5 left-5 top-5 w-px -translate-x-1/2 bg-gradient-to-b from-goldline via-accent-500 to-accent-500"
              />
              {MANDAMENTOS.map((texto, i) => (
                <li key={texto} className="relative flex items-start gap-5 pb-6 last:pb-0">
                  <span
                    aria-hidden
                    className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-accent-500 bg-surface font-display text-sm font-extrabold text-ink shadow-soft"
                  >
                    {i + 1}
                  </span>
                  <p className="card flex-1 px-5 py-4 text-lg font-semibold leading-snug text-ink">
                    <span className="sr-only">Mandamento {i + 1}: </span>
                    {texto}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- Quem é / quem não é bem-vindo ---------- */}
        <section className="py-14 sm:py-20" aria-labelledby="perfil-titulo">
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
        <section className="pb-16 sm:pb-24">
          <div className="container-page">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-8 text-white shadow-soft sm:p-12">
              <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
              <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                <div className="max-w-2xl">
                  <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">
                    Se esse é o seu jeito de trabalhar, venha subir com a gente.
                  </h2>
                  <p className="mt-3 text-lg text-brand-100">Veja as vagas abertas no CPPEM Colégio e Cursos.</p>
                </div>
                <Link href="/carreiras#vagas" className="btn-primary shrink-0">
                  Ver vagas abertas
                  <Icon name="arrow" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer settings={settings} />
      <ExitIntentPopup whatsappUrl={settings.whatsapp_group_url} />
    </>
  );
}
