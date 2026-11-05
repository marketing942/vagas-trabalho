"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WEEKDAYS } from "@/lib/rh/constants";
import type { AgendaConfig } from "@/lib/types";

/** Disponibilidade para entrevistas (o que aparece no link de agendamento). */
export default function AgendaSettings({ initial, settingsId, onSaved }: { initial: AgendaConfig; settingsId: string; onSaved: (c: AgendaConfig) => void }) {
  const [cfg, setCfg] = useState<AgendaConfig>(initial);
  const [blocked, setBlocked] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const set = <K extends keyof AgendaConfig>(k: K, v: AgendaConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const setRanges = (day: number, ranges: [string, string][]) => set("weekly", { ...cfg.weekly, [String(day)]: ranges });

  async function save() {
    for (const ranges of Object.values(cfg.weekly)) {
      if (ranges.some(([a, b]) => !a || !b || a >= b)) return setMsg("Confira os horários: o fim precisa ser depois do início.");
    }
    setSaving(true);
    const { error } = await createClient().from("site_settings").update({ agenda_config: cfg }).eq("id", settingsId);
    setSaving(false);
    setMsg(error ? "Não foi possível salvar." : "Disponibilidade salva");
    if (!error) onSaved(cfg);
  }

  return (
    <section className="card space-y-5 p-5" aria-labelledby="disp">
      <h2 id="disp" className="font-bold text-brand-950">
        Disponibilidade para entrevistas
      </h2>

      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => {
          const ranges = cfg.weekly[String(d)] ?? [];
          return (
            <div key={d} className="flex flex-wrap items-center gap-2 border-b border-brand-50 pb-3">
              <span className="w-20 text-sm font-semibold text-brand-800">{WEEKDAYS[d]}</span>
              {ranges.length === 0 && <span className="text-sm text-brand-400">Sem entrevistas</span>}
              {ranges.map(([a, b], i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1">
                  <input type="time" aria-label={`${WEEKDAYS[d]}: início`} value={a} onChange={(e) => setRanges(d, ranges.map((r, j) => (j === i ? [e.target.value, r[1]] : r)))} className="rounded border border-brand-200 px-1 text-sm" />
                  <span className="text-brand-500">às</span>
                  <input type="time" aria-label={`${WEEKDAYS[d]}: fim`} value={b} onChange={(e) => setRanges(d, ranges.map((r, j) => (j === i ? [r[0], e.target.value] : r)))} className="rounded border border-brand-200 px-1 text-sm" />
                  <button type="button" aria-label="Remover faixa" onClick={() => setRanges(d, ranges.filter((_, j) => j !== i))} className="px-1 text-brand-500 hover:text-rose-600">
                    ×
                  </button>
                </span>
              ))}
              <button type="button" onClick={() => setRanges(d, [...ranges, ["14:00", "17:00"]])} className="text-xs font-semibold text-brand-600 underline">
                + faixa
              </button>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-medium text-brand-800">
          Duração de cada entrevista
          <select className="input mt-1" value={cfg.slot_minutes} onChange={(e) => set("slot_minutes", Number(e.target.value))}>
            {[15, 20, 30, 40, 45, 60, 90].map((m) => (
              <option key={m} value={m}>
                {m} minutos
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-brand-800">
          Antecedência mínima
          <select className="input mt-1" value={cfg.min_notice_hours} onChange={(e) => set("min_notice_hours", Number(e.target.value))}>
            {[2, 4, 12, 24, 48].map((h) => (
              <option key={h} value={h}>
                {h} horas
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-brand-800">
          Mostrar os próximos
          <select className="input mt-1" value={cfg.horizon_days} onChange={(e) => set("horizon_days", Number(e.target.value))}>
            {[7, 14, 21, 30, 45].map((d) => (
              <option key={d} value={d}>
                {d} dias
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <p className="text-sm font-medium text-brand-800">Dias sem entrevista (feriados, eventos)</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {cfg.blocked_dates.map((d) => (
            <span key={d} className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-sm text-rose-700">
              {d.split("-").reverse().join("/")}
              <button type="button" aria-label={`Liberar ${d}`} onClick={() => set("blocked_dates", cfg.blocked_dates.filter((x) => x !== d))}>
                ×
              </button>
            </span>
          ))}
          <input type="date" aria-label="Data bloqueada" value={blocked} onChange={(e) => setBlocked(e.target.value)} className="rounded-lg border border-brand-200 px-2 py-1 text-sm" />
          <button
            type="button"
            disabled={!blocked}
            onClick={() => {
              if (!cfg.blocked_dates.includes(blocked)) set("blocked_dates", [...cfg.blocked_dates, blocked].sort());
              setBlocked("");
            }}
            className="rounded-lg border border-brand-200 px-3 py-1 text-sm font-semibold text-brand-700 disabled:opacity-50"
          >
            Bloquear dia
          </button>
        </div>
      </div>

      <label className="block text-sm font-medium text-brand-800">
        Local da entrevista
        <input className="input mt-1" value={cfg.location} onChange={(e) => set("location", e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-brand-800">
        Orientações para o candidato
        <textarea rows={2} className="input mt-1" value={cfg.instructions} onChange={(e) => set("instructions", e.target.value)} />
      </label>

      <div className="flex items-center gap-3">
        <button type="button" disabled={saving} onClick={save} className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? "Salvando..." : "Salvar disponibilidade"}
        </button>
        {msg && <span className="text-sm text-brand-700">{msg}</span>}
      </div>
    </section>
  );
}
