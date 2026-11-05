import type { SupabaseClient } from "@supabase/supabase-js";
import { jobTitles } from "./constants";
import type { Application, Candidate, Stage } from "@/lib/types";

/** Avança a etapa só para frente (não tira ninguém de etapas mais adiantadas). */
export async function advanceStage(db: SupabaseClient, app: Pick<Application, "id" | "stage">, to: Stage, from: Stage[]) {
  if (from.includes(app.stage)) await db.from("applications").update({ stage: to }).eq("id", app.id);
}

export const logInterview = (db: SupabaseClient, applicationId: string, detail: string) =>
  db.from("application_events").insert({ application_id: applicationId, kind: "entrevista", actor: "admin", detail });

/** Mensagem do convite com o link pessoal de agendamento. */
export function inviteText(candidate: Pick<Candidate, "full_name">, app: Pick<Application, "jobs" | "job_id" | "job_title">, link: string) {
  const titles = jobTitles(app);
  const vagas = titles.length > 1 ? `as vagas ${titles.slice(0, -1).join(", ")} e ${titles[titles.length - 1]}` : `a vaga ${titles[0]}`;
  return `Olá, ${candidate.full_name.split(" ")[0]}! Aqui é do RH do CPPEM. Gostamos do seu perfil para ${vagas} e queremos conhecer você. Escolha o melhor dia e horário para a sua entrevista neste link: ${link}`;
}
