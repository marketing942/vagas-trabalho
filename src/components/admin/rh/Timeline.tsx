"use client";

import { STATUS, stageLabel } from "@/lib/rh/constants";
import { formatDateTime } from "@/lib/rh/format";
import type { ApplicationEvent, Pipeline } from "@/lib/types";

const ACTOR: Record<ApplicationEvent["actor"], string> = {
  admin: "Equipe",
  sistema: "Sistema",
  candidato: "Candidato(a)",
  ia: "IA",
};

/** Histórico da candidatura (mais recente primeiro). */
export default function Timeline({ events, pipeline }: { events: ApplicationEvent[]; pipeline: Pipeline }) {
  // Registros antigos podem ter "contratado/reprovado" como etapa: mostra o nome certo
  const label = (v: string | null) => (v && v in STATUS ? STATUS[v as keyof typeof STATUS].label : stageLabel(pipeline, v ?? ""));
  const text = (e: ApplicationEvent) => {
    switch (e.kind) {
      case "etapa":
        return `Etapa: ${label(e.from_stage)} → ${label(e.to_stage)}${e.detail ? ` (${e.detail})` : ""}`;
      case "status":
        return e.to_stage === "em_processo"
          ? `Processo reaberto (estava ${label(e.from_stage).toLowerCase()})`
          : `Resultado: ${label(e.to_stage)}${e.detail ? ` · motivo: ${e.detail}` : ""}`;
      case "avaliacao_ia":
        return `Avaliação da IA: ${e.detail ?? ""}`;
      case "nota":
        return e.detail ? `Anotação: ${e.detail}` : "Anotação salva";
      default:
        return e.detail ?? e.kind;
    }
  };
  return (
    <section className="card p-5" aria-labelledby="historico">
      <h3 id="historico" className="font-bold text-brand-950">
        Histórico
      </h3>
      {events.length === 0 ? (
        <p className="mt-3 text-sm text-brand-500">Sem registros.</p>
      ) : (
        <ol className="mt-4 space-y-4 border-l-2 border-brand-100 pl-4">
          {events.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[23px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-brand-400" aria-hidden />
              <p className="text-sm text-brand-900">{text(e)}</p>
              <p className="text-xs text-brand-500">
                {ACTOR[e.actor] ?? e.actor} · {formatDateTime(e.created_at)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
