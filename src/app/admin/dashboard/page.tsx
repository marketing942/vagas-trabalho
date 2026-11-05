"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { ChartCard, ColumnChart, RankBars, StatTile, type Datum } from "@/components/admin/rh/charts";
import { createClient } from "@/lib/supabase/client";
import { fetchAll } from "@/lib/rh/fetch-all";
import { addDays, dateKey, weekdayOf } from "@/lib/rh/agenda";
import { isActive, PIPELINE_LABEL, stageDef } from "@/lib/rh/constants";
import { aiScoreTone, formatLongDay, formatTime, hireChance } from "@/lib/rh/format";
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

const PERIODS: { key: Periodo; label: string }[] = [
  { key: "30", label: "Últimos 30 dias" },
  { key: "90", label: "Últimos 90 dias" },
  { key: "365", label: "Últimos 12 meses" },
  { key: "tudo", label: "Todo o período" },
];

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

/** Tabela curta de pessoas (maiores scores / maior chance). */
function PersonTable({ rows, metric }: { rows: DashApp[]; metric: "ai" | "chance" }) {
  return (
    rows.length === 0 ? (
      <p className="text-sm text-brand-500">Ninguém no processo agora.</p>
    ) : (
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-brand-500">
          <tr>
            <th className="pb-2 font-semibold">Candidato</th>
            <th className="pb-2 font-semibold">Etapa</th>
            <th className="pb-2 text-right font-semibold">{metric === "ai" ? "Score IA" : "Chance"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-50">
          {rows.map((a) => (
            <tr key={a.id}>
              <td className="py-2 pr-2">
                <Link href={`/admin/candidatos/${a.candidate_id}?c=${a.id}`} className="font-semibold text-brand-950 hover:underline">
                  {a.candidates?.full_name ?? "—"}
                </Link>
                <span className="block truncate text-xs text-brand-500">{a.job_title}</span>
              </td>
              <td className="py-2 pr-2 text-xs text-brand-700">{stageDef(a.pipeline, a.stage).label}</td>
              <td className="py-2 text-right">
                {metric === "ai" ? (
                  <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ${aiScoreTone(a.ai_score)}`}>{a.ai_score}</span>
                ) : (
                  <span className="font-bold tabular-nums text-brand-900">{hireChance(a)}%</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
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
    const scoped = apps.filter((a) => funil === "todos" || a.pipeline === funil);
    const inPeriod = scoped.filter((a) => new Date(a.created_at).getTime() >= since);
    const prev = days ? scoped.filter((a) => {
      const t = new Date(a.created_at).getTime();
      return t >= prevSince && t < since;
    }).length : null;
    const active = scoped.filter((a) => isActive(a.stage));
    const hired = scoped.filter((a) => a.stage === "contratado" && new Date(a.stage_changed_at).getTime() >= since).length;
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

    return {
      openJobs: openJobs.length,
      total: inPeriod.length,
      delta: prev ? ((inPeriod.length - prev) / prev) * 100 : prev === 0 && inPeriod.length ? 100 : null,
      active: active.length,
      hired,
      avgAi,
      byJob: top(byJob, 8),
      stages,
      sources: top(sources, 8),
      byArea: top(byArea, 8),
      trend: timeline(inPeriod, periodo),
      topAi: [...active].filter((a) => a.ai_score != null).sort((a, b) => (b.ai_score ?? 0) - (a.ai_score ?? 0)).slice(0, 8),
      topChance: [...active].sort((a, b) => (hireChance(b) ?? 0) - (hireChance(a) ?? 0)).slice(0, 8),
    };
  }, [apps, jobs, funil, periodo, now]);

  const periodLabel = PERIODS.find((p) => p.key === periodo)!.label.toLowerCase();
  const upcoming = interviews.filter((i) => funil === "todos" || apps.find((a) => a.id === i.application_id)?.pipeline === funil || !i.application_id);

  return (
    <AdminLayout title="Painel de RH">
      {loading ? (
        <p className="text-brand-500">Carregando...</p>
      ) : (
        <div className="space-y-6">
          {/* Filtros: valem para tudo abaixo */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-xl border border-brand-200 bg-white p-1" role="group" aria-label="Funil">
              {(["todos", "trabalho", "professor"] as Funil[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={funil === f}
                  onClick={() => setFunil(f)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${funil === f ? "bg-brand-900 text-white" : "text-brand-700 hover:bg-brand-50"}`}
                >
                  {f === "todos" ? "Todos" : PIPELINE_LABEL[f]}
                </button>
              ))}
            </div>
            <select aria-label="Período" value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)} className="input !w-auto !py-2">
              {PERIODS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {!rhReady && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Os dados de candidatos aparecem aqui depois que a migração 0010 for executada no Supabase.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <StatTile label="Vagas abertas" value={String(view.openJobs)} hint="agora" />
            <StatTile label="Candidaturas" value={String(view.total)} delta={view.delta} hint={periodLabel} />
            <StatTile label="Em processo" value={String(view.active)} hint="agora, sem reprovados e contratados" />
            <StatTile label="Entrevistas" value={String(upcoming.length)} hint="próximos 7 dias" />
            <StatTile label="Contratações" value={String(view.hired)} hint={periodLabel} />
            <StatTile label="Score médio da IA" value={view.avgAi == null ? "–" : String(view.avgAi)} hint={`candidaturas, ${periodLabel}`} />
          </div>

          <ChartCard title="Candidaturas ao longo do tempo" subtitle={periodLabel}>
            <ColumnChart data={view.trend} unit="candidaturas" unitOne="candidatura" />
          </ChartCard>

          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="Candidaturas por vaga" subtitle={periodLabel}>
              <RankBars data={view.byJob} />
            </ChartCard>
            <ChartCard title="Onde estão as candidaturas" subtitle={`etapa atual das candidaturas recebidas, ${periodLabel}`}>
              <RankBars data={view.stages} />
            </ChartCard>
            <ChartCard title="Maior chance de contratação" subtitle="ativos agora · etapa, score da IA e nota da entrevista">
              <PersonTable rows={view.topChance} metric="chance" />
            </ChartCard>
            <ChartCard title="Maiores scores da IA" subtitle="ativos agora · perfil x requisitos da vaga">
              <PersonTable rows={view.topAi} metric="ai" />
            </ChartCard>
            <ChartCard title="Como encontraram a vaga" subtitle={`uma vez por pessoa, ${periodLabel}`}>
              <RankBars data={view.sources} />
            </ChartCard>
            <ChartCard title="Próximas entrevistas" subtitle="próximos 7 dias">
              {upcoming.length === 0 ? (
                <p className="text-sm text-brand-500">Nenhuma entrevista marcada.</p>
              ) : (
                <ul className="divide-y divide-brand-50">
                  {upcoming.slice(0, 8).map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <Link href={`/admin/candidatos/${i.candidate_id}${i.application_id ? `?c=${i.application_id}` : ""}`} className="min-w-0 font-semibold text-brand-950 hover:underline">
                        {i.candidates?.full_name ?? "—"}
                        <span className="block truncate text-xs font-normal text-brand-500">{i.applications?.job_title ?? "Sem vaga"}</span>
                      </Link>
                      <span className="shrink-0 text-right text-xs text-brand-700">
                        {formatLongDay(i.starts_at)}
                        <span className="block font-bold tabular-nums">{formatTime(i.starts_at)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/admin/agenda" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:text-brand-900">
                Abrir a agenda →
              </Link>
            </ChartCard>
            <ChartCard title="Vagas abertas por área" subtitle="agora">
              <RankBars data={view.byArea} empty="Nenhuma vaga aberta." />
            </ChartCard>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
