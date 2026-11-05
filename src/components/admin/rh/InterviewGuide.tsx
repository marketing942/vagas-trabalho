"use client";

import { useState } from "react";
import { cleanScript } from "@/lib/rh/rh-settings";
import type { Application, InterviewScript } from "@/lib/types";

const fresh = (s: InterviewScript): InterviewScript => ({
  sections: s.sections.map((sec) => ({ title: sec.title, questions: sec.questions.map((q) => ({ q: q.q, hint: q.hint ?? "", answer: "" })) })),
});

/**
 * Roteiro da entrevista desta candidatura: começa com o roteiro padrão (Configurações → RH)
 * e pode ser ajustado para cada pessoa — mudar, tirar ou incluir perguntas conforme a conversa.
 */
export default function InterviewGuide({
  app,
  standard,
  onSave,
}: {
  app: Pick<Application, "id" | "interview_answers" | "ai_report">;
  standard: InterviewScript;
  onSave: (script: InterviewScript) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<InterviewScript>(() => (app.interview_answers ? cleanScript(app.interview_answers) : fresh(standard)));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (fn: (s: InterviewScript) => void) => {
    const next = structuredClone(draft);
    fn(next);
    setDraft(next);
    setDirty(true);
    setSaved(false);
  };

  const total = draft.sections.reduce((n, s) => n + s.questions.length, 0);
  const answered = draft.sections.reduce((n, s) => n + s.questions.filter((q) => q.answer?.trim()).length, 0);
  const aiQuestions = (app.ai_report?.perguntas_entrevista ?? []).filter(
    (q) => !draft.sections.some((s) => s.questions.some((x) => x.q.trim() === q.trim()))
  );

  async function save() {
    setSaving(true);
    const ok = await onSave(draft);
    setSaving(false);
    if (ok) {
      setDirty(false);
      setSaved(true);
    }
  }

  const input = "w-full rounded-lg border border-transparent bg-transparent px-2 py-1 outline-none hover:border-brand-100 focus:border-accent-500 focus:bg-white";

  return (
    <section className="card p-5" aria-labelledby="roteiro">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="roteiro" className="font-bold text-brand-950">
            Roteiro da entrevista
          </h3>
          <p className="mt-0.5 text-sm text-brand-500">Clique numa pergunta para mudar o texto. As mudanças valem só para esta pessoa.</p>
        </div>
        <div className="w-40 text-right">
          <p className="text-xs font-semibold text-brand-600">
            {answered} de {total} respondidas
          </p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-brand-100" aria-hidden>
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${total ? (answered / total) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-6">
        {draft.sections.map((sec, si) => (
          <div key={si}>
            <div className="flex items-center gap-2 border-b border-brand-100 pb-1.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-900 text-xs font-bold text-white">{si + 1}</span>
              <input
                aria-label={`Título da parte ${si + 1}`}
                value={sec.title}
                onChange={(e) => update((d) => void (d.sections[si].title = e.target.value))}
                className={`${input} font-bold text-brand-950`}
              />
              <button
                type="button"
                onClick={() => confirm(`Tirar a parte "${sec.title}" do roteiro desta pessoa?`) && update((d) => void d.sections.splice(si, 1))}
                className="shrink-0 rounded-lg px-2 py-1 text-xs text-brand-400 hover:bg-rose-50 hover:text-rose-700"
              >
                Remover parte
              </button>
            </div>
            <ol className="mt-3 space-y-4">
              {sec.questions.map((q, qi) => (
                <li key={qi} className="group rounded-2xl border border-brand-100 bg-brand-50/40 p-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 w-6 shrink-0 text-xs font-bold tabular-nums text-brand-400">
                      {si + 1}.{qi + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <input
                        aria-label={`Pergunta ${si + 1}.${qi + 1}`}
                        value={q.q}
                        placeholder="Escreva a pergunta"
                        onChange={(e) => update((d) => void (d.sections[si].questions[qi].q = e.target.value))}
                        className={`${input} font-semibold text-brand-950`}
                      />
                      <input
                        aria-label={`O que a pergunta ${si + 1}.${qi + 1} avalia`}
                        value={q.hint ?? ""}
                        placeholder="O que esta pergunta avalia (opcional)"
                        onChange={(e) => update((d) => void (d.sections[si].questions[qi].hint = e.target.value))}
                        className={`${input} text-xs italic text-brand-500`}
                      />
                      <textarea
                        aria-label={`Resposta da pergunta ${si + 1}.${qi + 1}`}
                        rows={2}
                        value={q.answer ?? ""}
                        placeholder="Resposta do candidato"
                        onChange={(e) => update((d) => void (d.sections[si].questions[qi].answer = e.target.value))}
                        className="input mt-1.5 !bg-white text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      aria-label={`Remover pergunta ${si + 1}.${qi + 1}`}
                      onClick={() => update((d) => void d.sections[si].questions.splice(qi, 1))}
                      className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-brand-300 hover:bg-rose-50 hover:text-rose-700"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => update((d) => void d.sections[si].questions.push({ q: "", hint: "", answer: "" }))}
              className="mt-2 rounded-lg px-2 py-1 text-sm font-semibold text-brand-600 hover:bg-brand-50"
            >
              + Adicionar pergunta
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-brand-100 pt-4">
        <button
          type="button"
          onClick={() => update((d) => void d.sections.push({ title: "Outras perguntas", questions: [{ q: "", hint: "", answer: "" }] }))}
          className="rounded-xl border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
        >
          + Nova parte
        </button>
        {aiQuestions.length > 0 && (
          <button
            type="button"
            onClick={() => update((d) => void d.sections.push({ title: "Sugeridas pela IA", questions: aiQuestions.map((q) => ({ q, hint: "Sugestão da IA para este perfil", answer: "" })) }))}
            className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100"
          >
            + Perguntas sugeridas pela IA ({aiQuestions.length})
          </button>
        )}
        <button
          type="button"
          onClick={() => confirm("Voltar ao roteiro padrão? As perguntas e respostas desta pessoa serão apagadas (só depois de salvar).") && (setDraft(fresh(standard)), setDirty(true), setSaved(false))}
          className="rounded-xl px-3 py-2 text-sm font-semibold text-brand-500 hover:bg-brand-50"
        >
          Restaurar roteiro padrão
        </button>
        <span className="ml-auto text-sm text-brand-500" aria-live="polite">
          {dirty ? "Alterações não salvas" : saved ? "Roteiro salvo ✓" : ""}
        </span>
        <button type="button" disabled={!dirty || saving} onClick={save} className="rounded-xl bg-brand-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? "Salvando..." : "Salvar roteiro"}
        </button>
      </div>
    </section>
  );
}
