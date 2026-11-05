"use client";

import { RECOMMENDATION_LABEL } from "@/lib/rh/constants";
import { aiScoreTone, formatDateTime } from "@/lib/rh/format";
import type { Application } from "@/lib/types";

const REC_TONE = {
  avancar: "bg-emerald-100 text-emerald-800",
  talvez: "bg-amber-100 text-amber-800",
  nao_avancar: "bg-rose-100 text-rose-800",
} as const;

/** Scorecard da IA: perfil da pessoa x requisitos da vaga. */
export default function AiScorecard({
  app,
  busy,
  onEvaluate,
}: {
  app: Application;
  busy: boolean;
  onEvaluate: () => void;
}) {
  const r = app.ai_report;
  const stuck = app.ai_status === "avaliando" && Date.now() - new Date(app.updated_at).getTime() > 5 * 60_000;
  const button = (label: string) => (
    <button
      type="button"
      onClick={onEvaluate}
      disabled={busy}
      className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-60"
    >
      {busy ? "Avaliando..." : label}
    </button>
  );

  return (
    <section className="card p-5" aria-labelledby={`ia-${app.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`ia-${app.id}`} className="font-bold text-brand-950">
          Scorecard da IA
        </h3>
        {r && button("Reavaliar")}
      </div>

      {!r && (
        <div className="mt-3 rounded-xl bg-brand-50 p-4 text-sm text-brand-700">
          {app.ai_status === "avaliando" && !stuck && <p>A IA está avaliando esta candidatura. Atualize em alguns segundos.</p>}
          {(app.ai_status === "pendente" || stuck) && <p>Esta candidatura ainda não foi avaliada pela IA.</p>}
          {app.ai_status === "sem_ia" && <p>Avaliação por IA desligada ou chave da IA não configurada no servidor.</p>}
          {app.ai_status === "erro" && <p className="text-rose-700">Não foi possível avaliar: {app.ai_error}</p>}
          <div className="mt-3">{button("Avaliar com IA")}</div>
        </div>
      )}

      {r && (
        <div className="mt-4 space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className={`grid h-20 w-20 place-items-center rounded-2xl ${aiScoreTone(r.score)}`}>
              <span className="text-3xl font-black tabular-nums">{r.score}</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${REC_TONE[r.recomendacao]}`}>{RECOMMENDATION_LABEL[r.recomendacao]}</span>
              <p className="mt-2 text-sm leading-relaxed text-brand-800">{r.resumo}</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-brand-500">Critérios da vaga</h4>
            <ul className="mt-2 space-y-3">
              {r.criterios.map((c) => (
                <li key={c.criterio}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-semibold text-brand-900">{c.criterio}</span>
                    <span className="tabular-nums text-brand-600">{c.nota}/10</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-brand-100">
                    <div className="h-full rounded-full bg-brand-700" style={{ width: `${c.nota * 10}%` }} />
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-brand-600">{c.evidencia}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-accent-50 p-3">
            <p className="flex justify-between text-sm font-semibold text-brand-900">
              <span>Fit cultural (10 mandamentos)</span>
              <span className="tabular-nums">{r.fit_cultural.nota}/10</span>
            </p>
            <p className="mt-1 text-xs leading-relaxed text-brand-700">{r.fit_cultural.comentario}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-emerald-700">Pontos fortes</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-brand-800">
                {r.pontos_fortes.length ? r.pontos_fortes.map((p) => <li key={p}>{p}</li>) : <li className="list-none pl-0 text-brand-500">Nenhum destacado</li>}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-rose-700">Pontos de atenção</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-brand-800">
                {r.pontos_de_atencao.length ? r.pontos_de_atencao.map((p) => <li key={p}>{p}</li>) : <li className="list-none pl-0 text-brand-500">Nenhum</li>}
              </ul>
            </div>
          </div>

          {r.perguntas_entrevista.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-brand-500">Perguntas sugeridas para a entrevista</h4>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-brand-800">
                {r.perguntas_entrevista.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>
            </div>
          )}

          <p className="border-t border-brand-100 pt-3 text-xs text-brand-500">
            {r.curriculo_lido ? "Currículo lido pela IA" : "Avaliado sem currículo (ou em formato que a IA não lê)"}
            {app.ai_evaluated_at && <> · {formatDateTime(app.ai_evaluated_at)}</>}
            {app.ai_model && <> · {app.ai_model}</>}. A IA apoia a triagem; a decisão é da equipe.
          </p>
        </div>
      )}
    </section>
  );
}
