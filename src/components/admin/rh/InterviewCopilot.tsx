"use client";

import { useState } from "react";
import { INTERVIEW_CRITERIA, type InterviewCriterionKey } from "@/lib/rh/constants";
import { formatDateTime } from "@/lib/rh/format";
import type { Application } from "@/lib/types";

/**
 * Copiloto da entrevista: a IA lê o roteiro respondido e sugere resumo e notas com evidências.
 * Nada muda sozinho: a equipe escolhe se usa as notas sugeridas.
 */
export default function InterviewCopilot({
  app,
  onApply,
  onAnalyzed,
}: {
  app: Pick<Application, "id" | "interview_ai" | "interview_answers">;
  onApply: (scores: Record<InterviewCriterionKey, number | null>) => Promise<boolean>;
  onAnalyzed: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const a = app.interview_ai;
  const answered = (app.interview_answers?.sections ?? []).reduce((n, s) => n + s.questions.filter((q) => q.answer?.trim()).length, 0);

  async function analyze() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/copiloto", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ applicationId: app.id }) });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!out.ok) return setError(out.error ?? "Não foi possível analisar agora.");
    onAnalyzed();
  }

  async function apply() {
    if (!a) return;
    if (!confirm("Preencher o scorecard com as notas sugeridas pela IA? Você pode ajustar depois.")) return;
    const scores = Object.fromEntries(INTERVIEW_CRITERIA.map((c) => [c.key, a.notas[c.key]?.nota ?? null])) as Record<InterviewCriterionKey, number | null>;
    await onApply(scores);
  }

  return (
    <section className="card border-sky-100 p-5" aria-labelledby={`cop-${app.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id={`cop-${app.id}`} className="font-bold text-brand-950">
            Copiloto da IA
          </h3>
          <p className="mt-0.5 text-sm text-brand-500">Resumo da entrevista e sugestão de notas com evidências. A decisão é da equipe.</p>
        </div>
        <button
          type="button"
          disabled={busy || answered < 3}
          onClick={analyze}
          title={answered < 3 ? "Preencha e salve pelo menos 3 respostas do roteiro" : undefined}
          className="rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Analisando..." : a ? "Analisar de novo" : "Analisar entrevista com IA"}
        </button>
      </div>

      {error && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {!a ? (
        <p className="mt-3 rounded-lg bg-brand-50/60 p-3 text-sm text-brand-600">
          {answered < 3 ? `Preencha e salve o roteiro (${answered} de pelo menos 3 respostas) para pedir a análise.` : "Pronto para analisar."}
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="text-sm leading-relaxed text-brand-800">{a.resumo}</p>
          <ul className="divide-y divide-brand-50 rounded-lg border border-stone-200">
            {INTERVIEW_CRITERIA.map((c) => {
              const n = a.notas[c.key];
              return (
                <li key={c.key} className="flex gap-3 p-3">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-bold tabular-nums ${n?.nota == null ? "bg-brand-50 text-brand-400" : "bg-sky-100 text-sky-900"}`}>
                    {n?.nota ?? "–"}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-brand-950">{c.label}</span>
                    <span className="block text-xs leading-relaxed text-brand-600">{n?.evidencia || "Sem evidência."}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          {a.pontos_confirmar.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-amber-700">Vale confirmar</h4>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-brand-800">
                {a.pontos_confirmar.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-3">
            <span className="text-xs text-brand-500">
              Sugestão da IA ({a.model}) em {formatDateTime(a.created_at)}
            </span>
            <button type="button" onClick={apply} className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
              Usar notas sugeridas no scorecard
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
