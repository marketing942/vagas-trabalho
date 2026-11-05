"use client";

import { createClient } from "@/lib/supabase/client";
import { formatLongDay, formatTime } from "@/lib/rh/format";
import { INTERVIEW_STATUS as STATUS, setInterviewStatus } from "@/lib/rh/interview-actions";
import type { Application, Candidate, Interview, InterviewStatus } from "@/lib/types";

/** Entrevistas da candidatura e o resultado de cada uma (marcar é pelo botão do topo da ficha). */
export default function InterviewsBox({
  candidate,
  app,
  interviews,
  onChanged,
  onReject,
}: {
  candidate: Candidate;
  app: Application;
  interviews: Interview[];
  onChanged: () => void;
  onReject: () => void;
}) {
  const mine = interviews.filter((i) => i.application_id === app.id || (!i.application_id && i.candidate_id === candidate.id));

  async function setStatus(i: Interview, status: InterviewStatus) {
    await setInterviewStatus(createClient(), i, status);
    onChanged();
  }

  const small = "rounded-lg border px-2.5 py-1 text-xs font-semibold";
  return (
    <section className="card p-5" aria-labelledby={`ent-${app.id}`}>
      <h3 id={`ent-${app.id}`} className="font-bold text-brand-950">
        Entrevistas
      </h3>
      {mine.length === 0 ? (
        <p className="mt-2 text-sm text-brand-500">Nenhuma ainda. Use “Agendar entrevista” ou envie o convite pelo WhatsApp, no topo da ficha.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {mine.map((i) => (
            <li key={i.id} className="rounded-2xl border border-brand-100 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-900">
                    {formatLongDay(i.starts_at)}, {formatTime(i.starts_at)}
                  </p>
                  <p className="text-xs text-brand-500">{i.created_via === "link" ? "Escolhido pelo candidato" : "Marcado pela equipe"}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS[i.status].tone}`}>{STATUS[i.status].label}</span>
              </div>
              {i.status === "agendada" && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => setStatus(i, "realizada")} className={`${small} border-emerald-200 text-emerald-700 hover:bg-emerald-50`}>
                    Realizada
                  </button>
                  <button type="button" onClick={() => setStatus(i, "faltou")} className={`${small} border-rose-200 text-rose-700 hover:bg-rose-50`}>
                    Não compareceu
                  </button>
                  <button type="button" onClick={() => setStatus(i, "cancelada")} className={`${small} border-brand-200 text-brand-600 hover:bg-brand-50`}>
                    Cancelar
                  </button>
                </div>
              )}
              {i.status === "faltou" && app.status === "em_processo" && (
                <button type="button" onClick={onReject} className="mt-2 text-xs font-semibold text-rose-700 underline">
                  Reprovar por não comparecimento
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
