import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { agendaConfig, type Busy } from "./agenda";
import { jobTitles } from "./constants";
import type { AgendaConfig, Interview, JobRef } from "@/lib/types";

export interface BookingContext {
  cfg: AgendaConfig;
  /** Horários ocupados (só início e fim, sem dados de ninguém) */
  busy: Busy[];
  app: { id: string; candidate_id: string; job_title: string; jobs: string[]; stage: string } | null;
  firstName: string | null;
  /** Entrevista futura já marcada para esta candidatura */
  upcoming: Pick<Interview, "id" | "starts_at" | "ends_at" | "location"> | null;
}

/** Tudo o que a página e a API de agendamento precisam saber (lido com a chave do servidor). */
export async function bookingContext(db: SupabaseClient, token?: string | null): Promise<BookingContext> {
  const nowIso = new Date().toISOString();
  const [{ data: settings }, { data: busyRows }] = await Promise.all([
    db.from("site_settings").select("agenda_config").limit(1).maybeSingle(),
    db.from("interviews").select("starts_at, ends_at").eq("status", "agendada").gte("ends_at", nowIso),
  ]);
  const ctx: BookingContext = {
    cfg: agendaConfig(settings?.agenda_config),
    busy: (busyRows as Busy[]) ?? [],
    app: null,
    firstName: null,
    upcoming: null,
  };
  if (!token || !/^[0-9a-f]{32}$/.test(token)) return ctx;

  const { data: app } = await db
    .from("applications")
    .select("id, candidate_id, job_id, job_title, jobs, stage, status, candidates(full_name)")
    .eq("booking_token", token)
    .maybeSingle();
  // Processo finalizado (contratado ou reprovado): o link deixa de valer
  if (!app || app.status !== "em_processo") return ctx;
  const cand = app.candidates as unknown as { full_name: string } | null;
  ctx.app = { id: app.id, candidate_id: app.candidate_id, job_title: app.job_title, jobs: jobTitles({ jobs: app.jobs as JobRef[], job_id: app.job_id, job_title: app.job_title }), stage: app.stage };
  ctx.firstName = cand?.full_name.split(" ")[0] ?? null;
  const { data: upcoming } = await db
    .from("interviews")
    .select("id, starts_at, ends_at, location")
    .eq("application_id", app.id)
    .eq("status", "agendada")
    .gte("starts_at", nowIso)
    .order("starts_at")
    .limit(1)
    .maybeSingle();
  ctx.upcoming = upcoming ?? null;
  return ctx;
}
