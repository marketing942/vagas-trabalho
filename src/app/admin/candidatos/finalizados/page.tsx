"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Avatar, KpiCard, Panel, RankBars, Segmented, type Datum } from "@/components/admin/rh/charts";
import Icon from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";
import { fetchAll } from "@/lib/rh/fetch-all";
import { jobTitles, PIPELINE_LABEL, stageDef, STATUS } from "@/lib/rh/constants";
import { formatDate } from "@/lib/rh/format";
import { setAppStatus } from "@/lib/rh/status-actions";
import { feedbackKey } from "@/lib/rh/messages";
import { loadRhSettings } from "@/lib/rh/rh-settings";
import { useOrigin } from "@/lib/use-origin";
import MessageDialog from "@/components/admin/rh/MessageDialog";
import type { AppStatus, Application, MessageTemplate, Pipeline } from "@/lib/types";

type Row = Pick<
  Application,
  | "id"
  | "candidate_id"
  | "job_id"
  | "job_title"
  | "jobs"
  | "pipeline"
  | "stage"
  | "status"
  | "rejection_reason"
  | "ai_score"
  | "interview_score"
  | "created_at"
  | "closed_at"
  | "stage_changed_at"
  | "feedback_sent_at"
  | "booking_token"
> & { candidates: { full_name: string; city: string | null; whatsapp: string } | null };

type Tab = "contratado" | "reprovado" | "desligado" | "todos";
type Funil = "todos" | Pipeline;
type Periodo = "30" | "90" | "365" | "tudo";

const DAY = 86_400_000;
const closedAt = (r: Row) => new Date(r.closed_at ?? r.stage_changed_at).getTime();
const NF = new Intl.NumberFormat("pt-BR");

function top(map: Map<string, number>, n = 8): Datum[] {
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  const rest = sorted.slice(n).reduce((s, [, v]) => s + v, 0);
  return [...sorted.slice(0, n).map(([label, value]) => ({ label, value })), ...(rest ? [{ label: "Outros", value: rest }] : [])];
}

/** Candidaturas finalizadas: contratados (ganho), reprovados (perdido) e desligados. */
export default function FinalizadosPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("contratado");
  const [funil, setFunil] = useState<Funil>("todos");
  const [periodo, setPeriodo] = useState<Periodo>("tudo");
  const [search, setSearch] = useState("");
  const [job, setJob] = useState("");
  const [reason, setReason] = useState("");
  const [now] = useState(() => Date.now());
  const [reload, setReload] = useState(0);
  const [flash, setFlash] = useState("");
  const [devolutiva, setDevolutiva] = useState<"" | "sem" | "enviada">("");
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  // Envio de devolutivas: uma pessoa ou a fila de quem ainda não recebeu
  const [queue, setQueue] = useState<Row[] | null>(null);
  const [qi, setQi] = useState(0);
  const origin = useOrigin();

  useEffect(() => {
    let alive = true;
    const db = createClient();
    loadRhSettings(db).then((s) => alive && setTemplates(s.message_templates));
    fetchAll<Row>((from, to) =>
      db
        .from("applications")
        .select("id,candidate_id,job_id,job_title,jobs,pipeline,stage,status,rejection_reason,ai_score,interview_score,created_at,closed_at,stage_changed_at,feedback_sent_at,booking_token,candidates(full_name,city,whatsapp)")
        .neq("status", "em_processo")
        .order("closed_at", { ascending: false, nullsFirst: false })
        .range(from, to)
    ).then(({ data, error }) => {
      if (!alive) return;
      setRows(data);
      setError(error ? "Não foi possível carregar. Confira se a migração 0011 foi executada no Supabase." : "");
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [reload]);

  // Recorte por funil e período (vale para os números e para a lista)
  const scoped = useMemo(() => {
    const since = periodo === "tudo" ? 0 : now - Number(periodo) * DAY;
    return rows.filter((r) => (funil === "todos" || r.pipeline === funil) && closedAt(r) >= since);
  }, [rows, funil, periodo, now]);

  const stats = useMemo(() => {
    const by = (s: AppStatus) => scoped.filter((r) => r.status === s);
    const hired = by("contratado");
    const fired = by("desligado");
    const rejected = by("reprovado");
    const everHired = hired.length + fired.length;
    const days = everHired ? [...hired, ...fired].reduce((s, r) => s + (closedAt(r) - new Date(r.created_at).getTime()) / DAY, 0) / everHired : null;
    const reasons = new Map<string, number>();
    rejected.forEach((r) => reasons.set(r.rejection_reason || "Sem motivo", (reasons.get(r.rejection_reason || "Sem motivo") ?? 0) + 1));
    const where = new Map<string, number>();
    rejected.forEach((r) => {
      const l = stageDef(r.pipeline, r.stage).label;
      where.set(l, (where.get(l) ?? 0) + 1);
    });
    const hiresByJob = new Map<string, number>();
    [...hired, ...fired].forEach((r) => jobTitles(r).slice(0, 1).forEach((t) => hiresByJob.set(t, (hiresByJob.get(t) ?? 0) + 1)));
    return {
      hired: hired.length,
      rejected: rejected.length,
      fired: fired.length,
      rate: everHired + rejected.length ? Math.round((everHired / (everHired + rejected.length)) * 100) : null,
      days: days == null ? null : Math.round(days),
      retention: everHired ? Math.round((hired.length / everHired) * 100) : null,
      reasons: top(reasons),
      where: top(where),
      hiresByJob: top(hiresByJob),
    };
  }, [scoped]);

  const jobs = useMemo(() => Array.from(new Set(scoped.flatMap((r) => jobTitles(r)))).sort((a, b) => a.localeCompare(b, "pt-BR")), [scoped]);
  const reasons = useMemo(() => Array.from(new Set(scoped.map((r) => r.rejection_reason).filter(Boolean) as string[])).sort(), [scoped]);

  const list = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return scoped.filter(
      (r) =>
        (tab === "todos" || r.status === tab) &&
        (!term || (r.candidates?.full_name ?? "").toLocaleLowerCase("pt-BR").includes(term)) &&
        (!job || jobTitles(r).includes(job)) &&
        (!reason || r.rejection_reason === reason) &&
        (!devolutiva || (r.status === "reprovado" && (devolutiva === "sem" ? !r.feedback_sent_at : !!r.feedback_sent_at)))
    );
  }, [scoped, tab, search, job, reason, devolutiva]);
  const pendingFeedback = scoped.filter((r) => r.status === "reprovado" && !r.feedback_sent_at && r.candidates?.whatsapp);

  async function change(r: Row, status: AppStatus) {
    const name = r.candidates?.full_name ?? "esta pessoa";
    const msg =
      status === "em_processo"
        ? `Reabrir o processo de ${name}? O card volta para o pipeline na etapa "${stageDef(r.pipeline, r.stage).label}".`
        : `Marcar ${name} como desligado(a)?`;
    if (!confirm(msg)) return;
    const err = await setAppStatus(createClient(), r.id, status);
    setFlash(err ?? (status === "em_processo" ? `${name} voltou para o pipeline.` : `${name} marcado(a) como desligado(a).`));
    setTimeout(() => setFlash(""), 3500);
    if (!err) setReload((n) => n + 1);
  }

  const tabs: { key: Tab; label: string; n: number }[] = [
    { key: "contratado", label: "Contratados", n: stats.hired },
    { key: "reprovado", label: "Reprovados", n: stats.rejected },
    { key: "desligado", label: "Desligados", n: stats.fired },
    { key: "todos", label: "Todos", n: scoped.length },
  ];

  return (
    <AdminLayout
      title="Finalizados"
      subtitle="Resultado dos processos: contratados (ganho), reprovados (perdido) e desligados"
      actions={
        <>
          <Segmented<Funil>
            label="Funil"
            value={funil}
            onChange={setFunil}
            options={[
              { key: "todos", label: "Todos" },
              { key: "trabalho", label: PIPELINE_LABEL.trabalho },
              { key: "professor", label: PIPELINE_LABEL.professor },
            ]}
          />
          <Segmented<Periodo>
            label="Período"
            value={periodo}
            onChange={setPeriodo}
            options={[
              { key: "30", label: "30D", title: "Finalizados nos últimos 30 dias" },
              { key: "90", label: "90D", title: "Últimos 90 dias" },
              { key: "365", label: "12M", title: "Últimos 12 meses" },
              { key: "tudo", label: "Tudo", title: "Todo o período" },
            ]}
          />
        </>
      }
    >
      {loading ? (
        <p className="text-brand-500">Carregando...</p>
      ) : (
        <div className="space-y-5">
          {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          {flash && (
            <p role="status" className="rounded-lg bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white">
              {flash}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <KpiCard label="Contratados" value={NF.format(stats.hired)} hint="ativos" />
            <KpiCard label="Reprovados" value={NF.format(stats.rejected)} />
            <KpiCard label="Desligados" value={NF.format(stats.fired)} hint="depois de contratados" />
            <KpiCard label="Taxa de contratação" value={stats.rate == null ? "–" : `${stats.rate}%`} hint="dos processos finalizados" />
            <KpiCard label="Tempo até contratar" value={stats.days == null ? "–" : `${stats.days} dia${stats.days === 1 ? "" : "s"}`} hint="da candidatura à contratação" />
            <KpiCard label="Permanência" value={stats.retention == null ? "–" : `${stats.retention}%`} hint="dos contratados seguem na equipe" />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Panel title="Motivos de reprovação" subtitle="por que perdemos candidatos">
              <RankBars data={stats.reasons} total={stats.rejected} unit="reprovados" empty="Nenhum reprovado no período." />
            </Panel>
            <Panel title="Em que etapa foram reprovados" subtitle="onde o processo parou">
              <RankBars data={stats.where} total={stats.rejected} unit="reprovados" empty="Nenhum reprovado no período." />
            </Panel>
            <Panel title="Contratações por vaga" subtitle="contratados e desligados, pela vaga principal">
              <RankBars data={stats.hiresByJob} unit="contratações" empty="Nenhuma contratação no período." />
            </Panel>
          </div>

          {pendingFeedback.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm text-amber-900">
                <strong>{pendingFeedback.length}</strong> reprovado{pendingFeedback.length === 1 ? "" : "s"} no período ainda sem devolutiva. Dar retorno é parte de uma boa
                experiência do candidato.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQi(0);
                  setQueue(pendingFeedback);
                }}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Enviar devolutivas ({pendingFeedback.length})
              </button>
            </div>
          )}

          <Panel title="Pessoas" subtitle={`${list.length} de ${scoped.length} no período`}>
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <div className="inline-flex flex-wrap rounded-full border border-stone-200 bg-brand-50/60 p-1" role="tablist" aria-label="Resultado">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={tab === t.key}
                    onClick={() => setTab(t.key)}
                    className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${tab === t.key ? "bg-brand-900 text-white shadow" : "text-brand-600 hover:bg-white"}`}
                  >
                    {t.label} <span className="tabular-nums opacity-70">{t.n}</span>
                  </button>
                ))}
              </div>
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome" aria-label="Buscar por nome" className="input !w-56 !py-2" />
              <select aria-label="Vaga" value={job} onChange={(e) => setJob(e.target.value)} className="input !w-auto max-w-[16rem] !py-2">
                <option value="">Todas as vagas</option>
                {jobs.map((j) => (
                  <option key={j}>{j}</option>
                ))}
              </select>
              {(tab === "reprovado" || tab === "todos") && (
                <select aria-label="Devolutiva" value={devolutiva} onChange={(e) => setDevolutiva(e.target.value as typeof devolutiva)} className="input !w-auto !py-2">
                  <option value="">Devolutiva: todas</option>
                  <option value="sem">Sem devolutiva</option>
                  <option value="enviada">Devolutiva enviada</option>
                </select>
              )}
              {(tab === "reprovado" || tab === "todos") && (
                <select aria-label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} className="input !w-auto max-w-[16rem] !py-2">
                  <option value="">Todos os motivos</option>
                  {reasons.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              )}
            </div>

            {list.length === 0 ? (
              <p className="py-8 text-center text-sm text-brand-500">Ninguém aqui com esses filtros.</p>
            ) : (
              <div className="-mx-2 overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-brand-500">
                    <tr>
                      <th className="px-2 pb-2 font-semibold">Candidato</th>
                      <th className="px-2 pb-2 font-semibold">Resultado</th>
                      <th className="px-2 pb-2 font-semibold">Etapa ao sair</th>
                      <th className="px-2 pb-2 font-semibold">Score IA</th>
                      <th className="px-2 pb-2 font-semibold">Entrevista</th>
                      <th className="px-2 pb-2 font-semibold">Finalizado em</th>
                      <th className="px-2 pb-2 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-50">
                    {list.map((r) => {
                      const st = STATUS[r.status];
                      const titles = jobTitles(r);
                      return (
                        <tr key={r.id} className="align-top">
                          <td className="px-2 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={r.candidates?.full_name ?? "?"} size="sm" />
                              <div className="min-w-0">
                                <Link href={`/admin/candidatos/${r.candidate_id}?c=${r.id}`} className="font-semibold text-brand-950 hover:underline">
                                  {r.candidates?.full_name ?? "—"}
                                </Link>
                                <p className="max-w-[18rem] truncate text-xs text-brand-500" title={titles.join(", ")}>
                                  {PIPELINE_LABEL[r.pipeline]} · {titles.join(", ")}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${st.tone}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} aria-hidden />
                              {st.label}
                            </span>
                            {r.status === "reprovado" && (
                              <>
                                <p className="mt-1 text-xs text-brand-600">{r.rejection_reason || "Sem motivo"}</p>
                                <p className={`mt-0.5 text-[11px] font-semibold ${r.feedback_sent_at ? "text-emerald-700" : "text-amber-700"}`}>
                                  {r.feedback_sent_at ? `✓ Devolutiva em ${formatDate(r.feedback_sent_at)}` : "Sem devolutiva"}
                                </p>
                              </>
                            )}
                          </td>
                          <td className="px-2 py-3 text-xs text-brand-700">{stageDef(r.pipeline, r.stage).label}</td>
                          <td className="px-2 py-3">
                            {r.ai_score != null ? (
                              <span className="flex w-28 items-center gap-2">
                                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-100" aria-hidden>
                                  <span className="block h-full rounded-full bg-brand-500" style={{ width: `${r.ai_score}%` }} />
                                </span>
                                <span className="text-xs font-bold tabular-nums text-brand-900">{r.ai_score}</span>
                              </span>
                            ) : (
                              <span className="text-xs text-brand-400">–</span>
                            )}
                          </td>
                          <td className="px-2 py-3 text-xs font-semibold tabular-nums text-brand-800">
                            {r.interview_score != null && Number(r.interview_score) > 0 ? Number(r.interview_score).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "–"}
                          </td>
                          <td className="px-2 py-3 text-xs text-brand-700">{formatDate(r.closed_at ?? r.stage_changed_at)}</td>
                          <td className="px-2 py-3">
                            <div className="flex justify-end gap-1.5">
                              {r.status === "contratado" && (
                                <button type="button" onClick={() => change(r, "desligado")} className="rounded-lg border border-brand-200 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                                  Desligar
                                </button>
                              )}
                              {r.status === "reprovado" && !r.feedback_sent_at && r.candidates?.whatsapp && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQi(0);
                                    setQueue([r]);
                                  }}
                                  className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                                >
                                  Devolutiva
                                </button>
                              )}
                              {r.status !== "desligado" && (
                                <button type="button" onClick={() => change(r, "em_processo")} className="rounded-lg border border-brand-200 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                                  Reabrir
                                </button>
                              )}
                              <Link href={`/admin/candidatos/${r.candidate_id}?c=${r.id}`} className="rounded-lg bg-brand-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-800">
                                Ficha
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}

      {queue && queue[qi] && queue[qi].candidates && (
        <MessageDialog
          key={queue[qi].id}
          target={{ candidate: { full_name: queue[qi].candidates!.full_name, whatsapp: queue[qi].candidates!.whatsapp }, app: queue[qi], origin }}
          templates={templates}
          initialKey={feedbackKey(queue[qi].stage)}
          title={`Devolutiva para ${queue[qi].candidates!.full_name}`}
          subtitle={`${queue[qi].rejection_reason || "Sem motivo"} · reprovado(a) em ${formatDate(queue[qi].closed_at ?? queue[qi].stage_changed_at)}`}
          progress={queue.length > 1 ? `${qi + 1} de ${queue.length}` : undefined}
          skipLabel={queue.length > 1 && qi < queue.length - 1 ? "Pular" : "Fechar"}
          onClose={() => {
            if (qi < queue.length - 1) setQi(qi + 1);
            else {
              setQueue(null);
              setReload((n) => n + 1);
            }
          }}
          onSent={() => {
            if (qi < queue.length - 1) setQi(qi + 1);
            else {
              setQueue(null);
              setFlash("Devolutivas registradas");
              setTimeout(() => setFlash(""), 3000);
              setReload((n) => n + 1);
            }
          }}
        />
      )}
    </AdminLayout>
  );
}
