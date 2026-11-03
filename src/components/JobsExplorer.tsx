"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Job } from "@/lib/types";
import { parseUnits } from "@/lib/constants";
import {
  applyFiltersToSearch,
  filtersFromParams,
  filtersQuery,
  type FilterOptions,
  type RawParams,
} from "@/lib/filter-url";
import JobCard from "./JobCard";
import JobFilters, { type FilterState } from "./JobFilters";

interface JobsExplorerProps {
  jobs: Job[];
  /** Parâmetros da URL (ex.: ?categoria=professor&unidade=cppem-concursos). */
  initialParams?: RawParams;
}

const EMPTY: FilterState = {
  search: "",
  category: "",
  department: "",
  unit: "",
  workType: "",
  location: "",
};

const uniqueSorted = (values: string[]) => Array.from(new Set(values)).sort();

/** Opções dos filtros, derivadas das vagas disponíveis. */
function getOptions(jobs: Job[]): FilterOptions {
  return {
    departments: uniqueSorted(
      jobs.map((j) => j.department).filter(Boolean) as string[]
    ),
    units: uniqueSorted(jobs.flatMap((j) => parseUnits(j.unit))),
    locations: uniqueSorted(
      jobs.map((j) => j.location).filter(Boolean) as string[]
    ),
  };
}

/**
 * Componente cliente que gerencia busca/filtros e agrupa as vagas em
 * dois blocos: "Trabalho" e "Professor". Os filtros ficam refletidos na URL
 * para que qualquer combinação possa ser compartilhada por link.
 */
export default function JobsExplorer({
  jobs,
  initialParams = {},
}: JobsExplorerProps) {
  const { departments, units, locations } = useMemo(
    () => getOptions(jobs),
    [jobs]
  );

  // Estado inicial vem da URL (o servidor já renderiza a lista filtrada)
  const [filters, setFilters] = useState<FilterState>(() =>
    filtersFromParams(initialParams, getOptions(jobs))
  );

  // Se o link já chegou com filtros, leva a pessoa direto à lista de resultados
  // (e não ao topo da seção, onde ficam os filtros, que no celular ocupam a tela).
  const arrivedFiltered = useRef(filtersQuery(filters) !== "");
  const resultsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!arrivedFiltered.current) return;
    const id = requestAnimationFrame(() => resultsRef.current?.scrollIntoView());
    return () => cancelAnimationFrame(id);
  }, []);

  // Reflete os filtros na URL sem recarregar a página nem poluir o histórico
  useEffect(() => {
    const query = applyFiltersToSearch(window.location.search, filters);
    const url =
      window.location.pathname +
      (query ? `?${query}` : "") +
      window.location.hash;
    window.history.replaceState(window.history.state, "", url);
  }, [filters]);

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return jobs.filter((job) => {
      if (filters.category && job.category !== filters.category) return false;
      if (filters.department && job.department !== filters.department)
        return false;
      if (filters.unit && !parseUnits(job.unit).includes(filters.unit))
        return false;
      if (filters.workType && job.work_type !== filters.workType) return false;
      if (filters.location && job.location !== filters.location) return false;
      if (term) {
        const haystack = [
          job.title,
          job.short_description,
          job.department,
          job.discipline,
          job.segment,
          job.unit,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [jobs, filters]);

  const trabalho = filtered.filter((j) => j.category === "trabalho");
  const professor = filtered.filter((j) => j.category === "professor");


  return (
    <section id="vagas" className="scroll-mt-20 py-14 sm:py-20">
      <div className="container-page">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="eyebrow">Oportunidades</span>
          <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">Encontre sua vaga</h2>
          <p className="mt-3 text-inksoft">
            Busque a oportunidade ideal para você fazer parte da nossa equipe.
          </p>
        </div>

        <JobFilters
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(EMPTY)}
          departments={departments}
          units={units}
          locations={locations}
        />

        {/* Anunciado por leitores de tela a cada mudança de busca/filtro */}
        <p role="status" aria-live="polite" className="sr-only">
          {filtered.length === 0
            ? "Nenhuma vaga encontrada."
            : `${filtered.length} ${filtered.length === 1 ? "vaga encontrada" : "vagas encontradas"}.`}
        </p>

        <div ref={resultsRef} className="scroll-mt-24">
          {filtered.length === 0 ? (
            <div className="card mt-10 p-10 text-center text-inksoft">
              Nenhuma vaga encontrada com os filtros selecionados. Tente limpar a busca.
            </div>
          ) : (
            <div className="mt-12 space-y-14">
              <JobGroup
                title="Vagas de Trabalho"
                subtitle="Administrativo, comercial, marketing, tecnologia, pedagógico, serviços gerais e demais funções."
                jobs={trabalho}
              />
              <JobGroup
                title="Vagas de Professor"
                subtitle="Professores, instrutores, tutores e mentores ligados diretamente à docência."
                jobs={professor}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function JobGroup({
  title,
  subtitle,
  jobs,
}: {
  title: string;
  subtitle: string;
  jobs: Job[];
}) {
  if (jobs.length === 0) return null;
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-2xl font-extrabold text-ink">{title}</h3>
          <p className="mt-1 text-sm text-inksoft">{subtitle}</p>
        </div>
        <span className="rounded-full bg-goldsoft px-3 py-1 text-xs font-bold text-goldink">
          {jobs.length} {jobs.length === 1 ? "vaga" : "vagas"}
        </span>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
