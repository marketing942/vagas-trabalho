"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Icon from "@/components/Icon";
import {
  KpiCard,
  Panel,
  RankBars,
  Segmented,
} from "@/components/admin/rh/charts";
import { createClient } from "@/lib/supabase/client";
import { fetchAll } from "@/lib/rh/fetch-all";
import {
  jobTitles,
  PIPELINE_LABEL,
  STAGE_SLA_DAYS,
  stageDef,
  STAGES,
} from "@/lib/rh/constants";
import type { Application, Pipeline, Stage } from "@/lib/types";

type App = Pick<
  Application,
  | "id"
  | "pipeline"
  | "stage"
  | "status"
  | "jobs"
  | "job_id"
  | "job_title"
  | "created_at"
  | "closed_at"
  | "stage_changed_at"
  | "feedback_sent_at"
> & { candidates: { sources: string[] } | null };
interface Ev {
  application_id: string;
  kind: string;
  to_stage: string | null;
  created_at: string;
}
type Funil = "todos" | Pipeline;
type Periodo = "90" | "180" | "365" | "tudo";

const DAY = 86_400_000;
const NF1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const t = (iso: string) => new Date(iso).getTime();
const INTERVIEW_REACH: Stage[] = [
  "entrevista",
  "entrevistado",
  "onboarding",
  "treinamento",
];
const hired = (a: App) => a.status === "contratado" || a.status === "desligado";
const interviewed = (a: App) => hired(a) || INTERVIEW_REACH.includes(a.stage);
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const avg = (xs: number[]) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : null);

/** Baixa uma tabela em CSV (abre no Excel). */
function downloadCsv(
  name: string,
  header: string[],
  rows: (string | number)[][],
) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv =
    "﻿" + [header, ...rows].map((r) => r.map(esc).join(";")).join("\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const csvBtn =
  "rounded-lg border border-brand-200 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50";

/** Relatórios do RH: tempo por etapa, origem dos contratados, devolutivas e conversão por vaga. */
export default function RelatoriosPage() {
  const [apps, setApps] = useState<App[] | null>(null);
  const [events, setEvents] = useState<Ev[]>([]);
  const [error, setError] = useState("");
  const [funil, setFunil] = useState<Funil>("todos");
  const [periodo, setPeriodo] = useState<Periodo>("180");
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const db = createClient();
    Promise.all([
      fetchAll<App>((from, to) =>
        db
          .from("applications")
          .select(
            "id,pipeline,stage,status,jobs,job_id,job_title,created_at,closed_at,stage_changed_at,feedback_sent_at,candidates(sources)",
          )
          .order("created_at")
          .range(from, to),
      ),
      fetchAll<Ev>((from, to) =>
        db
          .from("application_events")
          .select("application_id,kind,to_stage,created_at")
          .in("kind", ["criada", "etapa", "status"])
          .order("created_at")
          .range(from, to),
      ),
    ]).then(([a, e]) => {
      setApps(a.data);
      setEvents(e.data);
      setError(a.error ? "Não foi possível carregar os dados." : "");
    });
  }, []);

  const r = useMemo(() => {
    if (!apps) return null;
    const since = periodo === "tudo" ? 0 : now - Number(periodo) * DAY;
    const scoped = apps.filter(
      (a) => funil === "todos" || a.pipeline === funil,
    );
    const inPeriod = scoped.filter((a) => t(a.created_at) >= since);
    const ids = new Set(scoped.map((a) => a.id));

    // ---- Tempo em cada etapa: da entrada até a saída (mudança de etapa ou resultado), saídas dentro do período
    const byApp = new Map<string, Ev[]>();
    events.forEach(
      (e) =>
        ids.has(e.application_id) &&
        byApp.set(e.application_id, [
          ...(byApp.get(e.application_id) ?? []),
          e,
        ]),
    );
    const stays = new Map<string, number[]>();
    byApp.forEach((list) => {
      // Etapa em que a pessoa está e desde quando (null = processo encerrado)
      let stage = "novo";
      let since0: number | null = null;
      for (const e of list) {
        const at = t(e.created_at);
        const leaves =
          e.kind === "etapa" ||
          (e.kind === "status" && e.to_stage !== "em_processo");
        if (since0 != null && leaves && at >= since)
          stays.set(stage, [...(stays.get(stage) ?? []), (at - since0) / DAY]);
        if (e.kind === "criada" || e.kind === "etapa") {
          stage = e.to_stage ?? stage;
          since0 = at;
        } else if (e.kind === "status")
          since0 = e.to_stage === "em_processo" ? at : null;
      }
    });
    const pipelineForLabels: Pipeline =
      funil === "professor" ? "professor" : "trabalho";
    const stageOrder = Array.from(
      new Set(
        [
          ...STAGES[pipelineForLabels],
          ...STAGES.professor,
          ...STAGES.trabalho,
        ].map((s) => s.key),
      ),
    );
    const stageTimes = stageOrder
      .filter((k) => stays.has(k))
      .map((k) => {
        const xs = stays.get(k)!;
        return {
          key: k as Stage,
          label: stageDef(pipelineForLabels, k).label,
          avg: avg(xs)!,
          median: median(xs)!,
          n: xs.length,
          sla: STAGE_SLA_DAYS[k as Stage] ?? null,
        };
      });

    // ---- Até contratar
    const hiredInPeriod = scoped.filter(
      (a) => hired(a) && a.closed_at && t(a.closed_at) >= since,
    );
    const toHire = hiredInPeriod.map(
      (a) => (t(a.closed_at!) - t(a.created_at)) / DAY,
    );

    // ---- Origem: candidaturas, entrevistas e contratações por canal (uma pessoa pode marcar vários)
    const src = new Map<
      string,
      { apps: number; interviews: number; hires: number }
    >();
    inPeriod.forEach((a) => {
      const list = a.candidates?.sources?.length
        ? a.candidates.sources
        : ["Não informado"];
      list.forEach((s) => {
        const v = src.get(s) ?? { apps: 0, interviews: 0, hires: 0 };
        v.apps++;
        if (interviewed(a)) v.interviews++;
        if (hired(a)) v.hires++;
        src.set(s, v);
      });
    });
    const sources = [...src.entries()]
      .map(([name, v]) => ({ name, ...v, rate: pct(v.hires, v.apps) }))
      .sort((a, b) => b.hires - a.hires || b.apps - a.apps);

    // ---- Devolutivas (reprovados no período)
    const rejected = scoped.filter(
      (a) => a.status === "reprovado" && a.closed_at && t(a.closed_at) >= since,
    );
    const withFeedback = rejected.filter((a) => a.feedback_sent_at);
    const feedbackDelay = withFeedback.map((a) =>
      Math.max(0, (t(a.feedback_sent_at!) - t(a.closed_at!)) / DAY),
    );

    // ---- Conversão por vaga (cada vaga do card conta)
    const jobs = new Map<
      string,
      { apps: number; interviews: number; hires: number; rejected: number }
    >();
    inPeriod.forEach((a) =>
      jobTitles(a).forEach((j) => {
        const v = jobs.get(j) ?? {
          apps: 0,
          interviews: 0,
          hires: 0,
          rejected: 0,
        };
        v.apps++;
        if (interviewed(a)) v.interviews++;
        if (hired(a)) v.hires++;
        if (a.status === "reprovado") v.rejected++;
        jobs.set(j, v);
      }),
    );
    const byJob = [...jobs.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.apps - a.apps);

    return {
      total: inPeriod.length,
      stageTimes,
      toHireAvg: avg(toHire),
      toHireMedian: median(toHire),
      hires: hiredInPeriod.length,
      sources,
      rejected: rejected.length,
      feedback: withFeedback.length,
      feedbackRate: pct(withFeedback.length, rejected.length),
      feedbackDelay: avg(feedbackDelay),
      byJob,
      bestSource: sources.find((s) => s.hires > 0) ?? null,
    };
  }, [apps, events, funil, periodo, now]);

  const periodLabel = {
    "90": "últimos 90 dias",
    "180": "últimos 6 meses",
    "365": "últimos 12 meses",
    tudo: "todo o período",
  }[periodo];
  const maxAvg = Math.max(1, ...(r?.stageTimes.map((s) => s.avg) ?? [1]));

  return (
    <AdminLayout
      title="Relatórios"
      subtitle={`Como o recrutamento está andando · ${periodLabel}`}
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
              { key: "90", label: "90D" },
              { key: "180", label: "6M" },
              { key: "365", label: "12M" },
              { key: "tudo", label: "Tudo" },
            ]}
          />
        </>
      }
    >
      {error && (
        <p className="mb-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      {!r ? (
        <p className="text-brand-500">Carregando...</p>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={<Icon name="clock" />}
              label="Tempo até contratar"
              value={
                r.toHireAvg == null ? "–" : `${Math.round(r.toHireAvg)} dias`
              }
              hint={
                r.toHireMedian == null
                  ? "sem contratações no período"
                  : `mediana ${Math.round(r.toHireMedian)} dias · ${r.hires} contratação(ões)`
              }
              tone="brand"
            />
            <KpiCard
              icon={<Icon name="star" />}
              label="Melhor origem"
              value={r.bestSource?.name ?? "–"}
              hint={
                r.bestSource
                  ? `${r.bestSource.hires} contratação(ões)`
                  : "sem contratações no período"
              }
              tone="gold"
            />
            <KpiCard
              icon={<Icon name="chat" />}
              label="Taxa de devolutiva"
              value={r.feedbackRate == null ? "–" : `${r.feedbackRate}%`}
              hint={`${r.feedback} de ${r.rejected} reprovados`}
              tone={
                r.feedbackRate != null && r.feedbackRate < 80
                  ? "violet"
                  : "green"
              }
            />
            <KpiCard
              icon={<Icon name="flag" />}
              label="Prazo da devolutiva"
              value={
                r.feedbackDelay == null
                  ? "–"
                  : `${NF1.format(r.feedbackDelay)} dias`
              }
              hint="em média, depois de reprovar"
              tone="brand"
            />
          </div>

          <Panel
            title="Tempo médio em cada etapa"
            subtitle="da entrada até a saída da etapa · a linha mostra o prazo da etapa"
          >
            {r.stageTimes.length === 0 ? (
              <p className="text-sm text-brand-500">
                Ainda não há mudanças de etapa no período.
              </p>
            ) : (
              <ul className="space-y-3">
                {r.stageTimes.map((s) => {
                  const late = s.sla != null && s.avg > s.sla;
                  return (
                    <li key={s.key}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
                        <span className="text-brand-800">{s.label}</span>
                        <span className="tabular-nums">
                          <strong
                            className={
                              late ? "text-amber-700" : "text-brand-950"
                            }
                          >
                            {NF1.format(s.avg)} dias
                          </strong>
                          <span className="ml-1.5 text-xs text-brand-500">
                            mediana {NF1.format(s.median)} · {s.n} passagem(ns)
                            {s.sla != null ? ` · prazo ${s.sla} d` : ""}
                          </span>
                        </span>
                      </div>
                      <div
                        className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-brand-50"
                        aria-hidden
                      >
                        <div
                          className={`h-full rounded-full ${late ? "bg-amber-500" : "bg-brand-500"}`}
                          style={{ width: `${(s.avg / maxAvg) * 100}%` }}
                        />
                        {s.sla != null && (
                          <span
                            className="absolute inset-y-0 w-0.5 bg-brand-950/60"
                            style={{
                              left: `${Math.min(100, (s.sla / maxAvg) * 100)}%`,
                            }}
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-3 text-xs text-brand-500">
              Em laranja, as etapas em que a média passa do prazo. Os prazos
              ficam em STAGE_SLA_DAYS (src/lib/rh/constants.ts).
            </p>
          </Panel>

          <div className="grid gap-5 2xl:grid-cols-2">
            <Panel
              title="Origem dos contratados"
              subtitle="por onde vieram as pessoas contratadas (cada pessoa pode marcar mais de um canal)"
              action={
                <button
                  type="button"
                  className={csvBtn}
                  onClick={() =>
                    downloadCsv(
                      "origem-candidatos.csv",
                      [
                        "Origem",
                        "Candidaturas",
                        "Chegaram à entrevista",
                        "Contratados",
                        "Taxa de contratação (%)",
                      ],
                      r.sources.map((s) => [
                        s.name,
                        s.apps,
                        s.interviews,
                        s.hires,
                        s.rate ?? "",
                      ]),
                    )
                  }
                >
                  Baixar CSV
                </button>
              }
            >
              <RankBars
                data={r.sources
                  .filter((s) => s.hires > 0)
                  .map((s) => ({ label: s.name, value: s.hires }))}
                empty="Nenhuma contratação no período."
                unit="contratações"
              />
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-brand-500">
                    <tr>
                      <th className="pb-2 font-semibold">Origem</th>
                      <th className="pb-2 text-right font-semibold">
                        Candidaturas
                      </th>
                      <th className="pb-2 text-right font-semibold">
                        Entrevistas
                      </th>
                      <th className="pb-2 text-right font-semibold">
                        Contratados
                      </th>
                      <th className="pb-2 text-right font-semibold">Taxa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-50">
                    {r.sources.map((s) => (
                      <tr key={s.name}>
                        <td className="py-1.5 text-brand-800">{s.name}</td>
                        <td className="py-1.5 text-right tabular-nums">
                          {s.apps}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {s.interviews}
                        </td>
                        <td className="py-1.5 text-right font-bold tabular-nums">
                          {s.hires}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-brand-600">
                          {s.rate == null ? "–" : `${s.rate}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel
              title="Conversão por vaga"
              subtitle={`candidaturas recebidas no período (${r.total})`}
              action={
                <button
                  type="button"
                  className={csvBtn}
                  onClick={() =>
                    downloadCsv(
                      "conversao-por-vaga.csv",
                      [
                        "Vaga",
                        "Candidaturas",
                        "Chegaram à entrevista",
                        "Contratados",
                        "Reprovados",
                      ],
                      r.byJob.map((j) => [
                        j.name,
                        j.apps,
                        j.interviews,
                        j.hires,
                        j.rejected,
                      ]),
                    )
                  }
                >
                  Baixar CSV
                </button>
              }
            >
              {r.byJob.length === 0 ? (
                <p className="text-sm text-brand-500">
                  Sem candidaturas no período.
                </p>
              ) : (
                <div className="-mx-2 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-brand-500">
                      <tr>
                        <th className="px-2 pb-2 font-semibold">Vaga</th>
                        <th className="px-2 pb-2 text-right font-semibold">
                          Candidaturas
                        </th>
                        <th className="px-2 pb-2 text-right font-semibold">
                          Entrevistas
                        </th>
                        <th className="px-2 pb-2 text-right font-semibold">
                          Contratados
                        </th>
                        <th className="px-2 pb-2 text-right font-semibold">
                          Conversão
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-50">
                      {r.byJob.map((j) => (
                        <tr key={j.name}>
                          <td
                            className="max-w-[14rem] truncate px-2 py-1.5 text-brand-800"
                            title={j.name}
                          >
                            {j.name}
                          </td>
                          <td className="px-2 py-1.5 text-right tabular-nums">
                            {j.apps}
                          </td>
                          <td className="px-2 py-1.5 text-right tabular-nums">
                            {j.interviews}
                          </td>
                          <td className="px-2 py-1.5 text-right font-bold tabular-nums">
                            {j.hires}
                          </td>
                          <td className="px-2 py-1.5 text-right tabular-nums text-brand-600">
                            {pct(j.hires, j.apps) == null
                              ? "–"
                              : `${pct(j.hires, j.apps)}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
