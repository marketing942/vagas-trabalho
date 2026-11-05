"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { at } from "@/lib/rh/agenda";
import { whatsappLink } from "@/lib/rh/constants";
import { formatDateTime, formatLongDay, formatTime } from "@/lib/rh/format";
import type { AgendaConfig, Application, Candidate, Interview, InterviewStatus } from "@/lib/types";

const STATUS: Record<InterviewStatus, { label: string; tone: string }> = {
  agendada: { label: "Agendada", tone: "bg-violet-100 text-violet-800" },
  realizada: { label: "Realizada", tone: "bg-emerald-100 text-emerald-800" },
  faltou: { label: "Não compareceu", tone: "bg-rose-100 text-rose-800" },
  cancelada: { label: "Cancelada", tone: "bg-brand-100 text-brand-600" },
};

/** Entrevistas da candidatura: convite com link de agendamento, marcação manual e resultado. */
export default function InterviewsBox({
  candidate,
  app,
  interviews,
  config,
  onChanged,
  onReject,
}: {
  candidate: Candidate;
  app: Application;
  interviews: Interview[];
  config: AgendaConfig;
  onChanged: () => void;
  onReject: (reason: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [minutes, setMinutes] = useState(config.slot_minutes);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const link = typeof window === "undefined" ? "" : `${window.location.origin}/agenda?c=${app.booking_token}`;
  const firstName = candidate.full_name.split(" ")[0];
  const invite = `Olá, ${firstName}! Aqui é do RH do CPPEM. Gostamos do seu perfil para a vaga ${app.job_title} e queremos conhecer você. Escolha o melhor dia e horário para a sua entrevista neste link: ${link}`;
  const mine = interviews.filter((i) => i.application_id === app.id || (!i.application_id && i.candidate_id === candidate.id));

  const db = () => createClient();
  const log = (detail: string) => db().from("application_events").insert({ application_id: app.id, kind: "entrevista", actor: "admin", detail });
  // Avança a etapa só para frente (não tira ninguém de etapas mais adiantadas)
  const advance = async (to: "convite" | "entrevista" | "entrevistado", from: string[]) => {
    if (from.includes(app.stage)) await db().from("applications").update({ stage: to, rejection_reason: null }).eq("id", app.id);
  };

  async function sendInvite() {
    window.open(whatsappLink(candidate.whatsapp, invite), "_blank", "noopener");
    await advance("convite", ["novo", "visto", "avaliado_ia"]);
    await log("Convite para agendar a entrevista enviado pelo WhatsApp");
    onChanged();
  }

  async function schedule() {
    setMsg("");
    if (!day || !time) return setMsg("Escolha o dia e o horário.");
    const start = at(day, time);
    const end = new Date(start.getTime() + minutes * 60_000);
    const clash = interviews.some(
      (i) => i.status === "agendada" && start < new Date(i.ends_at) && end > new Date(i.starts_at)
    );
    if (clash && !confirm("Já existe outra entrevista nesse horário. Marcar mesmo assim?")) return;
    setBusy(true);
    const { error } = await db().from("interviews").insert({
      candidate_id: candidate.id,
      application_id: app.id,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      location: config.location,
      created_via: "admin",
    });
    setBusy(false);
    if (error) return setMsg("Não foi possível marcar. Tente de novo.");
    await advance("entrevista", ["novo", "visto", "avaliado_ia", "convite"]);
    await log(`Entrevista marcada pela equipe para ${formatDateTime(start.toISOString())}`);
    setOpen(false);
    onChanged();
  }

  async function setStatus(i: Interview, status: InterviewStatus) {
    await db().from("interviews").update({ status }).eq("id", i.id);
    if (status === "realizada") await advance("entrevistado", ["novo", "visto", "avaliado_ia", "convite", "entrevista"]);
    await log(`Entrevista de ${formatDateTime(i.starts_at)}: ${STATUS[status].label.toLowerCase()}`);
    onChanged();
  }

  return (
    <section className="card p-5" aria-labelledby={`ent-${app.id}`}>
      <h3 id={`ent-${app.id}`} className="font-bold text-brand-950">
        Entrevista
      </h3>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={sendInvite} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          Enviar convite no WhatsApp
        </button>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="rounded-lg border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50"
        >
          {copied ? "Link copiado!" : "Copiar link de agendamento"}
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-lg border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50">
          Marcar horário
        </button>
      </div>
      <p className="mt-2 text-xs text-brand-500">O link é pessoal: a pessoa escolhe um horário livre e a entrevista entra direto na agenda.</p>

      {open && (
        <div className="mt-4 grid gap-3 rounded-xl bg-brand-50 p-4 sm:grid-cols-4">
          <label className="text-xs font-semibold text-brand-700 sm:col-span-2">
            Dia
            <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="input mt-1" />
          </label>
          <label className="text-xs font-semibold text-brand-700">
            Horário
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input mt-1" />
          </label>
          <label className="text-xs font-semibold text-brand-700">
            Duração
            <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="input mt-1">
              {[20, 30, 45, 60, 90].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-3 sm:col-span-4">
            <button type="button" disabled={busy} onClick={schedule} className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {busy ? "Marcando..." : "Confirmar entrevista"}
            </button>
            <span className="text-xs text-brand-500">Horário de Caruaru</span>
            {msg && <span className="text-sm text-rose-700">{msg}</span>}
          </div>
        </div>
      )}

      {mine.length > 0 && (
        <ul className="mt-4 divide-y divide-brand-100">
          {mine.map((i) => (
            <li key={i.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-brand-900">
                  {formatLongDay(i.starts_at)}, {formatTime(i.starts_at)}
                </p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS[i.status].tone}`}>{STATUS[i.status].label}</span>
              </div>
              <p className="text-xs text-brand-500">{i.created_via === "link" ? "Escolhido pelo candidato no link" : "Marcado pela equipe"}</p>
              {i.status === "agendada" && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <button type="button" onClick={() => setStatus(i, "realizada")} className="rounded-md border border-emerald-200 px-2.5 py-1 font-semibold text-emerald-700 hover:bg-emerald-50">
                    Realizada
                  </button>
                  <button type="button" onClick={() => setStatus(i, "faltou")} className="rounded-md border border-rose-200 px-2.5 py-1 font-semibold text-rose-700 hover:bg-rose-50">
                    Não compareceu
                  </button>
                  <button type="button" onClick={() => setStatus(i, "cancelada")} className="rounded-md border border-brand-200 px-2.5 py-1 font-semibold text-brand-600 hover:bg-brand-50">
                    Cancelar
                  </button>
                </div>
              )}
              {i.status === "faltou" && app.stage !== "reprovado" && (
                <button type="button" onClick={() => onReject("Não compareceu na entrevista")} className="mt-2 text-xs font-semibold text-rose-700 underline">
                  Reprovar por não comparecimento
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
