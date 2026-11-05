import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import JobsExplorer from "@/components/JobsExplorer";
import WhyWorkSection from "@/components/WhyWorkSection";
import ProcessSection from "@/components/ProcessSection";
import FaqSection from "@/components/FaqSection";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import ConnectSection from "@/components/ConnectSection";
import { getOpenJobs } from "@/lib/jobs";
import { getSettings } from "@/lib/settings";
import {
  DEFAULT_FAQ_ITEMS,
  DEFAULT_PROCESS_STEPS,
  DEFAULT_WHY_ITEMS,
  cleanItems,
} from "@/lib/content-defaults";
import type { RawParams } from "@/lib/filter-url";
import { applyTarget } from "@/lib/apply";

export const revalidate = 60;

// Todas as combinações de filtro (?categoria=...) apontam para esta mesma
// página, para o Google não tratar cada uma como uma página diferente.
export const metadata: Metadata = {
  alternates: { canonical: "/carreiras" },
};

interface PageProps {
  searchParams: Promise<RawParams>;
}

export default async function CarreirasPage({ searchParams }: PageProps) {
  const [jobs, settings, params] = await Promise.all([
    getOpenJobs(),
    getSettings(),
    searchParams,
  ]);

  const areasCount = new Set(
    jobs.map((j) =>
      j.category === "professor" ? j.discipline : j.department
    )
  ).size;

  return (
    <>
      <Header apply={applyTarget(settings)} />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <Hero
          openJobsCount={jobs.length}
          areasCount={areasCount}
          stats={[settings.stat_years, settings.stat_students, settings.stat_team, settings.stat_extra].filter(
            Boolean
          ) as string[]}
        />
        <JobsExplorer jobs={jobs} initialParams={params} />
        <AboutSection settings={settings} />
        <WhyWorkSection items={cleanItems(settings.why_items, DEFAULT_WHY_ITEMS)} />
        <ProcessSection steps={cleanItems(settings.process_steps, DEFAULT_PROCESS_STEPS)} />
        <FaqSection items={cleanItems(settings.faq_items, DEFAULT_FAQ_ITEMS)} />
        <ConnectSection whatsappUrl={settings.whatsapp_group_url} linkedinUrl={settings.linkedin_url} />
      </main>
      <Footer settings={settings} />
      <ExitIntentPopup whatsappUrl={settings.whatsapp_group_url} />
    </>
  );
}
