"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { addDays, at, dateKey, weekdayOf } from "@/lib/rh/agenda";
import { formatLongDay, formatTime } from "@/lib/rh/format";
import { INTERVIEW_STATUS, setInterviewStatus } from "@/lib/rh/interview-actions";
import type { Interview, InterviewStatus } from "@/lib/types";

type Row = Interview & {
  candidates: { full_name: string; whatsapp: string } | null;
  applications: { job_title: string } | null;
};

const MONTH = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Recife", month: "long", year: "numeric" });
const WEEK_HEAD = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
/** "Novembro de 2026" */
const monthTitle = (key: string) => {
  const s = MONTH.format(at(key, "12:00"));
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Calendário de entrevistas (mês) + lista do dia escolhido. */
export default function AgendaCalendar({ version }: { version: number }) {
  const today = dateKey(new Date());
  const [month, setMonth] = useState(today.slice(0, 7)); // AAAA-MM
  const [selected, setSelected] = useState(today);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  const first = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();

  useEffect(() => {
    let alive = true;
    const from = at(addDays(first, -7), "00:00").toISOString();
    const to = at(addDays(first, daysInMonth + 7), "00:00").toISOString();
    createClient()
      .from("interviews")
      .select("*, candidates(full_name, whatsapp), applications(job_title)")
      .gte("starts_at", from)
      .lt("starts_at", to)
      .order("starts_at")
      .then(({ data }) => {
        if (!alive) return;
        setRows((data as Row[]) ?? []);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [first, daysInMonth, reload, version]);

  const byDay = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      const k = dateKey(new Date(r.starts_at));
      map.set(k, [...(map.get(k) ?? []), r]);
    }
    return map;
  }, [rows]);

  const lead = weekdayOf(first);
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => addDays(first, i))];
  const shift = (n: number) => {
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    setMonth(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  };
  const dayRows = byDay.get(selected) ?? [];

  async function setStatus(r: Row, status: InterviewStatus) {
    await setInterviewStatus(createClient(), r, status);
    setReload((n) => n + 1);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <section className="card p-5" aria-label="Calendário">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => shift(-1)} aria-label="Mês anterior" className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm text-brand-700 hover:bg-brand-50">
            ←
          </button>
          <h2 className="text-lg font-bold text-brand-950">{monthTitle(first)}</h2>
          <button type="button" onClick={() => shift(1)} aria-label="Próximo mês" className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm text-brand-700 hover:bg-brand-50">
            →
          </button>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase text-brand-500">
          {WEEK_HEAD.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((k, i) => {
            if (!k) return <div key={`v${i}`} />;
            const list = (byDay.get(k) ?? []).filter((r) => r.status !== "cancelada");
            const isSel = k === selected;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setSelected(k)}
                aria-pressed={isSel}
                aria-label={`${formatLongDay(at(k, "12:00").toISOString())}: ${list.length} entrevista(s)`}
                className={`flex min-h-[64px] flex-col items-start rounded-lg border p-1.5 text-left transition-colors ${
                  isSel ? "border-brand-900 bg-brand-900 text-white" : k === today ? "border-accent-500 bg-accent-50" : "border-stone-200 hover:bg-brand-50"
                }`}
              >
                <span className="text-sm font-bold">{Number(k.slice(8))}</span>
                {list.length > 0 && (
                  <span className={`mt-auto rounded-md px-1.5 text-[11px] font-bold ${isSel ? "bg-white/20" : "bg-violet-100 text-violet-800"}`}>
                    {list.length} entrev.
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card p-5" aria-labelledby="dia">
        <h2 id="dia" className="font-bold text-brand-950">
          {formatLongDay(at(selected, "12:00").toISOString())}
        </h2>
        {loading ? (
          <p className="mt-3 text-sm text-brand-500">Carregando...</p>
        ) : dayRows.length === 0 ? (
          <p className="mt-3 text-sm text-brand-500">Nenhuma entrevista neste dia.</p>
        ) : (
          <ul className="mt-3 divide-y divide-brand-100">
            {dayRows.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-950">
                      <span className="tabular-nums">{formatTime(r.starts_at)}</span> ·{" "}
                      <Link href={`/admin/candidatos/${r.candidate_id}${r.application_id ? `?c=${r.application_id}` : ""}`} className="hover:underline">
                        {r.candidates?.full_name ?? "Candidato"}
                      </Link>
                    </p>
                    <p className="text-xs text-brand-600">
                      {r.applications?.job_title ?? "Sem vaga"} · {r.created_via === "link" ? "escolhido pelo candidato" : "marcado pela equipe"}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${INTERVIEW_STATUS[r.status].tone}`}>{INTERVIEW_STATUS[r.status].label}</span>
                </div>
                {r.status === "agendada" && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {(["realizada", "faltou", "cancelada"] as const).map((s) => (
                      <button key={s} type="button" onClick={() => setStatus(r, s)} className="rounded-md border border-brand-200 px-2.5 py-1 font-semibold text-brand-700 hover:bg-brand-50">
                        {s === "realizada" ? "Realizada" : s === "faltou" ? "Não compareceu" : "Cancelar"}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
