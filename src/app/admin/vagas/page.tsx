"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { createClient } from "@/lib/supabase/client";
import {
  CATEGORIES,
  STATUSES,
  categoryLabel,
  statusLabel,
  parseUnits,
  STATUS_BADGE,
} from "@/lib/constants";
import type { Job, JobStatus } from "@/lib/types";

interface Filters {
  search: string;
  category: string;
  sector: string;
  unit: string;
  status: string;
}

const EMPTY_FILTERS: Filters = {
  search: "",
  category: "",
  sector: "",
  unit: "",
  status: "",
};

export default function VagasPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const supabase = createClient();

  // Recarrega a lista (usado após mutações).
  async function refetch() {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("updated_at", { ascending: false });
    setJobs((data as Job[]) ?? []);
  }

  useEffect(() => {
    createClient()
      .from("jobs")
      .select("*")
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        setJobs((data as Job[]) ?? []);
        setLoading(false);
      });
  }, []);

  async function updateStatus(id: string, status: JobStatus) {
    setBusy(id);
    await supabase.from("jobs").update({ status }).eq("id", id);
    await refetch();
    setBusy(null);
  }

  async function toggleFeatured(id: string, featured: boolean) {
    setBusy(id);
    await supabase.from("jobs").update({ featured }).eq("id", id);
    await refetch();
    setBusy(null);
  }

  async function remove(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta vaga? Esta ação não pode ser desfeita.")) {
      return;
    }
    setBusy(id);
    await supabase.from("jobs").delete().eq("id", id);
    await refetch();
    setBusy(null);
  }

  // Opções de filtro derivadas das vagas existentes
  const sectorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          jobs
            .map((j) => j.department || j.discipline)
            .filter(Boolean) as string[]
        )
      ).sort(),
    [jobs]
  );
  const unitOptions = useMemo(
    () => Array.from(new Set(jobs.flatMap((j) => parseUnits(j.unit)))).sort(),
    [jobs]
  );

  const set = (key: keyof Filters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return jobs.filter((job) => {
      if (filters.category && job.category !== filters.category) return false;
      if (
        filters.sector &&
        (job.department || job.discipline) !== filters.sector
      )
        return false;
      if (filters.unit && !parseUnits(job.unit).includes(filters.unit))
        return false;
      if (filters.status && job.status !== filters.status) return false;
      if (term) {
        const haystack = [
          job.title,
          job.department,
          job.discipline,
          job.segment,
          job.unit,
          job.location,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [jobs, filters]);

  const hasFilters =
    filters.search !== "" ||
    filters.category !== "" ||
    filters.sector !== "" ||
    filters.unit !== "" ||
    filters.status !== "";

  return (
    <AdminLayout title="Vagas">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-brand-600">
          {hasFilters ? (
            <>
              <span className="font-semibold text-brand-900">
                {filtered.length}
              </span>{" "}
              de {jobs.length} vaga(s)
            </>
          ) : (
            <>{jobs.length} vaga(s) cadastrada(s)</>
          )}
        </p>
        <Link href="/admin/vagas/nova" className="btn-primary !py-2">
          + Nova vaga
        </Link>
      </div>

      {/* Busca e filtros */}
      {jobs.length > 0 && (
        <div className="card mb-6 p-4">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-400">
              🔍
            </span>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => set("search", e.target.value)}
              placeholder="Buscar por título, setor, unidade, local..."
              className="input !pl-10"
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={filters.category}
              onChange={(e) => set("category", e.target.value)}
              className="input"
            >
              <option value="">Todas as categorias</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={filters.sector}
              onChange={(e) => set("sector", e.target.value)}
              className="input"
            >
              <option value="">Todos os setores / disciplinas</option>
              {sectorOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={filters.unit}
              onChange={(e) => set("unit", e.target.value)}
              className="input"
            >
              <option value="">Todas as unidades</option>
              {unitOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => set("status", e.target.value)}
              className="input"
            >
              <option value="">Todos os status</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="btn-secondary !py-2 text-sm"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-brand-500">Carregando...</p>
      ) : jobs.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-brand-600">Nenhuma vaga cadastrada ainda.</p>
          <Link href="/admin/vagas/nova" className="btn-primary mt-4">
            Cadastrar primeira vaga
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-brand-600">
            Nenhuma vaga encontrada com os filtros selecionados.
          </p>
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="btn-secondary mt-4"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-brand-50 text-xs uppercase tracking-wide text-brand-500">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Setor / Disciplina</th>
                <th className="px-4 py-3">Unidade</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Atualizada</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {filtered.map((job) => (
                <tr key={job.id} className="hover:bg-brand-50/50">
                  <td className="px-4 py-3 font-medium text-brand-900">
                    {job.featured && (
                      <span title="Vaga em destaque" className="mr-1">
                        ⭐
                      </span>
                    )}
                    {job.title}
                  </td>
                  <td className="px-4 py-3 text-brand-600">
                    {categoryLabel(job.category)}
                  </td>
                  <td className="px-4 py-3 text-brand-600">
                    {job.department || job.discipline || "—"}
                  </td>
                  <td className="px-4 py-3 text-brand-600">
                    {job.unit || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        STATUS_BADGE[job.status]
                      }`}
                    >
                      {statusLabel(job.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-500">
                    {new Date(job.updated_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2 whitespace-nowrap">
                      <Link
                        href={`/admin/vagas/${job.id}/editar`}
                        className="rounded-md border border-brand-200 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                      >
                        Editar
                      </Link>
                      <button
                        disabled={busy === job.id}
                        onClick={() => toggleFeatured(job.id, !job.featured)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                          job.featured
                            ? "border-accent-500 bg-accent-50 text-brand-800 hover:bg-accent-100"
                            : "border-brand-200 text-brand-700 hover:bg-brand-50"
                        }`}
                      >
                        {job.featured ? "Remover destaque" : "Destacar"}
                      </button>
                      {job.status === "aberta" ? (
                        <button
                          disabled={busy === job.id}
                          onClick={() => updateStatus(job.id, "encerrada")}
                          className="rounded-md border border-brand-200 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                        >
                          Encerrar
                        </button>
                      ) : (
                        <button
                          disabled={busy === job.id}
                          onClick={() => updateStatus(job.id, "aberta")}
                          className="rounded-md border border-green-200 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                        >
                          Reabrir
                        </button>
                      )}
                      <button
                        disabled={busy === job.id}
                        onClick={() => remove(job.id)}
                        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
