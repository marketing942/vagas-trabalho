"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchAll } from "@/lib/rh/fetch-all";
import { PIPELINE_LABEL, STAGES } from "@/lib/rh/constants";
import { aiScoreTone, hireChance, since } from "@/lib/rh/format";
import type { Application, Pipeline, Stage } from "@/lib/types";
import RejectDialog from "./RejectDialog";

export type BoardApp = Pick<
  Application,
  | "id"
  | "candidate_id"
  | "job_id"
  | "job_title"
  | "pipeline"
  | "stage"
  | "rejection_reason"
  | "ai_status"
  | "ai_score"
  | "interview_score"
  | "stage_changed_at"
  | "created_at"
> & { candidates: { full_name: string; city: string | null } | null };

const COLUMNS =
  "id,candidate_id,job_id,job_title,pipeline,stage,rejection_reason,ai_status,ai_score,interview_score,stage_changed_at,created_at,candidates(full_name,city)";
const PAGE = 40;

type Sort = "recentes" | "score" | "chance";

export default function PipelineBoard({ pipeline, onPipeline }: { pipeline: Pipeline; onPipeline: (p: Pipeline) => void }) {
  const [apps, setApps] = useState<BoardApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [job, setJob] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [sort, setSort] = useState<Sort>("recentes");
  const [shown, setShown] = useState<Record<string, number>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<BoardApp | null>(null);
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    const db = createClient();
    fetchAll<BoardApp>((from, to) =>
      db.from("applications").select(COLUMNS).eq("pipeline", pipeline).order("created_at", { ascending: false }).range(from, to)
    ).then(({ data, error }) => {
      if (!alive) return;
      setApps(data);
      setError(error ? "Não foi possível carregar as candidaturas. Confira se a migração 0010 foi executada no Supabase." : "");
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [pipeline, reloadKey]);

  const jobs = useMemo(() => Array.from(new Set(apps.map((a) => a.job_title))).sort((a, b) => a.localeCompare(b, "pt-BR")), [apps]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const list = apps.filter(
      (a) =>
        (!term || (a.candidates?.full_name ?? "").toLocaleLowerCase("pt-BR").includes(term)) &&
        (!job || a.job_title === job) &&
        (!minScore || (a.ai_score ?? -1) >= minScore)
    );
    if (sort === "score") list.sort((a, b) => (b.ai_score ?? -1) - (a.ai_score ?? -1));
    if (sort === "chance") list.sort((a, b) => (hireChance(b) ?? -1) - (hireChance(a) ?? -1));
    return list;
  }, [apps, search, job, minScore, sort]);

  const pending = apps.filter((a) => a.ai_status === "pendente" || a.ai_status === "erro" || a.ai_status === "sem_ia");

  async function move(app: BoardApp, stage: Stage, reason?: string) {
    setMenuFor(null);
    if (app.stage === stage) return;
    if (stage === "reprovado" && !reason) {
      setRejecting(app);
      return;
    }
    const before = apps;
    const patch = { stage, rejection_reason: stage === "reprovado" ? reason ?? null : null };
    setApps((list) => list.map((a) => (a.id === app.id ? { ...a, ...patch, stage_changed_at: new Date().toISOString() } : a)));
    const { error } = await createClient().from("applications").update(patch).eq("id", app.id);
    if (error) {
      setApps(before);
      setError("Não foi possível mover. Tente de novo.");
    }
  }

  async function evaluatePending() {
    const queue = pending.map((a) => a.id);
    setBulk({ done: 0, total: queue.length });
    for (let i = 0; i < queue.length; i++) {
      await fetch("/api/admin/avaliar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ applicationId: queue[i] }) });
      setBulk({ done: i + 1, total: queue.length });
    }
    setBulk(null);
    setReloadKey((k) => k + 1);
  }

  const stages = STAGES[pipeline];

  return (
    <div>
      {/* Funil + filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-brand-200 bg-white p-1" role="tablist" aria-label="Funil">
          {(Object.keys(PIPELINE_LABEL) as Pipeline[]).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={p === pipeline}
              onClick={() => {
                if (p === pipeline) return;
                setLoading(true);
                setJob("");
                onPipeline(p);
              }}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${p === pipeline ? "bg-brand-900 text-white" : "text-brand-700 hover:bg-brand-50"}`}
            >
              {PIPELINE_LABEL[p]}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome"
          aria-label="Buscar por nome"
          className="input !w-56 !py-2"
        />
        <select aria-label="Vaga" value={job} onChange={(e) => setJob(e.target.value)} className="input !w-auto !py-2">
          <option value="">Todas as vagas</option>
          {jobs.map((j) => (
            <option key={j}>{j}</option>
          ))}
        </select>
        <select aria-label="Score mínimo da IA" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="input !w-auto !py-2">
          <option value={0}>Qualquer score</option>
          <option value={50}>Score IA ≥ 50</option>
          <option value={65}>Score IA ≥ 65</option>
          <option value={80}>Score IA ≥ 80</option>
        </select>
        <select aria-label="Ordenar" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input !w-auto !py-2">
          <option value="recentes">Mais recentes</option>
          <option value="score">Maior score IA</option>
          <option value="chance">Maior chance de contratação</option>
        </select>
        <span className="text-sm text-brand-500">{filtered.length} candidatura(s)</span>
        {pending.length > 0 && (
          <button
            type="button"
            disabled={!!bulk}
            onClick={evaluatePending}
            className="ml-auto rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-60"
          >
            {bulk ? `Avaliando ${bulk.done}/${bulk.total}...` : `Avaliar com IA (${pending.length} sem avaliação)`}
          </button>
        )}
      </div>

      {error && <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <p className="text-brand-500">Carregando...</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((s) => {
            const items = filtered.filter((a) => a.stage === s.key);
            const limit = shown[s.key] ?? PAGE;
            return (
              <section
                key={s.key}
                aria-label={s.label}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  setOverStage(s.key);
                }}
                onDragLeave={() => setOverStage((o) => (o === s.key ? null : o))}
                onDrop={(e) => {
                  e.preventDefault();
                  const app = apps.find((a) => a.id === dragId);
                  setDragId(null);
                  setOverStage(null);
                  if (app) move(app, s.key);
                }}
                className={`flex w-72 shrink-0 flex-col rounded-2xl border p-3 transition-colors ${
                  overStage === s.key ? "border-accent-500 bg-accent-50" : s.side ? "border-brand-100 bg-brand-50/60" : "border-brand-100 bg-white"
                }`}
              >
                <header className="mb-3 flex items-center justify-between px-1">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-brand-900">
                    <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} aria-hidden />
                    {s.label}
                  </h2>
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">{items.length}</span>
                </header>
                <ul className="space-y-2">
                  {items.slice(0, limit).map((a) => (
                    <li
                      key={a.id}
                      draggable
                      onDragStart={(e) => {
                        setDragId(a.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverStage(null);
                      }}
                      className={`group relative rounded-xl border border-brand-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${dragId === a.id ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/admin/candidatos/${a.candidate_id}?c=${a.id}`} className="min-w-0 font-semibold leading-snug text-brand-950 hover:underline">
                          {a.candidates?.full_name ?? "Sem nome"}
                        </Link>
                        <span
                          title={a.ai_score != null ? "Score de perfil (IA)" : a.ai_status === "avaliando" ? "IA avaliando" : "Ainda sem avaliação da IA"}
                          className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ${aiScoreTone(a.ai_score)}`}
                        >
                          {a.ai_score ?? (a.ai_status === "avaliando" ? "…" : "–")}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-brand-600">
                        {a.job_title}
                        {a.candidates?.city ? ` · ${a.candidates.city}` : ""}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs text-brand-500">
                        <span>
                          {since(a.stage_changed_at)}
                          {a.interview_score != null && Number(a.interview_score) > 0 && (
                            <> · Entrevista {Number(a.interview_score).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</>
                          )}
                          {a.stage === "reprovado" && a.rejection_reason && <> · {a.rejection_reason}</>}
                        </span>
                        <button
                          type="button"
                          aria-haspopup="menu"
                          aria-expanded={menuFor === a.id}
                          onClick={() => setMenuFor(menuFor === a.id ? null : a.id)}
                          className="rounded-md px-2 py-0.5 font-semibold text-brand-600 hover:bg-brand-50"
                        >
                          Mover
                        </button>
                      </div>
                      {menuFor === a.id && (
                        <ul role="menu" className="absolute right-2 top-full z-20 mt-1 w-56 rounded-xl border border-brand-100 bg-white p-1 shadow-lg">
                          {stages
                            .filter((o) => o.key !== a.stage)
                            .map((o) => (
                              <li key={o.key} role="none">
                                <button
                                  role="menuitem"
                                  type="button"
                                  onClick={() => move(a, o.key)}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm text-brand-800 hover:bg-brand-50"
                                >
                                  <span className={`h-2 w-2 rounded-full ${o.dot}`} aria-hidden /> {o.label}
                                </button>
                              </li>
                            ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
                {items.length > limit && (
                  <button
                    type="button"
                    onClick={() => setShown((m) => ({ ...m, [s.key]: limit + PAGE }))}
                    className="mt-2 rounded-lg py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50"
                  >
                    Mostrar mais ({items.length - limit})
                  </button>
                )}
                {items.length === 0 && <p className="px-1 py-6 text-center text-xs text-brand-400">Ninguém nesta etapa</p>}
              </section>
            );
          })}
        </div>
      )}

      {rejecting && (
        <RejectDialog
          pipeline={pipeline}
          name={rejecting.candidates?.full_name ?? ""}
          onCancel={() => setRejecting(null)}
          onConfirm={(reason) => {
            const app = rejecting;
            setRejecting(null);
            move(app, "reprovado", reason);
          }}
        />
      )}
    </div>
  );
}

