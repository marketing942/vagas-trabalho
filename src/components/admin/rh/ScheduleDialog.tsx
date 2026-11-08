"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { at } from "@/lib/rh/agenda";
import { formatDateTime } from "@/lib/rh/format";
import { advanceStage, logInterview } from "@/lib/rh/interview-flow";
import type { AgendaConfig, Application, Candidate, Interview } from "@/lib/types";

/** Marcar a entrevista pela equipe (quando o horário foi combinado por fora do link). */
export default function ScheduleDialog({
  candidate,
  app,
  interviews,
  config,
  onClose,
  onDone,
}: {
  candidate: Candidate;
  app: Application;
  interviews: Interview[];
  config: AgendaConfig;
  onClose: () => void;
  onDone: () => void;
}) {
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [minutes, setMinutes] = useState(config.slot_minutes);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setMsg("");
    if (!day || !time) return setMsg("Escolha o dia e o horário.");
    const start = at(day, time);
    const end = new Date(start.getTime() + minutes * 60_000);
    const clash = interviews.some((i) => i.status === "agendada" && start < new Date(i.ends_at) && end > new Date(i.starts_at));
    if (clash && !confirm("Já existe outra entrevista nesse horário. Marcar mesmo assim?")) return;
    setBusy(true);
    const db = createClient();
    const { error } = await db.from("interviews").insert({
      candidate_id: candidate.id,
      application_id: app.id,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      location: config.location,
      created_via: "admin",
    });
    if (error) {
      setBusy(false);
      return setMsg("Não foi possível marcar. Tente de novo.");
    }
    await advanceStage(db, app, "entrevista", ["novo", "visto", "avaliado_ia", "convite"]);
    await logInterview(db, app.id, `Entrevista marcada pela equipe para ${formatDateTime(start.toISOString())}`);
    onDone();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-brand-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agendar-titulo"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 id="agendar-titulo" className="text-lg font-bold text-brand-950">
          Agendar entrevista
        </h2>
        <p className="mt-1 text-sm text-brand-500">
          Com {candidate.full_name.split(" ")[0]}. Para a pessoa escolher sozinha, use WhatsApp → Enviar convite.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="col-span-2 text-xs font-semibold text-brand-700">
            Dia
            <input type="date" autoFocus value={day} onChange={(e) => setDay(e.target.value)} className="input mt-1" />
          </label>
          <label className="text-xs font-semibold text-brand-700">
            Horário (Caruaru)
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
        </div>
        {msg && <p className="mt-3 text-sm text-rose-700">{msg}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
            Cancelar
          </button>
          <button type="button" disabled={busy} onClick={save} className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? "Marcando..." : "Confirmar entrevista"}
          </button>
        </div>
      </div>
    </div>
  );
}
