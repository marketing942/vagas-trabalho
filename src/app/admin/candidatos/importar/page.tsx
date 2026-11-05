"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { createClient } from "@/lib/supabase/client";
import { fetchAll } from "@/lib/rh/fetch-all";
import { PIPELINE_LABEL, stageDef, STATUS, TALENT_POOL } from "@/lib/rh/constants";
import { buildPeople, detectPipeline, groupProcesses, matchJob, parseCsv, type ImportPerson } from "@/lib/rh/notion-import";
import type { Job, Pipeline } from "@/lib/types";

type JobLite = Pick<Job, "id" | "title" | "category" | "status">;
const KEEP = "";

interface Result {
  people: number;
  linked: number;
  apps: number;
  skipped: number;
}

/** Importa os bancos de candidatos do Notion (arquivo CSV exportado). */
export default function ImportarPage() {
  const [jobs, setJobs] = useState<JobLite[]>([]);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    createClient()
      .from("jobs")
      .select("id,title,category,status")
      .order("title")
      .then(({ data }) => setJobs((data as JobLite[]) ?? []));
  }, []);

  const people = useMemo(() => (pipeline ? buildPeople(rows, pipeline) : []), [rows, pipeline]);
  const vagas = useMemo(() => {
    const count = new Map<string, number>();
    people.forEach((p) => p.applications.forEach((a) => count.set(a.vaga, (count.get(a.vaga) ?? 0) + 1)));
    return [...count.entries()].sort((a, b) => b[1] - a[1]);
  }, [people]);
  const stageCount = useMemo(() => {
    const c = new Map<string, number>();
    people.forEach((p) => p.applications.forEach((a) => {
      const k = a.status === "em_processo" ? a.stage : a.status;
      c.set(k, (c.get(k) ?? 0) + 1);
    }));
    return [...c.entries()].sort((a, b) => b[1] - a[1]);
  }, [people]);

  async function readFile(file: File) {
    setError("");
    setResult(null);
    const parsed = parseCsv(await file.text());
    const detected = detectPipeline(parsed);
    if (!detected) {
      setRows([]);
      setPipeline(null);
      return setError("Este arquivo não parece um banco de candidatos do Notion (faltam as colunas do formulário).");
    }
    setFileName(file.name);
    setRows(parsed);
    setPipeline(detected);
    autoMap(parsed, detected);
  }

  function autoMap(parsed: Record<string, string>[], p: Pipeline) {
    const names = new Set(buildPeople(parsed, p).flatMap((x) => x.applications.map((a) => a.vaga)));
    setMapping(Object.fromEntries([...names].map((n) => [n, n === TALENT_POOL ? KEEP : matchJob(n, jobs, p)?.id ?? KEEP])));
  }

  async function runImport() {
    if (!pipeline) return;
    const db = createClient();
    setError("");
    setProgress("Conferindo quem já está no sistema...");
    const existing = await fetchAll<{ id: string; whatsapp_digits: string; external_ref: string | null }>((from, to) =>
      db.from("candidates").select("id,whatsapp_digits,external_ref").range(from, to)
    );
    if (existing.error) {
      setProgress(null);
      return setError("Não foi possível ler os candidatos. Confira se a migração 0010 foi executada.");
    }
    const byRef = new Map(existing.data.filter((c) => c.external_ref).map((c) => [c.external_ref!, c.id]));
    const byPhone = new Map(existing.data.filter((c) => c.whatsapp_digits?.length >= 10).map((c) => [c.whatsapp_digits, c.id]));
    const ref = (p: ImportPerson) => `notion:${pipeline}:${p.key}`;

    const idOf = new Map<string, string>();
    let linked = 0;
    const toCreate: ImportPerson[] = [];
    for (const p of people) {
      const found = byRef.get(ref(p)) ?? (p.whatsapp_digits ? byPhone.get(p.whatsapp_digits) ?? byPhone.get(`55${p.whatsapp_digits}`) : undefined);
      if (found) {
        idOf.set(p.key, found);
        linked++;
      } else toCreate.push(p);
    }

    for (let i = 0; i < toCreate.length; i += 200) {
      setProgress(`Cadastrando pessoas... ${Math.min(i + 200, toCreate.length)}/${toCreate.length}`);
      const batch = toCreate.slice(i, i + 200);
      const { data, error } = await db
        .from("candidates")
        .insert(
          batch.map((p) => ({
            full_name: p.full_name,
            email: p.email,
            whatsapp: p.whatsapp,
            social_url: p.social_url,
            age_range: p.age_range,
            city: p.city,
            about: p.about,
            sources: p.sources,
            resume_name: p.resume_name,
            origin: "notion",
            external_ref: ref(p),
            created_at: p.created_at,
          }))
        )
        .select("id,external_ref");
      if (error) {
        setProgress(null);
        return setError(`Erro ao cadastrar pessoas: ${error.message}`);
      }
      (data ?? []).forEach((c) => idOf.set(c.external_ref.slice(`notion:${pipeline}:`.length), c.id));
    }

    // Um card por pessoa e funil (todas as vagas em aberto juntas). Pula o que a pessoa já tem:
    // card em aberto neste funil, ou o mesmo resultado para a mesma vaga.
    setProgress("Conferindo candidaturas existentes...");
    const ids = [...new Set(idOf.values())];
    const have = new Set<string>();
    for (let i = 0; i < ids.length; i += 200) {
      const { data } = await db.from("applications").select("candidate_id,pipeline,status,job_title").in("candidate_id", ids.slice(i, i + 200));
      (data ?? []).forEach((a) => {
        if (a.pipeline !== pipeline) return;
        have.add(a.status === "em_processo" ? `${a.candidate_id}|aberto` : `${a.candidate_id}|${a.status}|${a.job_title}`);
      });
    }
    const jobById = new Map(jobs.map((j) => [j.id, j]));
    const jobRef = (vaga: string) => {
      const id = mapping[vaga] || null;
      return { id, title: id ? jobById.get(id)!.title : vaga };
    };
    const rowsToInsert: Record<string, unknown>[] = [];
    let skipped = 0;
    for (const p of people) {
      const candidateId = idOf.get(p.key);
      if (!candidateId) continue;
      for (const proc of groupProcesses(p.applications)) {
        // Vagas do Notion que caíram na mesma vaga do site viram uma só
        const refs = proc.vagas.map(jobRef).filter((r, i, all) => all.findIndex((x) => (x.id ?? x.title) === (r.id ?? r.title)) === i);
        const k = proc.status === "em_processo" ? `${candidateId}|aberto` : `${candidateId}|${proc.status}|${refs[0].title}`;
        if (have.has(k)) {
          skipped++;
          continue;
        }
        have.add(k);
        rowsToInsert.push({
          candidate_id: candidateId,
          job_id: refs[0].id,
          job_title: refs[0].title,
          jobs: refs,
          pipeline,
          stage: proc.stage,
          status: proc.status,
          rejection_reason: proc.reason,
          ai_status: "sem_ia",
          ai_score: proc.ai_score,
          ...proc.scores,
          created_at: proc.created_at,
          stage_changed_at: proc.created_at,
          closed_at: proc.status === "em_processo" ? null : proc.created_at,
        });
      }
    }
    for (let i = 0; i < rowsToInsert.length; i += 200) {
      setProgress(`Importando candidaturas... ${Math.min(i + 200, rowsToInsert.length)}/${rowsToInsert.length}`);
      const { error } = await db.from("applications").insert(rowsToInsert.slice(i, i + 200));
      if (error) {
        setProgress(null);
        return setError(`Erro ao importar candidaturas: ${error.message}`);
      }
    }
    setProgress(null);
    setResult({ people: toCreate.length, linked, apps: rowsToInsert.length, skipped });
  }

  const pipelineJobs = jobs.filter((j) => j.category === pipeline);

  return (
    <AdminLayout title="Importar candidatos do Notion">
      <div className="max-w-4xl space-y-5">
        <div className="card p-5 text-sm leading-relaxed text-brand-700">
          <p>
            No Notion, abra o banco (ATS ou Candidatos a professores), clique em <strong>⋯ → Exportar → CSV</strong> e envie o arquivo
            aqui. O arquivo é lido no seu navegador e vai direto para o banco de dados. Pode importar de novo depois: quem já foi
            importado não é duplicado.
          </p>
          <p className="mt-2 text-brand-500">
            Os currículos ficam no Notion (o nome do arquivo aparece na ficha). As candidaturas importadas não são avaliadas pela IA
            automaticamente; avalie na ficha quem interessar.
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            aria-label="Arquivo CSV do Notion"
            onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])}
            className="mt-4 block text-sm"
          />
        </div>

        {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        {pipeline && people.length > 0 && !result && (
          <>
            <div className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-brand-900">
                  <strong>{fileName}</strong>: {rows.length} envios → <strong>{people.length} pessoas</strong> e{" "}
                  <strong>{people.reduce((s, p) => s + p.applications.length, 0)} candidaturas</strong>
                </p>
                <label className="text-sm text-brand-700">
                  Funil{" "}
                  <select
                    value={pipeline}
                    onChange={(e) => {
                      const p = e.target.value as Pipeline;
                      setPipeline(p);
                      autoMap(rows, p);
                    }}
                    className="input !inline-block !w-auto !py-1.5"
                  >
                    {(Object.keys(PIPELINE_LABEL) as Pipeline[]).map((p) => (
                      <option key={p} value={p}>
                        {PIPELINE_LABEL[p]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-3 text-xs text-brand-500">
                Etapas: {stageCount.map(([s, n]) => `${s in STATUS ? STATUS[s as keyof typeof STATUS].label : stageDef(pipeline, s).label} (${n})`).join(" · ")}
              </p>
            </div>

            <div className="card p-5">
              <h2 className="font-bold text-brand-950">Vagas do Notion → vagas do site</h2>
              <p className="mt-1 text-sm text-brand-500">Conferimos pelo nome. Ajuste se precisar. Sem vaga no site, a candidatura guarda o nome do Notion.</p>
              <table className="mt-4 w-full text-left text-sm">
                <thead className="text-xs uppercase text-brand-500">
                  <tr>
                    <th className="pb-2">No Notion</th>
                    <th className="pb-2 text-right">Candidaturas</th>
                    <th className="pb-2 pl-4">No site</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {vagas.map(([v, n]) => (
                    <tr key={v}>
                      <td className="py-2 pr-2 text-brand-900">{v}</td>
                      <td className="py-2 text-right tabular-nums text-brand-700">{n}</td>
                      <td className="py-2 pl-4">
                        <select
                          aria-label={`Vaga do site para ${v}`}
                          value={mapping[v] ?? KEEP}
                          onChange={(e) => setMapping((m) => ({ ...m, [v]: e.target.value }))}
                          className="input !py-1.5"
                        >
                          <option value={KEEP}>{v === TALENT_POOL ? "Banco de Talentos" : "Sem vaga no site (manter o nome)"}</option>
                          {pipelineJobs.map((j) => (
                            <option key={j.id} value={j.id}>
                              {j.title}
                              {j.status !== "aberta" ? ` (${j.status})` : ""}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3">
              <button type="button" disabled={!!progress} onClick={runImport} className="rounded-lg bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {progress ?? `Importar ${people.length} pessoas`}
              </button>
            </div>
          </>
        )}

        {result && (
          <div className="card p-5" role="status">
            <h2 className="font-bold text-brand-950">Importação concluída</h2>
            <ul className="mt-3 space-y-1 text-sm text-brand-800">
              <li>{result.people} pessoas cadastradas</li>
              <li>{result.linked} já estavam no sistema (ligadas ao cadastro existente)</li>
              <li>{result.apps} candidaturas importadas</li>
              {result.skipped > 0 && <li>{result.skipped} candidaturas repetidas (já existiam ou eram a mesma vaga) foram puladas</li>}
            </ul>
            <Link href={`/admin/candidatos${pipeline === "professor" ? "?funil=professor" : ""}`} className="mt-4 inline-block rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white">
              Ver no pipeline
            </Link>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
