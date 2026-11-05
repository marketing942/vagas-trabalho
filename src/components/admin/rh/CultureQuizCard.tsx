"use client";

import { MANDAMENTOS } from "@/lib/cultura";
import { CULTURE_QUIZ, cultureBand } from "@/lib/rh/culture-quiz";
import { formatDateTime } from "@/lib/rh/format";
import type { Application } from "@/lib/types";

/** Resultado do questionário de cultura na ficha (ou o convite para responder). */
export default function CultureQuizCard({
  app,
  onSend,
  onCopy,
}: {
  app: Pick<Application, "id" | "culture_quiz" | "status">;
  onSend: () => void;
  onCopy: () => void;
}) {
  const r = app.culture_quiz;
  return (
    <section className="card p-5" aria-labelledby={`cq-${app.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id={`cq-${app.id}`} className="font-bold text-brand-950">
            Questionário de cultura
          </h3>
          <p className="mt-0.5 text-sm text-brand-500">10 situações do dia a dia, uma para cada mandamento. Não é teste psicológico.</p>
        </div>
        {r && (
          <span className="text-right">
            <span className="block text-3xl font-black tabular-nums text-brand-950">{r.score}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${cultureBand(r.score).tone}`}>{cultureBand(r.score).label}</span>
          </span>
        )}
      </div>

      {!r ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-50/60 p-3">
          <p className="text-sm text-brand-600">Ainda não respondeu. O link é pessoal e leva uns 5 minutos.</p>
          {app.status === "em_processo" && (
            <span className="flex gap-2">
              <button type="button" onClick={onSend} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                Enviar pelo WhatsApp
              </button>
              <button type="button" onClick={onCopy} className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                Copiar link
              </button>
            </span>
          )}
        </div>
      ) : (
        <>
          <ul className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {MANDAMENTOS.map((m, i) => {
              const pts = r.by_mandamento[String(i)] ?? 0;
              return (
                <li key={m} title={m}>
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="truncate text-brand-800">
                      {i + 1}. {m}
                    </span>
                    <span className="shrink-0 font-bold tabular-nums text-brand-950">{pts}/3</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-brand-100" aria-hidden>
                    <div className={`h-full rounded-full ${pts >= 3 ? "bg-emerald-500" : pts === 2 ? "bg-sky-500" : pts === 1 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${(pts / 3) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-[13px] font-medium text-brand-500 hover:text-brand-900">Ver as respostas</summary>
            <ol className="mt-2 space-y-2.5">
              {CULTURE_QUIZ.map((q, i) => (
                <li key={q.id} className="rounded-xl border border-brand-100 p-3">
                  <p className="text-xs text-brand-500">
                    {i + 1}. {q.situation}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-900">
                    {q.options[r.answers[q.id]] ?? "—"} <span className="font-normal text-brand-500">({r.by_mandamento[String(q.mandamento)] ?? 0}/3)</span>
                  </p>
                </li>
              ))}
            </ol>
          </details>
          <p className="mt-3 text-xs text-brand-500">
            Respondido em {formatDateTime(r.submitted_at)}. Mostra como a pessoa diz que agiria; confirme na entrevista.
          </p>
        </>
      )}
    </section>
  );
}
