import { after, NextResponse, type NextRequest } from "next/server";
import { createServiceClient, HAS_SERVICE_ROLE } from "@/lib/supabase/service";
import { evaluateApplication, HAS_AI } from "@/lib/rh/ai";
import { jobsOf, TALENT_POOL } from "@/lib/rh/constants";
import {
  formatWhatsapp,
  onlyDigits,
  resumeSignatureOk,
  validateFields,
  validateResumeMeta,
  type ApplicationFields,
} from "@/lib/rh/validate";
import { slugify } from "@/lib/slug";
import type { Application, Job, JobRef, Pipeline } from "@/lib/types";

export const runtime = "nodejs";
// A avaliação por IA roda depois da resposta, dentro desta mesma função.
export const maxDuration = 300;

/** Limite simples contra envio em massa: 6 candidaturas válidas a cada 10 minutos por IP. */
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 6;
}

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

export async function POST(req: NextRequest) {
  if (!HAS_SERVICE_ROLE) {
    return NextResponse.json({ ok: false, message: "As candidaturas pelo site ainda não foram ativadas." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, message: "Envio inválido." }, { status: 400 });
  }

  // Robôs: o campo invisível só é preenchido por robô. Responde "ok" sem gravar nada.
  if (str(form.get("empresa"))) {
    return NextResponse.json({ ok: true, vagas: [], nome: "" });
  }
  // Envio rápido demais (menos de 3 s desde que a página abriu): pede para enviar de novo,
  // em vez de descartar, para não perder a candidatura de quem usa preenchimento automático.
  const startedAt = Number(str(form.get("inicio")));
  if (startedAt && Date.now() - startedAt < 3000) {
    return NextResponse.json({ ok: false, message: "Confira os seus dados e clique em Enviar candidatura de novo." }, { status: 400 });
  }

  const fields: ApplicationFields = {
    vagas: form.getAll("vagas").map(String).slice(0, 20),
    nome: str(form.get("nome")),
    email: str(form.get("email")),
    whatsapp: str(form.get("whatsapp")),
    social: str(form.get("social")),
    idade: str(form.get("idade")),
    cidade: str(form.get("cidade")),
    sobre: str(form.get("sobre")),
    origem: form.getAll("origem").map(String),
    consentimento: str(form.get("consentimento")) === "sim",
  };
  const errors = validateFields(fields);

  const file = form.get("curriculo");
  const resume = file instanceof File && file.size > 0 ? file : null;
  let resumeBytes: Uint8Array | null = null;
  if (resume) {
    const metaError = validateResumeMeta(resume.size, resume.type);
    if (metaError) errors.curriculo = metaError;
    else {
      resumeBytes = new Uint8Array(await resume.arrayBuffer());
      if (!resumeSignatureOk(resumeBytes, resume.type)) errors.curriculo = "Não conseguimos abrir este arquivo. Envie um PDF, Word ou imagem válidos.";
    }
  }

  const db = createServiceClient();

  // Só aceita vagas abertas de verdade
  const wantsPool = fields.vagas.includes("banco");
  const jobIds = fields.vagas.filter((v) => /^[0-9a-f-]{36}$/i.test(v));
  let jobs: Job[] = [];
  if (jobIds.length) {
    const { data } = await db.from("jobs").select("*").in("id", jobIds).eq("status", "aberta");
    jobs = (data as Job[]) ?? [];
  }
  if (!errors.vagas && jobs.length + (wantsPool ? 1 : 0) === 0) errors.vagas = "Essa vaga não está mais aberta. Escolha outra.";

  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors, message: "Confira os campos destacados." }, { status: 400 });
  }

  // Conta só envios válidos: quem está corrigindo um campo não é bloqueado
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, message: "Muitos envios em pouco tempo. Tente de novo em alguns minutos." }, { status: 429 });
  }

  try {
    // Mesma pessoa (mesmo WhatsApp ou e-mail): atualiza o cadastro em vez de duplicar
    let digits = onlyDigits(fields.whatsapp);
    if (digits.length > 11 && digits.startsWith("55")) digits = digits.slice(2);
    const email = fields.email.trim().toLowerCase();
    const lookup = (column: string, values: string[]) =>
      db.from("candidates").select("id, resume_path, sources").in(column, values).order("created_at", { ascending: false }).limit(1);
    const byPhone = await lookup("whatsapp_digits", [digits, `55${digits}`]);
    const found = byPhone.data?.length ? byPhone.data : (await lookup("email", [email])).data;
    const existing = found?.[0] as { id: string; resume_path: string | null; sources: string[] } | undefined;

    const profile = {
      full_name: fields.nome.trim().replace(/\s+/g, " "),
      email,
      whatsapp: formatWhatsapp(digits),
      social_url: fields.social.trim(),
      age_range: fields.idade,
      city: fields.cidade.trim(),
      about: fields.sobre.trim(),
      sources: Array.from(new Set([...(existing?.sources ?? []), ...fields.origem])),
      consent_at: new Date().toISOString(),
    };

    let candidateId: string;
    if (existing) {
      candidateId = existing.id;
      const { error } = await db.from("candidates").update(profile).eq("id", candidateId);
      if (error) throw error;
    } else {
      const { data, error } = await db.from("candidates").insert({ ...profile, origin: "site" }).select("id").single();
      if (error) throw error;
      candidateId = data.id;
    }

    if (resume && resumeBytes) {
      const ext = (resume.name.split(".").pop() ?? "pdf").toLowerCase().slice(0, 5);
      const path = `${candidateId}/${Date.now()}-${slugify(resume.name.replace(/\.[^.]+$/, "")).slice(0, 60) || "curriculo"}.${ext}`;
      const { error } = await db.storage.from("curriculos").upload(path, resumeBytes, { contentType: resume.type, upsert: false });
      if (error) throw error;
      await db.from("candidates").update({ resume_path: path, resume_name: resume.name.slice(0, 200) }).eq("id", candidateId);
      if (existing?.resume_path) await db.storage.from("curriculos").remove([existing.resume_path]);
    }

    // Um card por pessoa e funil, com todas as vagas escolhidas nele.
    // Se a pessoa já tem um card em aberto no funil, as vagas novas entram nesse card.
    const { data: settings } = await db.from("site_settings").select("ai_auto_evaluate").limit(1).maybeSingle();
    // Avaliação ligada: fica "pendente" mesmo sem a chave da IA, para ser avaliada quando ela for configurada
    const wantAi = settings?.ai_auto_evaluate ?? true;
    const autoAi = wantAi && HAS_AI;

    const chosen: { pipeline: Pipeline; ref: JobRef }[] = [
      ...jobs.map((j) => ({ pipeline: j.category, ref: { id: j.id, title: j.title } })),
      ...(wantsPool ? [{ pipeline: "trabalho" as const, ref: { id: null, title: TALENT_POOL } }] : []),
    ];
    const sameJob = (a: JobRef, b: JobRef) => (a.id && b.id ? a.id === b.id : a.title === b.title);
    const { data: openApps } = await db.from("applications").select("id, pipeline, stage, jobs, job_id, job_title").eq("candidate_id", candidateId).eq("status", "em_processo");

    const added: string[] = [];
    const repeated: string[] = [];
    const toEvaluate: string[] = [];
    for (const pipeline of ["trabalho", "professor"] as Pipeline[]) {
      const refs = chosen.filter((c) => c.pipeline === pipeline).map((c) => c.ref);
      if (!refs.length) continue;
      const current = (openApps ?? []).find((a) => a.pipeline === pipeline) as (Pick<Application, "id" | "stage" | "jobs" | "job_id" | "job_title"> & { pipeline: Pipeline }) | undefined;
      if (!current) {
        const { data, error } = await db
          .from("applications")
          .insert({ candidate_id: candidateId, pipeline, job_id: refs[0].id, job_title: refs[0].title, jobs: refs, ai_status: wantAi ? "pendente" : "sem_ia" })
          .select("id")
          .single();
        if (error) throw error;
        added.push(...refs.map((r) => r.title));
        toEvaluate.push(data.id);
        continue;
      }
      const have = jobsOf(current);
      const fresh = refs.filter((r) => !have.some((h) => sameJob(h, r)));
      repeated.push(...refs.filter((r) => have.some((h) => sameJob(h, r))).map((r) => r.title));
      if (!fresh.length) continue;
      // Ainda na triagem: a IA avalia de novo, agora com todas as vagas
      const reevaluate = wantAi && ["novo", "visto", "avaliado_ia"].includes(current.stage);
      const { error } = await db
        .from("applications")
        .update({ jobs: [...have, ...fresh], ...(reevaluate ? { ai_status: "pendente" } : {}) })
        .eq("id", current.id);
      if (error) throw error;
      await db.from("application_events").insert({
        application_id: current.id,
        kind: "edicao",
        actor: "candidato",
        detail: `Candidatou-se também a: ${fresh.map((r) => r.title).join(", ")}`,
      });
      added.push(...fresh.map((r) => r.title));
      if (reevaluate) toEvaluate.push(current.id);
    }

    if (autoAi && toEvaluate.length) {
      after(async () => {
        await Promise.all(toEvaluate.map((id) => evaluateApplication(db, id)));
      });
    }

    return NextResponse.json({
      ok: true,
      nome: profile.full_name.split(" ")[0],
      vagas: added,
      repetidas: repeated,
    });
  } catch (e) {
    console.error("Erro ao gravar candidatura:", e);
    return NextResponse.json(
      { ok: false, message: "Não conseguimos registrar sua candidatura agora. Tente de novo em alguns minutos." },
      { status: 500 }
    );
  }
}
