"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { agendaConfig } from "@/lib/rh/agenda";
import { jobTitles, PIPELINE_LABEL, STAGES, stageDef, STATUS, whatsappLink, type InterviewCriterionKey } from "@/lib/rh/constants";
import { formatDate, hireChance, since, socialHref } from "@/lib/rh/format";
import { logInterview } from "@/lib/rh/interview-flow";
import { feedbackKey } from "@/lib/rh/messages";
import { loadRhSettings } from "@/lib/rh/rh-settings";
import { setAppStatus } from "@/lib/rh/status-actions";
import { useOrigin } from "@/lib/use-origin";
import type { AgendaConfig, Application, ApplicationEvent, AppStatus, Candidate, Interview, InterviewScript, MessageTemplate, Stage } from "@/lib/types";
import ActionMenu from "@/components/admin/ui/ActionMenu";
import AiScorecard from "./AiScorecard";
import { Avatar } from "./charts";
import EditCandidateDialog from "./EditCandidateDialog";
import CultureQuizCard from "./CultureQuizCard";
import InterviewCopilot from "./InterviewCopilot";
import InterviewGuide from "./InterviewGuide";
import InterviewScorecard from "./InterviewScorecard";
import InterviewsBox from "./InterviewsBox";
import MessageDialog from "./MessageDialog";
import RejectDialog from "./RejectDialog";
import ScheduleDialog from "./ScheduleDialog";
import Timeline from "./Timeline";

const ORIGIN = { site: "Site", notion: "Notion", admin: "Cadastro manual", agenda: "Link de agendamento" } as const;

type Tab = "avaliacao" | "entrevista" | "historico";
const TABS: { key: Tab; label: string }[] = [
  { key: "avaliacao", label: "Avaliação da IA" },
  { key: "entrevista", label: "Entrevista" },
  { key: "historico", label: "Anotações e histórico" },
];

interface Data {
  candidate: Candidate;
  apps: Application[];
  events: ApplicationEvent[];
  interviews: Interview[];
  config: AgendaConfig;
  script: InterviewScript;
  templates: MessageTemplate[];
}

const btn = "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors";
const caret = (
  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
    <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Ficha do candidato: topo com as ações, processo (etapa e resultado) e abas. */
export default function CandidateDetail({ id, initialApp }: { id: string; initialApp?: string }) {
  const router = useRouter();
  const origin = useOrigin();
  const [data, setData] = useState<Data | null>(null);
  const [missing, setMissing] = useState(false);
  const [selected, setSelected] = useState(initialApp ?? "");
  const [tab, setTab] = useState<Tab | null>(null);
  const [editing, setEditing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  // Mensagem pelo WhatsApp: qual modelo abrir (e se é a devolutiva logo após reprovar)
  const [message, setMessage] = useState<{ key: string; afterReject?: boolean } | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [flash, setFlash] = useState("");
  const [reload, setReload] = useState(0);
  // Recarrega o scorecard quando as notas vêm do copiloto
  const [scoreKey, setScoreKey] = useState(0);

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
      const [{ data: events }, { data: interviews }, { data: settings }, rh] = await Promise.all([
        ids.length
          ? db.from("application_events").select("*").in("application_id", ids).order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
        db.from("interviews").select("*").eq("candidate_id", id).order("starts_at", { ascending: false }),
        db.from("site_settings").select("agenda_config").limit(1).maybeSingle(),
        loadRhSettings(db),
      ]);
      if (!alive) return;
      setData({
        candidate: candidate as Candidate,
        apps: (apps as Application[]) ?? [],
        events: (events as ApplicationEvent[]) ?? [],
        interviews: (interviews as Interview[]) ?? [],
        config: agendaConfig(settings?.agenda_config),
        script: rh.interview_script,
        templates: rh.message_templates,
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

  const { candidate: c, apps, events, interviews, config, script, templates } = data;
  // Abre no card em processo (ou no escolhido pelo link)
  const app = apps.find((a) => a.id === selected) ?? apps.find((a) => a.status === "em_processo") ?? apps[0];
  // Na etapa de entrevista, a ficha já abre na aba Entrevista
  const activeTab: Tab = tab ?? (app && ["entrevista", "entrevistado", "onboarding", "treinamento"].includes(app.stage) ? "entrevista" : "avaliacao");
  const db = () => createClient();
  const say = (m: string) => {
    setFlash(m);
    setTimeout(() => setFlash(""), 2500);
  };
  const bookingLink = app ? `${origin}/agenda?c=${app.booking_token}` : "";

  async function changeStage(stage: Stage) {
    if (!app || stage === app.stage || app.status !== "em_processo") return;
    const { error } = await db().from("applications").update({ stage }).eq("id", app.id);
    if (error) return say("Não foi possível mudar a etapa.");
    say(`Etapa: ${stageDef(app.pipeline, stage).label}`);
    refresh();
  }

  async function changeStatus(status: AppStatus, reason?: string) {
    if (!app) return;
    if (status === "reprovado" && !reason) return setRejecting(true);
    const ask = {
      contratado: `Marcar ${c.full_name} como contratado(a)?`,
      desligado: `Marcar ${c.full_name} como desligado(a)?`,
      em_processo: `Reabrir o processo de ${c.full_name}? O card volta para o pipeline.`,
      reprovado: "",
    }[status];
    if (ask && !confirm(ask)) return;
    const err = await setAppStatus(db(), app.id, status, reason);
    if (err) return say(err);
    say(status === "em_processo" ? "Processo reaberto" : `Resultado: ${STATUS[status].label}`);
    // Reprovou: já oferece a devolutiva pronta (pode deixar para depois)
    if (status === "reprovado") setMessage({ key: feedbackKey(app.stage), afterReject: true });
    refresh();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(bookingLink).catch(() => null);
    say("Link de agendamento copiado");
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

  async function saveScript(next: InterviewScript) {
    if (!app) return false;
    const { error } = await db().from("applications").update({ interview_answers: next }).eq("id", app.id);
    if (error) {
      say("Não foi possível salvar o roteiro.");
      return false;
    }
    const n = next.sections.reduce((k, sct) => k + sct.questions.filter((q) => q.answer?.trim()).length, 0);
    await logInterview(db(), app.id, `Roteiro da entrevista salvo (${n} resposta${n === 1 ? "" : "s"})`);
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
  const open = app?.status === "em_processo";
  const flow = app ? STAGES[app.pipeline].filter((s) => !s.side) : [];
  const sideStages = app ? STAGES[app.pipeline].filter((s) => s.side) : [];
  const currentIdx = app ? flow.findIndex((s) => s.key === app.stage) : -1;
  const nextInterview = app
    ? interviews
        .filter((i) => i.status === "agendada" && (i.application_id === app.id || !i.application_id) && new Date(i.starts_at).getTime() > Date.parse(new Date().toISOString()))
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0]
    : undefined;
  const defaultKey = !app
    ? "convite"
    : app.status === "reprovado"
      ? feedbackKey(app.stage)
      : app.status === "contratado"
        ? "aprovado"
        : nextInterview
          ? "lembrete"
          : "convite";
  const meta = [c.city, c.age_range, `${ORIGIN[c.origin]} · desde ${formatDate(c.created_at)}`].filter(Boolean).join(" · ");

  return (
    <div className="space-y-4">
      {/* ===== Topo: quem é + ações ===== */}
      <section className="card p-5" aria-label="Candidato">
        <Link href={app ? `/admin/candidatos${app.pipeline === "professor" ? "?funil=professor" : ""}` : "/admin/candidatos"} className="text-sm font-medium text-brand-500 hover:text-brand-900">
          ← Pipeline
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={c.full_name} size="lg" />
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-semibold tracking-tight text-brand-950">{c.full_name}</h2>
              <p className="mt-0.5 text-sm text-brand-500">{meta}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ActionMenu
              label={<>WhatsApp {caret}</>}
              className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}
              items={[
                { label: "Abrir conversa", hint: c.whatsapp, onSelect: () => window.open(whatsappLink(c.whatsapp), "_blank", "noopener") },
                { label: "Enviar mensagem pronta", hint: "Convite, lembrete, aprovação ou devolutiva", onSelect: () => setMessage({ key: defaultKey }), hidden: !app },
                { label: "Copiar link de agendamento", hint: "Para mandar por outro canal", onSelect: copyLink, hidden: !open },
              ]}
            />
            {open && (
              <button type="button" onClick={() => setScheduling(true)} className={`${btn} border border-brand-200 bg-white text-brand-800 hover:bg-brand-50`}>
                Agendar entrevista
              </button>
            )}
            <ActionMenu
              ariaLabel="Mais ações"
              label={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <circle cx="5" cy="12" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="19" cy="12" r="1.8" />
                </svg>
              }
              className="grid h-10 w-10 place-items-center rounded-lg border border-brand-200 bg-white text-brand-600 hover:bg-brand-50"
              items={[
                { label: "Editar dados", onSelect: () => setEditing(true) },
                { label: "Excluir candidato", hint: "Apaga tudo, inclusive o currículo (LGPD)", onSelect: remove, danger: true },
              ]}
            />
          </div>
        </div>

        {/* ===== Processo: vagas, etapa e resultado ===== */}
        {app && (
          <div className="mt-5 border-t border-stone-200 pt-4">
            {apps.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Processos desta pessoa">
                {apps.map((a) => (
                  <button
                    key={a.id}
                    role="tab"
                    aria-selected={a.id === app.id}
                    onClick={() => {
                      setSelected(a.id);
                      setNotes(null);
                      setTab(null);
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium ${a.id === app.id ? "bg-brand-950 text-white" : "bg-stone-100 text-brand-900 hover:bg-stone-200"}`}
                  >
                    {PIPELINE_LABEL[a.pipeline]} · {a.status === "em_processo" ? stageDef(a.pipeline, a.stage).label : `${STATUS[a.status].label} em ${formatDate(a.closed_at ?? a.stage_changed_at)}`}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-xs font-bold uppercase tracking-wide text-brand-500">{PIPELINE_LABEL[app.pipeline]}</span>
              <ul className="flex flex-wrap gap-1.5" aria-label="Vagas escolhidas">
                {jobTitles(app).map((t) => (
                  <li key={t} className="rounded-lg bg-brand-50 px-2.5 py-1 text-sm font-semibold text-brand-800 ring-1 ring-brand-100">
                    {t}
                  </li>
                ))}
              </ul>
              <span className="text-xs text-brand-400">candidatura em {formatDate(app.created_at)}</span>
            </div>

            {open ? (
              <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="mb-2 text-xs text-brand-500">
                    Etapa — clique para mover · nesta etapa {since(app.stage_changed_at)}
                  </p>
                  <ol className="flex flex-wrap gap-1.5" aria-label="Etapa do processo">
                    {flow.map((s, i) => {
                      const cur = s.key === app.stage;
                      const done = currentIdx >= 0 && i < currentIdx;
                      return (
                        <li key={s.key}>
                          <button
                            type="button"
                            aria-current={cur ? "step" : undefined}
                            onClick={() => changeStage(s.key)}
                            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                              cur ? "bg-brand-950 text-white" : done ? "bg-stone-100 text-brand-900 hover:bg-stone-200" : "bg-white text-stone-500 ring-1 ring-stone-200 hover:bg-stone-50 hover:text-brand-950"
                            }`}
                          >
                            {done && "✓ "}
                            {s.label}
                          </button>
                        </li>
                      );
                    })}
                    {sideStages.map((s) => (
                      <li key={s.key}>
                        <button
                          type="button"
                          aria-current={s.key === app.stage ? "step" : undefined}
                          onClick={() => changeStage(s.key)}
                          className={`rounded-md border border-dashed px-2.5 py-1.5 text-xs font-medium ${s.key === app.stage ? "border-amber-400 bg-amber-50 text-amber-800" : "border-brand-200 text-brand-500 hover:bg-brand-50"}`}
                        >
                          {s.label}
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="flex items-center gap-2">
                  {chance != null && (
                    <span className="mr-1 text-right" title="Estimativa do sistema: combina a etapa atual, o score da IA e a nota da entrevista.">
                      <span className="block text-[11px] font-bold uppercase tracking-wide text-brand-500">Chance</span>
                      <span className="block text-xl font-bold tabular-nums text-brand-900">{chance}%</span>
                    </span>
                  )}
                  <button type="button" onClick={() => changeStatus("contratado")} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}>
                    ✓ Contratar
                  </button>
                  <button type="button" onClick={() => changeStatus("reprovado")} className={`${btn} border border-rose-200 bg-white text-rose-700 hover:bg-rose-50`}>
                    ✕ Reprovar
                  </button>
                </div>
              </div>
            ) : (
              <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3 ring-1 ${STATUS[app.status].tone}`}>
                <p className="text-sm">
                  <strong>{STATUS[app.status].label}</strong> em {formatDate(app.closed_at ?? app.stage_changed_at)}
                  {app.status === "reprovado" && <> · motivo: {app.rejection_reason || "sem motivo"}</>} · estava em “{stageDef(app.pipeline, app.stage).label}”
                  {app.status === "reprovado" && (
                    <> · {app.feedback_sent_at ? `devolutiva enviada em ${formatDate(app.feedback_sent_at)}` : <strong>sem devolutiva</strong>}</>
                  )}
                </p>
                <div className="flex gap-2">
                  {app.status === "reprovado" && !app.feedback_sent_at && (
                    <button type="button" onClick={() => setMessage({ key: feedbackKey(app.stage) })} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                      Enviar devolutiva
                    </button>
                  )}
                  {app.status === "contratado" && (
                    <button type="button" onClick={() => changeStatus("desligado")} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold ring-1 ring-current/20">
                      Desligar
                    </button>
                  )}
                  {app.status !== "desligado" && (
                    <button type="button" onClick={() => changeStatus("em_processo")} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold ring-1 ring-current/20">
                      Reabrir processo
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {flash && (
        <p role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-brand-950 px-5 py-2.5 text-sm font-semibold text-white shadow-xl">
          {flash}
        </p>
      )}

      {!app ? (
        <p className="card p-5 text-brand-600">Esta pessoa não tem candidaturas.</p>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* ===== Abas ===== */}
          <div className="min-w-0">
            <div className="mb-4 flex gap-5 overflow-x-auto border-b border-stone-200" role="tablist" aria-label="Seções da ficha">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  id={`aba-${t.key}`}
                  aria-selected={activeTab === t.key}
                  aria-controls={`painel-${t.key}`}
                  onClick={() => setTab(t.key)}
                  className={`-mb-px shrink-0 border-b-2 px-0.5 pb-2.5 pt-1 text-sm font-medium transition-colors ${activeTab === t.key ? "border-brand-950 text-brand-950" : "border-transparent text-stone-500 hover:text-brand-950"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div role="tabpanel" id={`painel-${activeTab}`} aria-labelledby={`aba-${activeTab}`} className="space-y-4">
              {activeTab === "avaliacao" && (
                <>
                  <AiScorecard app={app} busy={evaluating} onEvaluate={evaluate} />
                  <CultureQuizCard
                    app={app}
                    onSend={() => setMessage({ key: "questionario" })}
                    onCopy={async () => {
                      await navigator.clipboard.writeText(`${origin}/questionario?c=${app.booking_token}`).catch(() => null);
                      say("Link do questionário copiado");
                    }}
                  />
                </>
              )}
              {activeTab === "entrevista" && (
                <>
                  <InterviewGuide key={`roteiro-${app.id}`} app={app} standard={script} onSave={async (next) => {
                    const ok = await saveScript(next);
                    if (ok) refresh();
                    return ok;
                  }} />
                  <InterviewCopilot
                    app={app}
                    onAnalyzed={() => {
                      say("Análise da entrevista pronta");
                      refresh();
                    }}
                    onApply={async (scores) => {
                      const ok = await saveScores(scores);
                      if (ok) {
                        setScoreKey((k) => k + 1);
                        say("Notas sugeridas aplicadas. Ajuste se precisar.");
                      }
                      return ok;
                    }}
                  />
                  {/* Depois de usar as notas do copiloto, o scorecard recarrega quando os dados novos chegam */}
                  <InterviewScorecard
                    key={`${app.id}-${scoreKey ? [app.score_fit, app.score_proatividade, app.score_comunicacao, app.score_resiliencia, app.score_tecnica].join(",") : ""}`}
                    app={app}
                    onSave={saveScores}
                  />
                </>
              )}
              {activeTab === "historico" && (
                <>
                  <section className="card p-5" aria-labelledby="notas">
                    <h3 id="notas" className="font-bold text-brand-950">
                      Anotações
                    </h3>
                    <textarea
                      rows={4}
                      className="input mt-3"
                      placeholder="Impressões, combinados, próximos passos..."
                      value={notes ?? app.notes ?? ""}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <button type="button" disabled={notes === null} onClick={saveNotes} className="mt-3 rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                      Salvar anotação
                    </button>
                  </section>
                  <Timeline events={appEvents} pipeline={app.pipeline} />
                </>
              )}
            </div>
          </div>

          {/* ===== Lateral: perfil e entrevistas ===== */}
          <aside className="space-y-4">
            <section className="card p-5" aria-labelledby="perfil">
              <h3 id="perfil" className="font-bold text-brand-950">
                Perfil
              </h3>
              <dl className="mt-3 divide-y divide-brand-50 text-sm">
                <div className="flex justify-between gap-3 py-2">
                  <dt className="text-brand-500">WhatsApp</dt>
                  <dd className="text-right font-medium text-brand-900">{c.whatsapp}</dd>
                </div>
                {c.email && (
                  <div className="flex justify-between gap-3 py-2">
                    <dt className="text-brand-500">E-mail</dt>
                    <dd className="min-w-0 truncate text-right">
                      <a href={`mailto:${c.email}`} className="font-medium text-brand-900 underline" title={c.email}>
                        {c.email}
                      </a>
                    </dd>
                  </div>
                )}
                {c.social_url && (
                  <div className="flex justify-between gap-3 py-2">
                    <dt className="shrink-0 text-brand-500">Rede social</dt>
                    <dd className="min-w-0 truncate text-right font-medium text-brand-900" title={c.social_url}>
                      {social ? (
                        <a href={social} target="_blank" rel="noopener noreferrer" className="underline">
                          {c.social_url.replace(/^https?:\/\/(www\.)?/, "")}
                        </a>
                      ) : (
                        c.social_url
                      )}
                    </dd>
                  </div>
                )}
                {c.sources.length > 0 && (
                  <div className="flex justify-between gap-3 py-2">
                    <dt className="shrink-0 text-brand-500">Encontrou por</dt>
                    <dd className="text-right font-medium text-brand-900">{c.sources.join(", ")}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-brand-500">Currículo</dt>
                  <dd className="text-right">
                    {c.resume_path ? (
                      <button type="button" onClick={openResume} className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 hover:bg-brand-100">
                        Abrir currículo
                      </button>
                    ) : c.resume_name ? (
                      <span className="text-xs text-brand-600">{c.resume_name} (no Notion)</span>
                    ) : (
                      <span className="text-xs text-brand-400">Não enviou</span>
                    )}
                  </dd>
                </div>
              </dl>
              {(app.screening ?? []).length > 0 && (
                <div className="mt-3 rounded-lg border border-stone-200 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-500">Perguntas eliminatórias</p>
                  <ul className="mt-1.5 space-y-1.5 text-sm">
                    {(app.screening ?? []).map((x) => (
                      <li key={x.job + x.question} className="flex gap-2">
                        <span aria-hidden className={x.ok ? "text-emerald-600" : "text-rose-600"}>
                          {x.ok ? "✓" : "✕"}
                        </span>
                        <span className="min-w-0">
                          <span className="text-brand-900">{x.question}</span>{" "}
                          <span className={`font-semibold ${x.ok ? "text-brand-700" : "text-rose-700"}`}>
                            {x.answer === "sim" ? "Sim" : "Não"}
                            {!x.ok && ` (a vaga pede ${x.expected === "sim" ? "Sim" : "Não"})`}
                          </span>
                          <span className="block text-xs text-brand-400">{x.job}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {c.about && (
                <div className="mt-3 rounded-lg bg-brand-50/60 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-500">Sobre a pessoa</p>
                  <p className={`mt-1 whitespace-pre-line text-sm leading-relaxed text-brand-800 ${aboutOpen ? "" : "line-clamp-5"}`}>{c.about}</p>
                  {c.about.length > 280 && (
                    <button type="button" onClick={() => setAboutOpen((v) => !v)} className="mt-1 text-xs font-semibold text-brand-600 underline">
                      {aboutOpen ? "Mostrar menos" : "Ler tudo"}
                    </button>
                  )}
                </div>
              )}
            </section>

            <InterviewsBox candidate={c} app={app} interviews={interviews} onChanged={refresh} onReject={() => setRejecting(true)} />
          </aside>
        </div>
      )}

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
      {scheduling && app && (
        <ScheduleDialog
          candidate={c}
          app={app}
          interviews={interviews}
          config={config}
          onClose={() => setScheduling(false)}
          onDone={() => {
            setScheduling(false);
            say("Entrevista marcada");
            refresh();
          }}
        />
      )}
      {message && app && (
        <MessageDialog
          target={{ candidate: c, app, origin, interviewAt: nextInterview?.starts_at, location: nextInterview?.location ?? config.location }}
          templates={templates}
          initialKey={message.key}
          title={message.afterReject ? `Enviar a devolutiva para ${c.full_name.split(" ")[0]}?` : undefined}
          subtitle={message.afterReject ? "Dar retorno a quem participou faz diferença. Ajuste o texto se quiser." : undefined}
          skipLabel={message.afterReject ? "Agora não" : "Cancelar"}
          onClose={() => setMessage(null)}
          onSent={(k) => {
            setMessage(null);
            say(k.startsWith("devolutiva") ? "Devolutiva registrada" : "Mensagem registrada no histórico");
            refresh();
          }}
        />
      )}
      {rejecting && app && (
        <RejectDialog
          name={c.full_name}
          onCancel={() => setRejecting(false)}
          onConfirm={(reason) => {
            setRejecting(false);
            changeStatus("reprovado", reason);
          }}
        />
      )}
    </div>
  );
}
