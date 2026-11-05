"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { jobTitles, RECOMMENDATION_LABEL, stageDelay, STAGES } from "@/lib/rh/constants";
import { formatLongDay, formatTime, hireChance, since } from "@/lib/rh/format";
import type { AiReport, Application, Candidate, Stage } from "@/lib/types";
import { Avatar } from "./charts";

export interface PreviewApp
  extends Pick<Application, "id" | "candidate_id" | "jobs" | "job_id" | "job_title" | "pipeline" | "stage" | "status" | "ai_status" | "ai_score" | "interview_score" | "stage_changed_at"> {
  candidates: Pick<Candidate, "full_name" | "city" | "age_range" | "whatsapp"> | null;
}

interface Extra {
  report: AiReport | null;
  about: string | null;
  email: string | null;
}

const REC_TONE = { avancar: "bg-emerald-100 text-emerald-800", talvez: "bg-amber-100 text-amber-800", nao_avancar: "bg-rose-100 text-rose-800" } as const;

/** Prévia do candidato no pipeline: o essencial e as ações principais, sem sair do quadro. */
export default function CandidatePreview({
  app,
  interviewAt,
  now,
  onClose,
  onMove,
  onHire,
  onReject,
  onMessage,
}: {
  app: PreviewApp;
  interviewAt?: string;
  now: number;
  onClose: () => void;
  onMove: (stage: Stage) => void;
  onHire: () => void;
  onReject: () => void;
  onMessage: () => void;
}) {
  const [extra, setExtra] = useState<Extra | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    let alive = true;
    createClient()
      .from("applications")
      .select("ai_report, candidates(about, email)")
      .eq("id", app.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        const c = (data?.candidates ?? null) as unknown as { about: string | null; email: string | null } | null;
        setExtra({ report: (data?.ai_report as AiReport) ?? null, about: c?.about ?? null, email: c?.email ?? null });
      });
    return () => {
      alive = false;
    };
  }, [app.id]);

  const c = app.candidates;
  const r = extra?.report;
  const delay = stageDelay(app, now);
  const chance = hireChance(app);
  const iv = app.interview_score != null && Number(app.interview_score) > 0 ? Number(app.interview_score) : null;
  const btn = "rounded-xl px-3 py-2 text-sm font-semibold transition-colors";

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-labelledby="previa-nome" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <button type="button" aria-label="Fechar prévia" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-brand-950/30" />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl">
        <header className="flex items-start gap-3 border-b border-brand-100 p-5">
          <Avatar name={c?.full_name ?? "?"} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 id="previa-nome" className="truncate text-lg font-extrabold text-brand-950">
              {c?.full_name ?? "Sem nome"}
            </h2>
            <p className="text-sm text-brand-500">{[c?.city, c?.age_range].filter(Boolean).join(" · ") || "—"}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Fechar" className="grid h-9 w-9 place-items-center rounded-xl text-brand-500 hover:bg-brand-50">
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <ul className="flex flex-wrap gap-1.5" aria-label="Vagas">
            {jobTitles(app).map((t) => (
              <li key={t} className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 ring-1 ring-brand-100">
                {t}
              </li>
            ))}
          </ul>

          <div>
            <label htmlFor="previa-etapa" className="text-xs font-bold uppercase tracking-wide text-brand-500">
              Etapa
            </label>
            <div className="mt-1 flex items-center gap-2">
              <select id="previa-etapa" value={app.stage} onChange={(e) => onMove(e.target.value as Stage)} className="input !py-2">
                {STAGES[app.pipeline].map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              {chance != null && (
                <span className="shrink-0 text-right">
                  <span className="block text-[10px] font-bold uppercase text-brand-500">Chance</span>
                  <span className="block text-lg font-black tabular-nums text-brand-900">{chance}%</span>
                </span>
              )}
            </div>
            <p className={`mt-1 text-xs ${delay.late ? "font-semibold text-amber-700" : "text-brand-500"}`}>
              {delay.late ? `⚠ Atrasado: ${since(app.stage_changed_at, now)} nesta etapa (prazo de ${delay.sla} dias)` : `${since(app.stage_changed_at, now)} nesta etapa`}
            </p>
            {interviewAt && (
              <p className="mt-2 rounded-xl bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-800">
                📅 Entrevista: {formatLongDay(interviewAt)}, {formatTime(interviewAt)}
              </p>
            )}
          </div>

          <section aria-label="Avaliação da IA" className="rounded-2xl border border-brand-100 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-brand-950">Avaliação da IA</h3>
              {r && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${REC_TONE[r.recomendacao]}`}>{RECOMMENDATION_LABEL[r.recomendacao]}</span>}
            </div>
            {app.ai_score != null ? (
              <div className="mt-2 flex items-center gap-2">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-brand-100">
                  <span className="block h-full rounded-full bg-brand-500" style={{ width: `${app.ai_score}%` }} />
                </span>
                <span className="text-sm font-black tabular-nums text-brand-950">{app.ai_score}</span>
              </div>
            ) : (
              <p className="mt-1 text-sm text-brand-500">{app.ai_status === "erro" ? "Deu erro na avaliação. Reavalie na ficha." : "Ainda sem avaliação."}</p>
            )}
            {!extra ? (
              <p className="mt-2 text-xs text-brand-400">Carregando...</p>
            ) : (
              r && (
                <>
                  <p className="mt-2 text-sm leading-relaxed text-brand-800">{r.resumo}</p>
                  {(r.pontos_fortes.length > 0 || r.pontos_de_atencao.length > 0) && (
                    <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                      <div>
                        <p className="font-bold uppercase tracking-wide text-emerald-700">Fortes</p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-brand-800">
                          {r.pontos_fortes.slice(0, 3).map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-bold uppercase tracking-wide text-rose-700">Atenção</p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-brand-800">
                          {r.pontos_de_atencao.slice(0, 3).map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                          {r.pontos_de_atencao.length === 0 && <li className="list-none pl-0 text-brand-500">Nenhum</li>}
                        </ul>
                      </div>
                    </div>
                  )}
                </>
              )
            )}
            {iv != null && (
              <p className="mt-3 border-t border-brand-100 pt-2 text-sm text-brand-800">
                Nota da entrevista: <strong className="tabular-nums">{iv.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</strong> / 10
              </p>
            )}
          </section>

          {extra?.about && (
            <section aria-label="Sobre a pessoa">
              <h3 className="text-xs font-bold uppercase tracking-wide text-brand-500">Sobre a pessoa</h3>
              <p className="mt-1 line-clamp-6 whitespace-pre-line text-sm leading-relaxed text-brand-800">{extra.about}</p>
            </section>
          )}
        </div>

        <footer className="space-y-2 border-t border-brand-100 p-4">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onMessage} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}>
              WhatsApp
            </button>
            <Link href={`/admin/candidatos/${app.candidate_id}?c=${app.id}`} className={`${btn} border border-brand-200 text-center text-brand-800 hover:bg-brand-50`}>
              Abrir ficha completa
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onHire} className={`${btn} border border-emerald-200 text-emerald-700 hover:bg-emerald-50`}>
              ✓ Contratar
            </button>
            <button type="button" onClick={onReject} className={`${btn} border border-rose-200 text-rose-700 hover:bg-rose-50`}>
              ✕ Reprovar
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
