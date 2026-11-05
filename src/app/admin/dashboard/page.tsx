"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Icon from "@/components/Icon";
import { AreaChart, Avatar, DeltaPill, Funnel, KpiCard, Panel, RankBars, Ring, Segmented, type Datum, type FunnelStep } from "@/components/admin/rh/charts";
import { createClient } from "@/lib/supabase/client";
import { fetchAll } from "@/lib/rh/fetch-all";
import { addDays, dateKey, weekdayOf } from "@/lib/rh/agenda";
import { isActive, PIPELINE_LABEL, stageDef } from "@/lib/rh/constants";
import { aiScoreTone, formatTime, hireChance } from "@/lib/rh/format";
import type { Application, Interview, Job, Pipeline, Stage } from "@/lib/types";

type DashApp = Pick<Application, "id" | "candidate_id" | "job_title" | "pipeline" | "stage" | "ai_score" | "interview_score" | "created_at" | "stage_changed_at"> & {
  candidates: { full_name: string; sources: string[] } | null;
};
type DashInterview = Pick<Interview, "id" | "candidate_id" | "application_id" | "starts_at"> & {
  candidates: { full_name: string } | null;
  applications: { job_title: string } | null;
};

type Funil = "todos" | Pipeline;
type Periodo = "30" | "90" | "365" | "tudo";

const PERIODS: { key: Periodo; short: string; label: string }[] = [
  { key: "30", short: "30D", label: "Últimos 30 dias" },
  { key: "90", short: "90D", label: "Últimos 90 dias" },
  { key: "365", short: "12M", label: "Últimos 12 meses" },
  { key: "tudo", short: "Tudo", label: "Todo o período" },
];

/** Até onde a candidatura chegou no processo (para o funil). Reprovados contam só até a triagem. */
const REACH: Partial<Record<Stage, number>> = {
  novo: 0, visto: 0, avaliado_ia: 1, depois: 1, proximo_ano: 1, reprovado: 0,
  convite: 2, entrevista: 3, entrevistado: 3, onboarding: 3, treinamento: 3, contratado: 4, desligado: 4,
};
const reach = (a: DashApp) => Math.max(REACH[a.stage] ?? 0, a.ai_score != null ? 1 : 0);

const SCORE_BUCKETS = [
  { label: "85 a 100 · muito aderente", min: 85 },
  { label: "70 a 84 · boa aderência", min: 70 },
  { label: "50 a 69 · aderência parcial", min: 50 },
  { label: "0 a 49 · pouca aderência", min: 0 },
];

const DAY_BADGE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", weekday: "short", timeZone: "America/Recife" });

const STAGE_ORDER: Stage[] = ["novo", "visto", "avaliado_ia", "convite", "entrevista", "entrevistado", "onboarding", "treinamento", "contratado", "depois", "proximo_ano", "reprovado", "desligado"];
const MONTH = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" });
const DAY = (key: string) => `${key.slice(8)}/${key.slice(5, 7)}`;

/** Agrupa as candidaturas no tempo: por dia (30 dias), semana (90 dias) ou mês (12 meses / tudo). */
function timeline(apps: DashApp[], periodo: Periodo): Datum[] {
  const today = dateKey(new Date());
  const monday = (k: string) => addDays(k, -((weekdayOf(k) + 6) % 7));
  let keys: string[];
  let bucket: (k: string) => string;
  let label: (k: string) => string;
  let detail: (k: string) => string;
  if (periodo === "30") {
    keys = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));
    bucket = (k) => k;
    label = DAY;
    detail = (k) => `Dia ${DAY(k)}`;
  } else if (periodo === "90") {
    const last = monday(today);
    keys = Array.from({ length: 13 }, (_, i) => addDays(last, (i - 12) * 7));
    bucket = monday;
    label = DAY;
    detail = (k) => `Semana de ${DAY(k)}`;
  } else {
    const first = periodo === "365" ? addDays(today, -334).slice(0, 7) : (apps.map((a) => dateKey(new Date(a.created_at))).sort()[0] ?? today).slice(0, 7);
    keys = [];
    for (let [y, m] = first.split("-").map(Number); `${y}-${String(m).padStart(2, "0")}` <= today.slice(0, 7); m === 12 ? ((m = 1), y++) : m++) {
      keys.push(`${y}-${String(m).padStart(2, "0")}`);
    }
    bucket = (k) => k.slice(0, 7);
    label = (k) => MONTH.format(new Date(`${k}-15T12:00:00Z`)).replace(". de ", "/").replace(".", "");
    detail = label;
  }
  const counts = new Map(keys.map((k) => [k, 0]));
  for (const a of apps) {
    const k = bucket(dateKey(new Date(a.created_at)));
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return keys.map((k) => ({ label: label(k), value: counts.get(k) ?? 0, detail: detail(k) }));
}

function top(map: Map<string, number>, n: number): Datum[] {
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  const head = sorted.slice(0, n).map(([label, value]) => ({ label, value }));
  const rest = sorted.slice(n).reduce((s, [, v]) => s + v, 0);
  return rest ? [...head, { label: "Outras", value: rest }] : head;
}

const cardLink = "text-[13px] font-semibold text-brand-600 hover:text-brand-950";

/** Lista de pessoas com avatar (maiores scores da IA). */
function ScoreList({ rows }: { rows: DashApp[] }) {
  if (!rows.length) return <p className="text-sm text-brand-500">Nenhuma candidatura ativa avaliada pela IA.</p>;
  return (
    <ul className="divide-y divide-brand-50">
      {rows.map((a, i) => (
        <li key={a.id} className="flex items-center gap-3 py-2.5">
          <span className="w-4 shrink-0 text-xs font-bold tabular-nums text-brand-400">{i + 1}</span>
          <Avatar name={a.candidates?.full_name ?? "?"} size="sm" />
          <Link href={`/admin/candidatos/${a.candidate_id}?c=${a.id}`} className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-brand-950 hover:underline">{a.candidates?.full_name ?? "—"}</span>
            <span className="block truncate text-xs text-brand-500">{a.job_title} · {stageDef(a.pipeline, a.stage).label}</span>
          </Link>
          <span className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold tabular-nums ${aiScoreTone(a.ai_score)}`}>{a.ai_score}</span>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [apps, setApps] = useState<DashApp[]>([]);
  const [interviews, setInterviews] = useState<DashInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [rhReady, setRhReady] = useState(true);
  const [funil, setFunil] = useState<Funil>("todos");
  const [periodo, setPeriodo] = useState<Periodo>("30");
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const db = createClient();
    const now = new Date();
    Promise.all([
      db.from("jobs").select("*"),
      fetchAll<DashApp>((from, to) =>
        db
          .from("applications")
          .select("id,candidate_id,job_title,pipeline,stage,ai_score,interview_score,created_at,stage_changed_at,candidates(full_name,sources)")
          .order("created_at", { ascending: false })
          .range(from, to)
      ),
      db
        .from("interviews")
        .select("id,candidate_id,application_id,starts_at,candidates(full_name),applications(job_title)")
        .eq("status", "agendada")
        .gte("starts_at", now.toISOString())
        .lt("starts_at", new Date(now.getTime() + 7 * 86_400_000).toISOString())
        .order("starts_at"),
    ]).then(([j, a, i]) => {
      setJobs((j.data as Job[]) ?? []);
      setApps(a.data);
      setRhReady(!a.error);
      setInterviews((i.data as unknown as DashInterview[]) ?? []);
      setLoading(false);
    });
  }, []);

  const view = useMemo(() => {
    const days = periodo === "tudo" ? null : Number(periodo);
    const since = days ? now - days * 86_400_000 : 0;
    const prevSince = days ? now - 2 * days * 86_400_000 : 0;
    const t = (iso: string) => new Date(iso).getTime();
    const scoped = apps.filter((a) => funil === "todos" || a.pipeline === funil);
    const inPeriod = scoped.filter((a) => t(a.created_at) >= since);
    const pct = (cur: number, prev: number | null) => (prev == null ? null : prev ? ((cur - prev) / prev) * 100 : cur ? 100 : 0);
    const prevCount = days ? scoped.filter((a) => t(a.created_at) >= prevSince && t(a.created_at) < since).length : null;
    const active = scoped.filter((a) => isActive(a.stage));
    const hiredApps = scoped.filter((a) => a.stage === "contratado");
    const hired = hiredApps.filter((a) => t(a.stage_changed_at) >= since).length;
    const hiredPrev = days ? hiredApps.filter((a) => t(a.stage_changed_at) >= prevSince && t(a.stage_changed_at) < since).length : null;
    const scored = inPeriod.filter((a) => a.ai_score != null);
    const avgAi = scored.length ? Math.round(scored.reduce((s, a) => s + (a.ai_score ?? 0), 0) / scored.length) : null;

    const byJob = new Map<string, number>();
    inPeriod.forEach((a) => byJob.set(a.job_title, (byJob.get(a.job_title) ?? 0) + 1));

    const byStage = new Map<Stage, number>();
    inPeriod.forEach((a) => byStage.set(a.stage, (byStage.get(a.stage) ?? 0) + 1));
    const stages: Datum[] = STAGE_ORDER.filter((s) => byStage.has(s)).map((s) => ({
      label: stageDef(funil === "professor" ? "professor" : "trabalho", s).label,
      value: byStage.get(s) ?? 0,
    }));

    const funnel: FunnelStep[] = [
      "Candidaturas recebidas",
      "Triadas (IA ou equipe)",
      "Convidadas para entrevista",
      funil === "professor" ? "Entrevista / aula-teste" : "Entrevistadas ou agendadas",
      "Contratadas",
    ].map((label, step) => ({ label, value: inPeriod.filter((a) => reach(a) >= step).length }));

    // "Como encontrou": uma vez por pessoa
    const seen = new Set<string>();
    const sources = new Map<string, number>();
    inPeriod.forEach((a) => {
      if (seen.has(a.candidate_id)) return;
      seen.add(a.candidate_id);
      (a.candidates?.sources ?? []).forEach((s) => sources.set(s, (sources.get(s) ?? 0) + 1));
    });

    const openJobs = jobs.filter((j) => j.status === "aberta" && (funil === "todos" || j.category === funil));
    const byArea = new Map<string, number>();
    openJobs.forEach((j) => {
      const k = j.category === "professor" ? (j.discipline ? `Professor ${j.discipline}` : "Professores") : j.department || "Outros";
      byArea.set(k, (byArea.get(k) ?? 0) + 1);
    });
    const withoutCandidates = openJobs.filter((j) => !inPeriod.some((a) => a.job_title === j.title)).length;

    const trend = timeline(inPeriod, periodo);
    return {
      openJobs: openJobs.length,
      withoutCandidates,
      total: inPeriod.length,
      people: seen.size,
      delta: pct(inPeriod.length, prevCount),
      active: active.length,
      hired,
      hiredDelta: pct(hired, hiredPrev),
      avgAi,
      scoredCount: scored.length,
      byJob: top(byJob, 7),
      stages,
      funnel,
      scoreDist: SCORE_BUCKETS.map((b, i) => ({
        label: b.label,
        value: scored.filter((a) => (a.ai_score ?? 0) >= b.min && (i === 0 || (a.ai_score ?? 0) < SCORE_BUCKETS[i - 1].min)).length,
      })),
      sources: top(sources, 7),
      byArea: top(byArea, 7),
      trend,
      topAi: [...active].filter((a) => a.ai_score != null).sort((a, b) => (b.ai_score ?? 0) - (a.ai_score ?? 0)).slice(0, 6),
      topChance: [...active].sort((a, b) => (hireChance(b) ?? 0) - (hireChance(a) ?? 0)).slice(0, 4),
    };
  }, [apps, jobs, funil, periodo, now]);

  const periodLabel = PERIODS.find((p) => p.key === periodo)!.label.toLowerCase();
  const upcoming = interviews.filter((i) => funil === "todos" || !i.application_id || apps.find((a) => a.id === i.application_id)?.pipeline === funil);
  const todayKey = dateKey(new Date(now));
  const today = upcoming.filter((i) => dateKey(new Date(i.starts_at)) === todayKey).length;

  const filters = (
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
      <Segmented<Periodo> label="Período" value={periodo} onChange={setPeriodo} options={PERIODS.map((p) => ({ key: p.key, label: p.short, title: p.label }))} />
    </>
  );

  return (
    <AdminLayout title="Painel de RH" subtitle={`Visão geral do recrutamento · ${periodLabel}`} actions={filters}>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-[132px] animate-pulse rounded-[22px] bg-white" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {!rhReady && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Os dados de candidatos aparecem aqui depois que a migração 0010 for executada no Supabase.
            </p>
          )}

          {/* Indicadores */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <KpiCard
              icon={<Icon name="users" />}
              label="Candidaturas"
              value={nf(view.total)}
              delta={view.delta}
              hint={`${nf(view.people)} pessoa${view.people === 1 ? "" : "s"}`}
              spark={view.trend.map((d) => d.value)}
            />
            <KpiCard
              icon={<Icon name="briefcase" />}
              label="Vagas abertas"
              value={nf(view.openJobs)}
              hint={view.withoutCandidates ? `${view.withoutCandidates} sem candidatura no período` : "todas com candidaturas"}
              tone="gold"
            />
            <KpiCard icon={<Icon name="flag" />} label="Em processo" value={nf(view.active)} hint="agora, sem finalizados" tone="violet" />
            <KpiCard icon={<Icon name="calendar" />} label="Entrevistas" value={nf(upcoming.length)} hint={`próximos 7 dias · ${today} hoje`} tone="violet" />
            <KpiCard icon={<Icon name="check" />} label="Contratações" value={nf(view.hired)} delta={view.hiredDelta} hint="no período" tone="green" />
            <KpiCard
              icon={<Icon name="spark" />}
              label="Score médio da IA"
              value={view.avgAi == null ? "–" : String(view.avgAi)}
              hint={`${nf(view.scoredCount)} avaliada${view.scoredCount === 1 ? "" : "s"}`}
              tone="gold"
            />
          </div>

          {/* Tendência + funil */}
          <div className="grid gap-5 xl:grid-cols-3">
            <Panel title="Candidaturas recebidas" subtitle={periodLabel} className="xl:col-span-2">
              <div className="-mt-1 mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-4xl font-extrabold tracking-tight text-brand-950 tabular-nums">{nf(view.total)}</p>
                <DeltaPill delta={view.delta} />
                {view.delta != null && <span className="text-xs text-brand-500">vs. período anterior</span>}
              </div>
              <AreaChart data={view.trend} unit="candidaturas" unitOne="candidatura" />
            </Panel>
            <Panel title="Funil do processo" subtitle="candidaturas do período por etapa alcançada">
              <Funnel steps={view.funnel} />
              <p className="mt-4 text-xs leading-relaxed text-brand-500">Reprovados contam até a triagem. A taxa ao lado é a conversão em relação à etapa anterior.</p>
            </Panel>
          </div>

          {/* Maior chance */}
          <Panel
            title="Maior chance de contratação"
            subtitle="ativos agora · combina a etapa, o score da IA e a nota da entrevista"
            action={
              <Link href="/admin/candidatos" className={cardLink}>
                Abrir o pipeline →
              </Link>
            }
          >
            {view.topChance.length === 0 ? (
              <p className="text-sm text-brand-500">Ninguém no processo agora.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {view.topChance.map((a) => {
                  const st = stageDef(a.pipeline, a.stage);
                  return (
                    <li key={a.id}>
                      <Link
                        href={`/admin/candidatos/${a.candidate_id}?c=${a.id}`}
                        className="flex h-full flex-col rounded-2xl border border-brand-100 bg-brand-50/40 p-4 transition-colors hover:border-brand-200 hover:bg-white"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <Avatar name={a.candidates?.full_name ?? "?"} size="lg" />
                          <Ring value={hireChance(a) ?? 0} label="Chance de contratação" />
                        </div>
                        <p className="mt-3 truncate font-bold text-brand-950">{a.candidates?.full_name ?? "—"}</p>
                        <p className="truncate text-xs text-brand-500">{a.job_title}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 font-medium text-brand-700 ring-1 ring-brand-100">
                            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} aria-hidden />
                            {st.label}
                          </span>
                          {a.ai_score != null && <span className={`rounded-full px-2 py-0.5 font-bold tabular-nums ${aiScoreTone(a.ai_score)}`}>IA {a.ai_score}</span>}
                          {a.interview_score != null && Number(a.interview_score) > 0 && (
                            <span className="rounded-full bg-white px-2 py-0.5 font-bold tabular-nums text-brand-700 ring-1 ring-brand-100">Entrevista {Number(a.interview_score).toFixed(1).replace(".", ",")}</span>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {/* Distribuições */}
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            <Panel title="Candidaturas por vaga" subtitle={periodLabel}>
              <RankBars data={view.byJob} total={view.total} unit="candidaturas" />
            </Panel>
            <Panel title="Aderência pela IA" subtitle={`score das candidaturas avaliadas, ${periodLabel}`}>
              <RankBars data={view.scoreDist} total={view.scoredCount} unit="candidaturas" empty="Nenhuma candidatura avaliada pela IA no período." />
            </Panel>
            <Panel title="Onde estão as candidaturas" subtitle={`etapa atual, ${periodLabel}`}>
              <RankBars data={view.stages} total={view.total} unit="candidaturas" />
            </Panel>
            <Panel title="Maiores scores da IA" subtitle="ativos agora · perfil x requisitos da vaga">
              <ScoreList rows={view.topAi} />
            </Panel>
            <Panel
              title="Próximas entrevistas"
              subtitle="próximos 7 dias"
              action={
                <Link href="/admin/agenda" className={cardLink}>
                  Agenda →
                </Link>
              }
            >
              {upcoming.length === 0 ? (
                <p className="text-sm text-brand-500">Nenhuma entrevista marcada.</p>
              ) : (
                <ul className="space-y-2">
                  {upcoming.slice(0, 6).map((i) => {
                    const [wd, d, m] = DAY_BADGE.formatToParts(new Date(i.starts_at))
                      .filter((p) => p.type !== "literal")
                      .map((p) => p.value.replace(".", ""));
                    return (
                      <li key={i.id}>
                        <Link
                          href={`/admin/candidatos/${i.candidate_id}${i.application_id ? `?c=${i.application_id}` : ""}`}
                          className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-brand-50"
                        >
                          <span className="grid w-12 shrink-0 place-items-center rounded-xl bg-brand-900 py-1.5 text-white" aria-hidden>
                            <span className="text-[10px] font-semibold uppercase leading-none text-brand-200">{wd}</span>
                            <span className="text-lg font-extrabold leading-tight tabular-nums">{d}</span>
                            <span className="text-[10px] uppercase leading-none text-brand-200">{m}</span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-brand-950">{i.candidates?.full_name ?? "—"}</span>
                            <span className="block truncate text-xs text-brand-500">{i.applications?.job_title ?? "Sem vaga"}</span>
                          </span>
                          <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold tabular-nums text-brand-800">{formatTime(i.starts_at)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
            <Panel title="Como encontraram a vaga" subtitle={`uma vez por pessoa, ${periodLabel}`}>
              <RankBars data={view.sources} total={view.people} unit="pessoas" />
            </Panel>
            <Panel
              title="Vagas abertas por área"
              subtitle="agora"
              className="lg:col-span-2 xl:col-span-3"
              action={
                <Link href="/admin/vagas" className={cardLink}>
                  Gerenciar vagas →
                </Link>
              }
            >
              <RankBars data={view.byArea} empty="Nenhuma vaga aberta." unit="vagas" />
            </Panel>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const NF = new Intl.NumberFormat("pt-BR");
function nf(n: number) {
  return NF.format(n);
}
