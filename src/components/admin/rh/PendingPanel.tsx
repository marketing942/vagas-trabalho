"use client";

import Link from "next/link";
import { stageDef, stageDelay } from "@/lib/rh/constants";
import { formatDate, formatTime } from "@/lib/rh/format";
import type { Application } from "@/lib/types";
import { Panel } from "./charts";

export type PendingApp = Pick<
  Application,
  "id" | "candidate_id" | "pipeline" | "stage" | "status" | "stage_changed_at" | "closed_at" | "feedback_sent_at" | "ai_status"
> & { candidates: { full_name: string } | null };

export interface PastInterview {
  id: string;
  candidate_id: string;
  application_id: string | null;
  starts_at: string;
  candidates: { full_name: string } | null;
}

interface Item {
  key: string;
  href: string;
  name: string;
  detail: string;
}

const DAY = 86_400_000;

/**
 * Central de pendências: o que precisa de alguém agora.
 * Atrasados por etapa, entrevistas sem resultado, reprovados recentes sem devolutiva e erros da IA.
 */
export default function PendingPanel({ apps, past, now, lgpd = 0 }: { apps: PendingApp[]; past: PastInterview[]; now: number; lgpd?: number }) {
  const ficha = (cid: string, aid?: string | null) => `/admin/candidatos/${cid}${aid ? `?c=${aid}` : ""}`;
  const name = (a: { candidates: { full_name: string } | null }) => a.candidates?.full_name ?? "Sem nome";

  const late: Item[] = apps
    .filter((a) => a.status === "em_processo" && stageDelay(a, now).late)
    .sort((a, b) => a.stage_changed_at.localeCompare(b.stage_changed_at))
    .map((a) => ({ key: a.id, href: ficha(a.candidate_id, a.id), name: name(a), detail: `${stageDef(a.pipeline, a.stage).label} · há ${stageDelay(a, now).days} dias` }));
  const noResult: Item[] = past.map((i) => ({
    key: i.id,
    href: ficha(i.candidate_id, i.application_id),
    name: name(i),
    detail: `Entrevista de ${formatDate(i.starts_at).slice(0, 5)} às ${formatTime(i.starts_at)}`,
  }));
  const noFeedback: Item[] = apps
    .filter((a) => a.status === "reprovado" && !a.feedback_sent_at && a.closed_at && now - new Date(a.closed_at).getTime() < 30 * DAY)
    .map((a) => ({ key: a.id, href: ficha(a.candidate_id, a.id), name: name(a), detail: `Reprovado(a) em ${formatDate(a.closed_at!)}` }));
  const aiError: Item[] = apps
    .filter((a) => a.status === "em_processo" && a.ai_status === "erro")
    .map((a) => ({ key: a.id, href: ficha(a.candidate_id, a.id), name: name(a), detail: "Reavalie na ficha" }));

  const groups = [
    { title: "Atrasados no pipeline", hint: "passaram do prazo da etapa", items: late },
    { title: "Entrevistas sem resultado", hint: "marque realizada ou não compareceu", items: noResult },
    { title: "Sem devolutiva", hint: "reprovados nos últimos 30 dias", items: noFeedback },
    { title: "Erro na avaliação da IA", hint: "não receberam score", items: aiError },
  ];
  const total = groups.reduce((n, g) => n + g.items.length, 0) + (lgpd ? 1 : 0);

  return (
    <Panel
      title="Pendências"
      subtitle={total ? `${total} ${total === 1 ? "item precisa" : "itens precisam"} de atenção` : "Nada pendente"}
      action={
        <Link href="/admin/candidatos/finalizados" className="text-[13px] font-semibold text-brand-600 hover:text-brand-950">
          Devolutivas em Finalizados →
        </Link>
      }
    >
      {total === 0 ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">✓ Tudo em dia: ninguém atrasado, sem entrevistas pendentes e devolutivas enviadas.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {groups.map((g) => (
            <section key={g.title} aria-label={g.title} className="rounded-lg border border-stone-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-brand-950">{g.title}</h3>
                <span className={`rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${g.items.length ? "bg-amber-100 text-amber-900" : "bg-stone-100 text-stone-500"}`}>{g.items.length}</span>
              </div>
              <p className="text-xs text-brand-500">{g.hint}</p>
              {g.items.length === 0 ? (
                <p className="mt-2 text-xs font-semibold text-emerald-700">✓ Em dia</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {g.items.slice(0, 4).map((it) => (
                    <li key={it.key}>
                      <Link href={it.href} className="block rounded-lg px-2 py-1.5 hover:bg-brand-50">
                        <span className="block truncate text-sm font-semibold text-brand-900">{it.name}</span>
                        <span className="block truncate text-xs text-brand-500">{it.detail}</span>
                      </Link>
                    </li>
                  ))}
                  {g.items.length > 4 && <li className="px-2 text-xs text-brand-500">+ {g.items.length - 4} outros</li>}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
      {lgpd > 0 && (
        <Link
          href="/admin/configuracoes/lgpd"
          className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-brand-50/60 px-4 py-3 text-sm hover:bg-brand-50"
        >
          <span className="text-brand-800">
            <strong>LGPD:</strong> {lgpd} cadastro{lgpd === 1 ? "" : "s"} passaram do prazo de guarda dos dados.
          </span>
          <span className="shrink-0 font-semibold text-brand-700">Revisar →</span>
        </Link>
      )}
    </Panel>
  );
}
