import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JobDetails from "@/components/JobDetails";
import ClosedJobNotice from "@/components/ClosedJobNotice";
import JobPostingJsonLd from "@/components/JobPostingJsonLd";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import { getJobBySlug, getRelatedOpenJobs } from "@/lib/jobs";
import { getSettings } from "@/lib/settings";
import { SITE_NAME } from "@/lib/site";
import { applyTarget } from "@/lib/apply";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return { title: "Vaga não encontrada | CPPEM", robots: { index: false } };

  const closed = job.status !== "aberta";
  const title = closed ? `${job.title} (vaga encerrada) | Carreiras CPPEM` : `${job.title} | Carreiras CPPEM`;
  const description = closed
    ? "Esta vaga foi encerrada. Veja outras oportunidades abertas no CPPEM Colégio e Cursos."
    : job.short_description || `Vaga de ${job.title} no CPPEM Colégio e Cursos, em ${job.location}.`;

  return {
    title,
    description,
    alternates: { canonical: `/carreiras/${job.slug}` },
    // Vaga encerrada não deve aparecer no Google como oportunidade
    robots: closed ? { index: false, follow: true } : undefined,
    openGraph: { type: "website", locale: "pt_BR", siteName: SITE_NAME, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function JobPage({ params }: PageProps) {
  const { slug } = await params;
  const [job, settings] = await Promise.all([getJobBySlug(slug), getSettings()]);

  if (!job) notFound();

  const closed = job.status !== "aberta";
  const related = closed ? await getRelatedOpenJobs(job, 3) : [];

  return (
    <>
      <Header apply={applyTarget(settings)} />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        {closed ? (
          <ClosedJobNotice job={job} related={related} whatsappUrl={settings.whatsapp_group_url} />
        ) : (
          <>
            <JobPostingJsonLd job={job} settings={settings} />
            <JobDetails job={job} apply={applyTarget(settings, job)} />
          </>
        )}
      </main>
      <Footer settings={settings} />
      <ExitIntentPopup whatsappUrl={settings.whatsapp_group_url} />
    </>
  );
}
