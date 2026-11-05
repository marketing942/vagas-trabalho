import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import ApplicationForm from "@/components/candidatura/ApplicationForm";
import { getSettings } from "@/lib/settings";
import { getOpenJobs } from "@/lib/jobs";
import { applyTarget } from "@/lib/apply";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Candidatura | Carreiras CPPEM",
  description: "Envie a sua candidatura para as vagas do CPPEM Colégio e Cursos.",
  robots: { index: false, follow: true },
};

export default async function CandidaturaPage({
  searchParams,
}: {
  searchParams: Promise<{ vaga?: string; teste?: string }>;
}) {
  const [settings, jobs, params] = await Promise.all([getSettings(), getOpenJobs(), searchParams]);
  // Com o formulário desligado, a página só abre em modo de teste (?teste=1), para o RH conferir antes de ligar.
  const enabled = settings.applications_enabled || params.teste === "1";
  const preselected = jobs.find((j) => j.slug === params.vaga);

  return (
    <>
      <Header apply={applyTarget(settings)} />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 py-10 text-white sm:py-14">
          <div className="container-page max-w-3xl">
            <Link
              href={preselected ? `/carreiras/${preselected.slug}` : "/carreiras#vagas"}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-brand-50 transition-colors hover:bg-white/20"
            >
              <Icon name="arrow" className="h-4 w-4 rotate-180" /> {preselected ? "Voltar para a vaga" : "Ver as vagas"}
            </Link>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight sm:text-5xl">
              {preselected ? <>Candidatura: {preselected.title}</> : "Faça sua candidatura"}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-brand-100">
              Leva poucos minutos. Ao enviar, você já fica inscrito(a) no processo seletivo.
            </p>
          </div>
        </div>

        <div className="container-page max-w-3xl pb-20 pt-8">
          {enabled ? (
            <ApplicationForm
              jobs={jobs.map((j) => ({ id: j.id, title: j.title, slug: j.slug, category: j.category, hint: [j.department || j.discipline, j.unit || j.segment].filter(Boolean).join(" · ") }))}
              preselectedId={preselected?.id}
              whatsappGroupUrl={settings.whatsapp_group_url}
            />
          ) : (
            <div className="card p-8 text-center">
              <p className="text-lg text-inksoft">As candidaturas são feitas pelo nosso formulário.</p>
              <a href={preselected?.apply_url || settings.form_url} target="_blank" rel="noopener noreferrer" className="btn-primary mt-6">
                Abrir o formulário de candidatura
                <Icon name="arrow" className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </main>
      <Footer settings={settings} />
    </>
  );
}
