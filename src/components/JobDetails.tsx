import Link from "next/link";
import type { Job } from "@/lib/types";
import { categoryLabel, parseUnits, workTypeLabel } from "@/lib/constants";
import { looksLikeHtml, sanitizeHtml } from "@/lib/sanitize";
import Icon, { type IconName } from "./Icon";
import ShareJob from "./ShareJob";
import TrackedLink from "./TrackedLink";
import PrivacyNote from "./PrivacyNote";
import type { ApplyTarget } from "@/lib/apply";

interface JobDetailsProps {
  job: Job;
  apply: ApplyTarget;
}

function Section({
  title,
  content,
  highlight = false,
}: {
  title: string;
  content?: string | null;
  highlight?: boolean;
}) {
  if (!content) return null;
  return (
    <div className={`card p-6 sm:p-8 ${highlight ? "border-goldline bg-goldfaint" : ""}`}>
      <h3 className="text-xl font-extrabold text-ink">{title}</h3>
      {looksLikeHtml(content) ? (
        <div
          className="richtext mt-3 leading-relaxed text-inksoft"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
        />
      ) : (
        <p className="mt-3 whitespace-pre-line leading-relaxed text-inksoft">{content}</p>
      )}
    </div>
  );
}

/** Conteúdo da página de detalhes de uma vaga. */
export default function JobDetails({ job, apply }: JobDetailsProps) {
  const external = apply.external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  const units = parseUnits(job.unit);
  const meta: { icon: IconName; label: string; value?: string | null }[] = ([
    { icon: "briefcase", label: "Tipo", value: categoryLabel(job.category) },
    {
      icon: "book",
      label: job.category === "professor" ? "Categoria" : "Setor",
      value: job.category === "professor" ? job.discipline : job.department,
    },
    { icon: "book", label: "Segmento", value: job.segment },
    { icon: "spark", label: "Modelo", value: workTypeLabel(job.work_type) },
    { icon: "building", label: "Unidade", value: units.join(", ") || job.unit },
    { icon: "pin", label: "Local", value: job.location },
    { icon: "clock", label: "Horário previsto", value: job.expected_schedule },
  ] as { icon: IconName; label: string; value?: string | null }[]).filter((m) => !!m.value);

  return (
    <div>
      {/* Cabeçalho da vaga */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 py-12 text-white sm:py-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div className="container-page relative">
          <Link
            href="/carreiras#vagas"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-brand-50 transition-colors hover:bg-white/20"
          >
            <Icon name="arrow" className="h-4 w-4 rotate-180" /> Todas as vagas
          </Link>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-200">
              {categoryLabel(job.category)}
            </span>
            {job.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-goldsoft px-3 py-1 text-xs font-bold text-goldink">
                <Icon name="star" className="h-3.5 w-3.5" /> Destaque
              </span>
            )}
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl">{job.title}</h1>
          {job.short_description && (
            <p className="mt-4 max-w-2xl text-lg text-brand-100">{job.short_description}</p>
          )}
          <TrackedLink
            href={apply.href}
            {...external}
            event="candidatar"
            eventProps={{ vaga: job.slug, local: "topo" }}
            className="btn-primary mt-7"
          >
            Candidatar-se agora
            {apply.external && <span className="sr-only"> (abre em nova aba)</span>}
            <Icon name="arrow" className="h-4 w-4" />
          </TrackedLink>
          <PrivacyNote className="mt-3 max-w-md text-xs text-brand-200" linkClassName="underline hover:text-white" />
          <ShareJob title={job.title} slug={job.slug} />
        </div>
      </div>
      <div className="h-8 -mt-8 rounded-t-[36px] bg-canvas relative" />

      <div className="container-page grid gap-8 pb-16 pt-2 lg:grid-cols-3">
        {/* Conteúdo principal */}
        <div className="space-y-6 lg:col-span-2">
          <Section title="Descrição da vaga" content={job.description} />
          <Section title="Responsabilidades" content={job.responsibilities} />
          <Section title="Requisitos e qualificações" content={job.requirements} />
          <Section title="Benefícios" content={job.benefits} highlight />
        </div>

        {/* Painel lateral fixo */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-5">
            <div className="card p-6">
              <h2 className="eyebrow">Informações</h2>
              <dl className="mt-5 space-y-4">
                {meta.map((m) => (
                  <div key={m.label} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-canvas2 text-inksoft">
                      <Icon name={m.icon} className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-inkmuted">{m.label}</dt>
                      <dd className="text-sm font-semibold text-ink">{m.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>

            <TrackedLink
              href={apply.href}
              {...external}
              event="candidatar"
              eventProps={{ vaga: job.slug, local: "lateral" }}
              className="btn-primary w-full"
            >
              Candidatar-se agora
              {apply.external && <span className="sr-only"> (abre em nova aba)</span>}
            </TrackedLink>
            <p className="text-center text-xs text-inkmuted">
              {apply.external
                ? "Você será direcionado ao nosso formulário de candidatura."
                : "Formulário rápido, aqui mesmo no site."}
            </p>
            <PrivacyNote className="text-center text-xs text-inkmuted" linkClassName="underline hover:text-ink" />
          </div>
        </aside>
      </div>
    </div>
  );
}
