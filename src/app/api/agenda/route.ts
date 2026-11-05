import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient, HAS_SERVICE_ROLE } from "@/lib/supabase/service";
import { bookingContext } from "@/lib/rh/booking";
import { isOfferedSlot } from "@/lib/rh/agenda";
import { formatDateTime } from "@/lib/rh/format";
import { formatWhatsapp, onlyDigits } from "@/lib/rh/validate";
import type { Job } from "@/lib/types";

export const runtime = "nodejs";

const EARLY_STAGES = ["novo", "visto", "avaliado_ia", "convite"];

const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 10;
}

const fail = (message: string, status = 400) => NextResponse.json({ ok: false, message }, { status });

/**
 * Agendamento de entrevista pelo link.
 *  - Com token (link pessoal): marca, remarca ou cancela a entrevista daquela candidatura.
 *  - Sem token (link geral): a pessoa informa nome e WhatsApp; se já for candidata, a entrevista
 *    entra na candidatura dela; se não, criamos o cadastro.
 */
export async function POST(req: NextRequest) {
  if (!HAS_SERVICE_ROLE) return fail("O agendamento ainda não está disponível.", 503);
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (rateLimited(ip)) return fail("Muitas tentativas. Tente de novo em alguns minutos.", 429);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return fail("Pedido inválido.");
  const token = typeof body.token === "string" ? body.token : null;
  const db = createServiceClient();
  const ctx = await bookingContext(db, token);
  if (token && !ctx.app) return fail("Este link de agendamento não é válido. Fale com o RH do CPPEM.", 404);

  const log = (applicationId: string, detail: string) =>
    db.from("application_events").insert({ application_id: applicationId, kind: "entrevista", actor: "candidato", detail });

  if (body.action === "cancel") {
    if (!ctx.app || !ctx.upcoming) return fail("Não há entrevista marcada para cancelar.");
    await db.from("interviews").update({ status: "cancelada" }).eq("id", ctx.upcoming.id);
    await log(ctx.app.id, `Entrevista de ${formatDateTime(ctx.upcoming.starts_at)} cancelada pelo candidato`);
    return NextResponse.json({ ok: true, cancelled: true });
  }

  // O horário precisa ser um dos oferecidos e estar livre agora
  const start = typeof body.start === "string" ? body.start : "";
  const busy = ctx.upcoming ? ctx.busy.filter((b) => b.starts_at !== ctx.upcoming!.starts_at) : ctx.busy;
  const slot = start ? isOfferedSlot(ctx.cfg, start, busy) : null;
  if (!slot) return fail("Esse horário não está mais disponível. Escolha outro.", 409);

  let candidateId: string;
  let applicationId: string | null;
  let stage: string | null;
  // Cadastro criado agora: se o horário não der certo, é apagado (não fica lixo)
  let createdNow = false;

  if (ctx.app) {
    candidateId = ctx.app.candidate_id;
    applicationId = ctx.app.id;
    stage = ctx.app.stage;
  } else {
    const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
    let digits = onlyDigits(typeof body.whatsapp === "string" ? body.whatsapp : "");
    if (digits.length > 11 && digits.startsWith("55")) digits = digits.slice(2);
    if (name.split(" ").length < 2 || name.length > 120) return fail("Escreva seu nome completo.");
    if (digits.length < 10 || digits.length > 11) return fail("Informe o WhatsApp com DDD.");
    if (body.consent !== true) return fail("É preciso concordar com a Política de Privacidade.");
    const jobId = typeof body.jobId === "string" && /^[0-9a-f-]{36}$/i.test(body.jobId) ? body.jobId : null;
    const { data: job } = jobId ? await db.from("jobs").select("id, title, category").eq("id", jobId).eq("status", "aberta").maybeSingle() : { data: null };

    const { data: found } = await db.from("candidates").select("id").in("whatsapp_digits", [digits, `55${digits}`]).order("created_at", { ascending: false }).limit(1);
    if (found?.length) {
      candidateId = found[0].id;
    } else {
      const { data, error } = await db
        .from("candidates")
        .insert({ full_name: name, whatsapp: formatWhatsapp(digits), origin: "agenda", consent_at: new Date().toISOString() })
        .select("id")
        .single();
      if (error) return fail("Não foi possível agendar agora. Tente de novo.", 500);
      candidateId = data.id;
      createdNow = true;
    }

    // Candidatura: a da vaga escolhida, a mais recente da pessoa ou uma nova
    const { data: apps } = await db.from("applications").select("id, job_id, stage").eq("candidate_id", candidateId).order("created_at", { ascending: false });
    let target = (job && apps?.find((a) => a.job_id === job.id)) || (!job ? apps?.[0] : undefined);
    if (!target && job) {
      const j = job as Pick<Job, "id" | "title" | "category">;
      const { data } = await db
        .from("applications")
        .insert({ candidate_id: candidateId, job_id: j.id, job_title: j.title, pipeline: j.category, ai_status: "sem_ia" })
        .select("id, job_id, stage")
        .single();
      target = data ?? undefined;
    }
    applicationId = target?.id ?? null;
    stage = target?.stage ?? null;

    // Já tinha entrevista marcada? Remarca em vez de duplicar.
    if (applicationId) {
      const { data: up } = await db
        .from("interviews")
        .select("id, starts_at")
        .eq("application_id", applicationId)
        .eq("status", "agendada")
        .gte("starts_at", new Date().toISOString())
        .limit(1)
        .maybeSingle();
      if (up) ctx.upcoming = { id: up.id, starts_at: up.starts_at, ends_at: up.starts_at, location: null };
    }
  }

  const { error } = await db.rpc("book_interview", {
    p_candidate_id: candidateId,
    p_application_id: applicationId,
    p_starts_at: slot.start,
    p_ends_at: slot.end,
    p_location: ctx.cfg.location,
    p_replace_id: ctx.upcoming?.id ?? null,
  });
  if (error) {
    if (createdNow) await db.from("candidates").delete().eq("id", candidateId);
    if (/horario_indisponivel/.test(error.message)) return fail("Alguém acabou de escolher esse horário. Escolha outro.", 409);
    console.error("Erro ao agendar:", error);
    return fail("Não foi possível agendar agora. Tente de novo.", 500);
  }

  if (applicationId) {
    if (stage && EARLY_STAGES.includes(stage)) await db.from("applications").update({ stage: "entrevista", rejection_reason: null }).eq("id", applicationId);
    await log(
      applicationId,
      ctx.upcoming
        ? `Entrevista remarcada pelo candidato para ${formatDateTime(slot.start)}`
        : `Entrevista agendada pelo candidato para ${formatDateTime(slot.start)}`
    );
  }

  return NextResponse.json({ ok: true, start: slot.start, end: slot.end, location: ctx.cfg.location, instructions: ctx.cfg.instructions });
}
