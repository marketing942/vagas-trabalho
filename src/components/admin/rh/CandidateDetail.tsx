"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { agendaConfig } from "@/lib/rh/agenda";
import { PIPELINE_LABEL, STAGES, stageDef, whatsappLink, type InterviewCriterionKey } from "@/lib/rh/constants";
import { formatDate, hireChance, since, socialHref } from "@/lib/rh/format";
import type { AgendaConfig, Application, ApplicationEvent, Candidate, Interview, Stage } from "@/lib/types";
import AiScorecard from "./AiScorecard";
import EditCandidateDialog from "./EditCandidateDialog";
import InterviewScorecard from "./InterviewScorecard";
import InterviewsBox from "./InterviewsBox";
import RejectDialog from "./RejectDialog";
import Timeline from "./Timeline";

const ORIGIN = { site: "Site", notion: "Importado do Notion", admin: "Cadastro manual", agenda: "Link de agendamento" } as const;

interface Data {
  candidate: Candidate;
  apps: Application[];
  events: ApplicationEvent[];
  interviews: Interview[];
  config: AgendaConfig;
}

/** Ficha completa do candidato. */
export default function CandidateDetail({ id, initialApp }: { id: string; initialApp?: string }) {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [missing, setMissing] = useState(false);
  const [selected, setSelected] = useState(initialApp ?? "");
  const [editing, setEditing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [flash, setFlash] = useState("");
  const [reload, setReload] = useState(0);

  const refresh = useCallback(() => setReload((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const db = createClient();
      const { data: candidate } = await db.from("candidates").select("*").eq("id", id).maybeSingle();
      if (!alive) return;
      if (!candidate) return setMissing(true);
      const { data: apps } = await db.from("applications").select("*").eq("candidate_id", id).order("created_at", { ascending: false });
      const ids = (apps ?? []).map((a) => a.id);
      const [{ data: events }, { data: interviews }, { data: settings }] = await Promise.all([
        ids.length
          ? db.from("application_events").select("*").in("application_id", ids).order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
        db.from("interviews").select("*").eq("candidate_id", id).order("starts_at", { ascending: false }),
        db.from("site_settings").select("agenda_config").limit(1).maybeSingle(),
      ]);
      if (!alive) return;
      setData({
        candidate: candidate as Candidate,
        apps: (apps as Application[]) ?? [],
        events: (events as ApplicationEvent[]) ?? [],
        interviews: (interviews as Interview[]) ?? [],
        config: agendaConfig(settings?.agenda_config),
      });
    })();
    return () => {
      alive = false;
    };
  }, [id, reload]);

  if (missing)
    return (
      <div className="card p-10 text-center">
        <p className="text-brand-600">Candidato não encontrado (pode ter sido excluído).</p>
        <Link href="/admin/candidatos" className="btn-secondary mt-4">
          Voltar ao pipeline
        </Link>
      </div>
    );
  if (!data) return <p className="text-brand-500">Carregando...</p>;

  const { candidate: c, apps, events, interviews, config } = data;
  const app = apps.find((a) => a.id === selected) ?? apps[0];
  const db = () => createClient();
  const say = (m: string) => {
    setFlash(m);
    setTimeout(() => setFlash(""), 2500);
  };

  async function changeStage(stage: Stage, reason?: string) {
    if (!app || stage === app.stage) return;
    if (stage === "reprovado" && !reason) return setRejecting(true);
    const { error } = await db()
      .from("applications")
      .update({ stage, rejection_reason: stage === "reprovado" ? reason : null })
      .eq("id", app.id);
    if (error) return say("Não foi possível mudar a etapa.");
    say("Etapa atualizada");
    refresh();
  }

  async function evaluate() {
    if (!app) return;
    setEvaluating(true);
    const res = await fetch("/api/admin/avaliar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ applicationId: app.id }) });
    const out = await res.json().catch(() => ({}));
    setEvaluating(false);
    if (!out.ok) say(out.error ?? "A avaliação falhou.");
    refresh();
  }

  async function openResume() {
    if (!c.resume_path) return;
    const { data: signed, error } = await db().storage.from("curriculos").createSignedUrl(c.resume_path, 300);
    if (error || !signed) return say("Não foi possível abrir o currículo.");
    window.open(signed.signedUrl, "_blank", "noopener");
  }

  async function remove() {
    if (!confirm(`Excluir ${c.full_name} e TODAS as candidaturas, notas, entrevistas e o currículo? Isso não pode ser desfeito.`)) return;
    if (c.resume_path) await db().storage.from("curriculos").remove([c.resume_path]);
    const { error } = await db().from("candidates").delete().eq("id", c.id);
    if (error) return say("Não foi possível excluir.");
    router.push("/admin/candidatos");
  }

  async function saveScores(scores: Record<InterviewCriterionKey, number | null>) {
    if (!app) return false;
    const { error } = await db().from("applications").update(scores).eq("id", app.id);
    if (error) {
      say("Não foi possível salvar as notas.");
      return false;
    }
    refresh();
    return true;
  }

  async function saveNotes() {
    if (!app || notes === null) return;
    const { error } = await db().from("applications").update({ notes }).eq("id", app.id);
    if (error) return say("Não foi possível salvar a anotação.");
    await db().from("application_events").insert({ application_id: app.id, kind: "nota", actor: "admin", detail: notes.slice(0, 280) || null });
    setNotes(null);
    say("Anotação salva");
    refresh();
  }

  const social = socialHref(c.social_url);
  const chance = app ? hireChance(app) : null;
  const appEvents = app ? events.filter((e) => e.application_id === app.id) : [];

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="card flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <Link href={app ? `/admin/candidatos${app.pipeline === "professor" ? "?funil=professor" : ""}` : "/admin/candidatos"} className="text-sm font-medium text-brand-500 hover:text-brand-800">
            ← Pipeline
          </Link>
          <h2 className="mt-1 text-2xl font-bold text-brand-950">{c.full_name}</h2>
          <p className="mt-1 text-sm text-brand-600">
            {ORIGIN[c.origin]} · cadastro em {formatDate(c.created_at)}
            {c.city ? ` · ${c.city}` : ""}
            {c.age_range ? ` · ${c.age_range}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={whatsappLink(c.whatsapp)} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            WhatsApp
          </a>
          {c.resume_path && (
            <button type="button" onClick={openResume} className="rounded-lg border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50">
              Ver currículo
            </button>
          )}
          <button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50">
            Editar dados
          </button>
          <button type="button" onClick={remove} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
            Excluir
          </button>
        </div>
      </div>

      {flash && (
        <p role="status" className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white">
          {flash}
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {/* Candidaturas (uma por vaga) */}
          {apps.length > 1 && (
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Candidaturas">
              {apps.map((a) => (
                <button
                  key={a.id}
                  role="tab"
                  aria-selected={a.id === app?.id}
                  onClick={() => {
                    setSelected(a.id);
                    setNotes(null);
                  }}
                  className={`rounded-xl border px-3 py-2 text-left text-sm ${a.id === app?.id ? "border-brand-900 bg-brand-900 text-white" : "border-brand-200 bg-white text-brand-800 hover:bg-brand-50"}`}
                >
                  <span className="block font-semibold">{a.job_title}</span>
                  <span className="text-xs opacity-80">{stageDef(a.pipeline, a.stage).label}</span>
                </button>
              ))}
            </div>
          )}

          {!app ? (
            <p className="card p-5 text-brand-600">Esta pessoa não tem candidaturas.</p>
          ) : (
            <>
              <section className="card p-5" aria-label="Etapa">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-500">
                      {PIPELINE_LABEL[app.pipeline]} · {app.job_title}
                    </p>
                    <label className="mt-2 block text-sm font-medium text-brand-800" htmlFor="etapa">
                      Etapa
                    </label>
                    <select id="etapa" value={app.stage} onChange={(e) => changeStage(e.target.value as Stage)} className="input mt-1 !w-72">
                      {STAGES[app.pipeline].map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-brand-500">
                      Nesta etapa {since(app.stage_changed_at)} · candidatura em {formatDate(app.created_at)}
                      {app.stage === "reprovado" && app.rejection_reason && <> · Motivo: {app.rejection_reason}</>}
                    </p>
                  </div>
                  {chance != null && (
                    <div className="text-right" title="Estimativa do sistema: combina a etapa atual, o score da IA e a nota da entrevista.">
                      <p className="text-xs font-bold uppercase tracking-wide text-brand-500">Chance de contratação</p>
                      <p className="text-3xl font-black tabular-nums text-brand-900">{chance}%</p>
                    </div>
                  )}
                </div>
              </section>

              <AiScorecard app={app} busy={evaluating} onEvaluate={evaluate} />
              <InterviewScorecard key={app.id} app={app} onSave={saveScores} />

              <section className="card p-5" aria-labelledby="notas">
                <h3 id="notas" className="font-bold text-brand-950">
                  Anotações
                </h3>
                <textarea
                  rows={4}
                  className="input mt-3"
                  placeholder="Impressões da entrevista, combinados, próximos passos..."
                  value={notes ?? app.notes ?? ""}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <button
                  type="button"
                  disabled={notes === null}
                  onClick={saveNotes}
                  className="mt-3 rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Salvar anotação
                </button>
              </section>
            </>
          )}
        </div>

        <div className="space-y-5">
          <section className="card p-5" aria-labelledby="perfil">
            <h3 id="perfil" className="font-bold text-brand-950">
              Perfil
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-xs text-brand-500">WhatsApp</dt>
                <dd className="font-medium text-brand-900">{c.whatsapp}</dd>
              </div>
              {c.email && (
                <div>
                  <dt className="text-xs text-brand-500">E-mail</dt>
                  <dd>
                    <a href={`mailto:${c.email}`} className="font-medium text-brand-900 underline">
                      {c.email}
                    </a>
                  </dd>
                </div>
              )}
              {c.social_url && (
                <div>
                  <dt className="text-xs text-brand-500">Instagram / LinkedIn</dt>
                  <dd className="break-all font-medium text-brand-900">
                    {social ? (
                      <a href={social} target="_blank" rel="noopener noreferrer" className="underline">
                        {c.social_url}
                      </a>
                    ) : (
                      c.social_url
                    )}
                  </dd>
                </div>
              )}
              {c.sources.length > 0 && (
                <div>
                  <dt className="text-xs text-brand-500">Como encontrou a vaga</dt>
                  <dd className="font-medium text-brand-900">{c.sources.join(", ")}</dd>
                </div>
              )}
              {c.resume_name && !c.resume_path && (
                <div>
                  <dt className="text-xs text-brand-500">Currículo</dt>
                  <dd className="font-medium text-brand-900">{c.resume_name} (no Notion)</dd>
                </div>
              )}
            </dl>
            {c.about && (
              <>
                <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-brand-500">Sobre a pessoa</h4>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-brand-800">{c.about}</p>
              </>
            )}
          </section>

          {app && (
            <InterviewsBox
              candidate={c}
              app={app}
              interviews={interviews}
              config={config}
              onChanged={refresh}
              onReject={(reason) => changeStage("reprovado", reason)}
            />
          )}
          {app && <Timeline events={appEvents} pipeline={app.pipeline} />}
        </div>
      </div>

      {editing && (
        <EditCandidateDialog
          candidate={c}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            say("Dados atualizados");
            refresh();
          }}
        />
      )}
      {rejecting && app && (
        <RejectDialog
          pipeline={app.pipeline}
          name={c.full_name}
          onCancel={() => setRejecting(false)}
          onConfirm={(reason) => {
            setRejecting(false);
            changeStage("reprovado", reason);
          }}
        />
      )}
    </div>
  );
}
