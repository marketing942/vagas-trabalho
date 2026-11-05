"use client";

import { useState } from "react";
import { INTERVIEW_CRITERIA, type InterviewCriterionKey } from "@/lib/rh/constants";
import type { Application } from "@/lib/types";

type Scores = Record<InterviewCriterionKey, number | null>;

/** Scorecard da entrevista: 5 critérios de 0 a 10 e a média (mesma fórmula do Notion). */
export default function InterviewScorecard({
  app,
  onSave,
}: {
  app: Application;
  onSave: (scores: Scores) => Promise<boolean>;
}) {
  const initial = Object.fromEntries(INTERVIEW_CRITERIA.map((c) => [c.key, app[c.key]])) as Scores;
  const [scores, setScores] = useState<Scores>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const average = INTERVIEW_CRITERIA.reduce((sum, c) => sum + (scores[c.key] ?? 0), 0) / INTERVIEW_CRITERIA.length;
  const dirty = INTERVIEW_CRITERIA.some((c) => scores[c.key] !== initial[c.key]);

  return (
    <section className="card p-5" aria-labelledby={`sc-${app.id}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 id={`sc-${app.id}`} className="font-bold text-brand-950">
          Scorecard da entrevista
        </h3>
        <span className="rounded-lg bg-brand-900 px-2.5 py-1 text-sm font-bold tabular-nums text-white" title="Média dos 5 critérios">
          {average.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-5">
        {INTERVIEW_CRITERIA.map((c) => (
          <label key={c.key} className="block">
            <span className="text-xs font-semibold text-brand-700">{c.label}</span>
            <input
              type="number"
              min={0}
              max={10}
              step={1}
              inputMode="numeric"
              placeholder="0 a 10"
              value={scores[c.key] ?? ""}
              onChange={(e) => {
                setSaved(false);
                const v = e.target.value === "" ? null : Math.max(0, Math.min(10, Math.round(Number(e.target.value))));
                setScores((s) => ({ ...s, [c.key]: v }));
              }}
              className="input mt-1 !px-3 text-center tabular-nums"
            />
          </label>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={async () => {
            setSaving(true);
            setSaved(await onSave(scores));
            setSaving(false);
          }}
          className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar notas"}
        </button>
        {saved && !dirty && <span className="text-sm text-emerald-700">Notas salvas</span>}
      </div>
    </section>
  );
}
