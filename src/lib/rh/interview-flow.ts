import type { SupabaseClient } from "@supabase/supabase-js";
import type { Application, Stage } from "@/lib/types";

/** Avança a etapa só para frente (não tira ninguém de etapas mais adiantadas). */
export async function advanceStage(db: SupabaseClient, app: Pick<Application, "id" | "stage">, to: Stage, from: Stage[]) {
  if (from.includes(app.stage)) await db.from("applications").update({ stage: to }).eq("id", app.id);
}

export const logInterview = (db: SupabaseClient, applicationId: string, detail: string) =>
  db.from("application_events").insert({ application_id: applicationId, kind: "entrevista", actor: "admin", detail });
