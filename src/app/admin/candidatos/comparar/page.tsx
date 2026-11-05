"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { Avatar } from "@/components/admin/rh/charts";
import { createClient } from "@/lib/supabase/client";
import { INTERVIEW_CRITERIA, jobTitles, PIPELINE_LABEL, RECOMMENDATION_LABEL, stageDef, STATUS } from "@/lib/rh/constants";
import { cultureBand } from "@/lib/rh/culture-quiz";
import { hireChance } from "@/lib/rh/format";
import type { Application } from "@/lib/types";

type Row = Application & { candidates: { full_name: string; city: string | null; age_range: string | null } | null };
interface Compare {
  resumo: string;
  ordem: { id: string; motivo: string }[];
  cuidados: string[];
  model: string;
}

const num = (v: number | null | undefined) => (v == null ? null : Number(v));

/** Linha da tabela: rótulo + um valor por pessoa, com o maior destacado. */
function MetricRow({ label, values, max, fmt = (v) => String(v) }: { label: string; values: (number | null)[]; max: number; fmt?: (v: number) => string }) {
  const best = Math.max(...values.map((v) => (v == null ? -1 : v)));
  return (
    <tr className="border-t border-brand-50">
      <th scope="row" className="py-2.5 pr-3 text-left text-xs font-semibold text-brand-600">
        {label}
      </th>
      {values.map((v, i) => (
        <td key={i} className="px-3 py-2.5">
          {v == null ? (
            <span className="text-xs text-brand-400">–</span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-brand-100" aria-hidden>
                <span className={`block h-full rounded-full ${v === best && best > 0 ? "bg-emerald-500" : "bg-brand-400"}`} style={{ width: `${(v / max) * 100}%` }} />
              </span>
              <span className={`text-sm tabular-nums ${v === best && best > 0 ? "font-black text-emerald-700" : "font-semibold text-brand-900"}`}>{fmt(v)}</span>
            </span>
          )}
        </td>
      ))}
    </tr>
  );
}

function Comparar() {
  const params = useSearchParams();
  const ids = (params.get("ids") ?? "").split(",").filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 4);
  const key = ids.join(",");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [ai, setAi] = useState<Compare | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const list = key ? key.split(",") : [];
    if (!list.length) return;
    createClient()
      .from("applications")
      .select("*, candidates(full_name, city, age_range)")
      .in("id", list)
      .then(({ data }) => {
        if (!alive) return;
        const got = (data as Row[]) ?? [];
        setRows(list.map((id) => got.find((r) => r.id === id)).filter(Boolean) as Row[]);
      });
    return () => {
      alive = false;
    };
  }, [key]);

  async function askAi() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/comparar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids }) });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!out.ok) return setError(out.error ?? "Não foi possível comparar agora.");
    setAi(out.result);
  }

  if (ids.length < 2) return <p className="card p-8 text-center text-brand-600">Escolha de 2 a 4 pessoas no pipeline (menu ⋯ → Adicionar à comparação).</p>;
  if (!rows) return <p className="text-brand-500">Carregando...</p>;
  const name = (id: string) => rows.find((r) => r.id === id)?.candidates?.full_name ?? "—";

  return (
    <div className="space-y-5">
      <Link href="/admin/candidatos" className="text-sm font-medium text-brand-500 hover:text-brand-900">
        ← Pipeline
      </Link>

      <section className="card overflow-x-auto p-5" aria-label="Comparação">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr>
              <th className="w-40" />
              {rows.map((r) => (
                <th key={r.id} scope="col" className="px-3 pb-3 text-left align-top font-normal">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={r.candidates?.full_name ?? "?"} size="md" />
                    <div className="min-w-0">
                      <Link href={`/admin/candidatos/${r.candidate_id}?c=${r.id}`} className="block truncate font-bold text-brand-950 hover:underline">
                        {r.candidates?.full_name ?? "—"}
                      </Link>
                      <span className="block truncate text-xs text-brand-500">{[r.candidates?.city, r.candidates?.age_range].filter(Boolean).join(" · ")}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-brand-600">
                    {PIPELINE_LABEL[r.pipeline]} · {jobTitles(r).join(", ")}
                  </p>
                  <span className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${STATUS[r.status].tone}`}>
                    {r.status === "em_processo" ? stageDef(r.pipeline, r.stage).label : STATUS[r.status].label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <MetricRow label="Chance de contratação" values={rows.map((r) => hireChance(r))} max={100} fmt={(v) => `${v}%`} />
            <MetricRow label="Score da triagem (IA)" values={rows.map((r) => num(r.ai_score))} max={100} />
            <MetricRow label="Questionário de cultura" values={rows.map((r) => num(r.culture_quiz?.score))} max={100} />
            <MetricRow
              label="Média da entrevista"
              values={rows.map((r) => (num(r.interview_score) ? num(r.interview_score) : null))}
              max={10}
              fmt={(v) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
            />
            {INTERVIEW_CRITERIA.map((c) => (
              <MetricRow key={c.key} label={`· ${c.label}`} values={rows.map((r) => num(r[c.key]))} max={10} />
            ))}
            <tr className="border-t border-brand-50">
              <th scope="row" className="py-2.5 pr-3 text-left text-xs font-semibold text-brand-600">
                Recomendação da IA
              </th>
              {rows.map((r) => (
                <td key={r.id} className="px-3 py-2.5 text-sm font-semibold text-brand-900">
                  {r.ai_report ? RECOMMENDATION_LABEL[r.ai_report.recomendacao] : "–"}
                </td>
              ))}
            </tr>
            <tr className="border-t border-brand-50">
              <th scope="row" className="py-2.5 pr-3 text-left text-xs font-semibold text-brand-600">
                Perguntas eliminatórias
              </th>
              {rows.map((r) => {
                const miss = (r.screening ?? []).filter((x) => !x.ok);
                return (
                  <td key={r.id} className="px-3 py-2.5 text-xs">
                    {!(r.screening ?? []).length ? (
                      <span className="text-brand-400">–</span>
                    ) : miss.length ? (
                      <span className="font-semibold text-rose-700">Não atende: {miss.map((x) => x.question).join("; ")}</span>
                    ) : (
                      <span className="font-semibold text-emerald-700">✓ Atende a todas</span>
                    )}
                  </td>
                );
              })}
            </tr>
            <tr className="border-t border-brand-50 align-top">
              <th scope="row" className="py-2.5 pr-3 text-left text-xs font-semibold text-brand-600">
                Pontos fortes
              </th>
              {rows.map((r) => (
                <td key={r.id} className="px-3 py-2.5 text-xs text-brand-800">
                  <ul className="list-disc space-y-0.5 pl-4">
                    {(r.ai_report?.pontos_fortes ?? []).slice(0, 4).map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
            <tr className="border-t border-brand-50 align-top">
              <th scope="row" className="py-2.5 pr-3 text-left text-xs font-semibold text-brand-600">
                Pontos de atenção
              </th>
              {rows.map((r) => (
                <td key={r.id} className="px-3 py-2.5 text-xs text-brand-800">
                  <ul className="list-disc space-y-0.5 pl-4">
                    {(r.ai_report?.pontos_de_atencao ?? []).slice(0, 4).map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                    {r.culture_quiz && r.culture_quiz.score < 60 && <li>Cultura: {cultureBand(r.culture_quiz.score).label.toLowerCase()}</li>}
                  </ul>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-xs text-brand-500">Em verde, o melhor valor de cada linha. Dê mais peso à entrevista estruturada do que à triagem.</p>
      </section>

      <section className="card p-5" aria-label="Resumo comparativo da IA">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-brand-950">Resumo comparativo da IA</h2>
            <p className="mt-0.5 text-sm text-brand-500">Uma leitura das pessoas lado a lado. A decisão é da equipe.</p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={askAi}
            className="rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-60"
          >
            {busy ? "Comparando..." : ai ? "Comparar de novo" : "Comparar com IA"}
          </button>
        </div>
        {error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        {ai && (
          <div className="mt-4 space-y-4">
            <p className="text-sm leading-relaxed text-brand-800">{ai.resumo}</p>
            <ol className="space-y-2">
              {ai.ordem.map((o, i) => (
                <li key={o.id} className="flex gap-3 rounded-2xl border border-brand-100 p-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-900 text-sm font-black text-white">{i + 1}</span>
                  <span>
                    <span className="block font-semibold text-brand-950">{name(o.id)}</span>
                    <span className="block text-sm text-brand-700">{o.motivo}</span>
                  </span>
                </li>
              ))}
            </ol>
            {ai.cuidados.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-amber-700">Confirmar antes de decidir</h3>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-brand-800">
                  {ai.cuidados.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-xs text-brand-500">Sugestão da IA ({ai.model}). Não é gravada.</p>
          </div>
        )}
      </section>
    </div>
  );
}

/** Comparar finalistas lado a lado. */
export default function CompararPage() {
  return (
    <AdminLayout title="Comparar finalistas" subtitle="Até 4 pessoas lado a lado">
      <Suspense fallback={<p className="text-brand-500">Carregando...</p>}>
        <Comparar />
      </Suspense>
    </AdminLayout>
  );
}
