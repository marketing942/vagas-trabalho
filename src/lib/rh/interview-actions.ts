import type { SupabaseClient } from "@supabase/supabase-js";
import { formatDateTime } from "./format";
import type { Interview, InterviewStatus } from "@/lib/types";

export const INTERVIEW_STATUS: Record<InterviewStatus, { label: string; tone: string }> = {
  agendada: { label: "Agendada", tone: "bg-violet-100 text-violet-800" },
  realizada: { label: "Realizada", tone: "bg-emerald-100 text-emerald-800" },
  faltou: { label: "Não compareceu", tone: "bg-rose-100 text-rose-800" },
  cancelada: { label: "Cancelada", tone: "bg-brand-100 text-brand-600" },
};

const BEFORE_INTERVIEW_DONE = ["novo", "visto", "avaliado_ia", "convite", "entrevista"];

/** Registra o resultado da entrevista (admin), avança a etapa quando realizada e anota no histórico. */
export async function setInterviewStatus(db: SupabaseClient, interview: Pick<Interview, "id" | "application_id" | "starts_at">, status: InterviewStatus) {
  const { error } = await db.from("interviews").update({ status }).eq("id", interview.id);
  if (error || !interview.application_id) return !error;
  if (status === "realizada") {
    await db.from("applications").update({ stage: "entrevistado" }).eq("id", interview.application_id).in("stage", BEFORE_INTERVIEW_DONE);
  }
  await db.from("application_events").insert({
    application_id: interview.application_id,
    kind: "entrevista",
    actor: "admin",
    detail: `Entrevista de ${formatDateTime(interview.starts_at)}: ${INTERVIEW_STATUS[status].label.toLowerCase()}`,
  });
  return true;
}
