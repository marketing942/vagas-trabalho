import type { AgendaConfig } from "@/lib/types";
import { DEFAULT_AGENDA } from "./constants";

/** Caruaru não tem horário de verão: sempre UTC-3. */
export const OFFSET = "-03:00";

export interface Slot {
  /** Início em ISO (UTC) */
  start: string;
  end: string;
  /** "08:30" no horário de Caruaru */
  label: string;
}

export interface Busy {
  starts_at: string;
  ends_at: string;
}

const KEY = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Recife", year: "numeric", month: "2-digit", day: "2-digit" });

/** Data "AAAA-MM-DD" no horário de Caruaru. */
export const dateKey = (d: Date) => KEY.format(d);

/** Data e hora de Caruaru -> Date. */
export const at = (key: string, hhmm: string) => new Date(`${key}T${hhmm}:00${OFFSET}`);

/** Dia da semana (0 = domingo) de uma data "AAAA-MM-DD". */
export const weekdayOf = (key: string) => new Date(`${key}T12:00:00${OFFSET}`).getUTCDay();

export const addDays = (key: string, n: number) => dateKey(new Date(at(key, "12:00").getTime() + n * 86_400_000));

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** Junta a configuração salva com os padrões (campos que faltarem). */
export function agendaConfig(saved: Partial<AgendaConfig> | null | undefined): AgendaConfig {
  return { ...DEFAULT_AGENDA, ...(saved ?? {}) };
}

/** Horários livres de um dia. */
export function slotsForDay(cfg: AgendaConfig, key: string, busy: Busy[], now = new Date()): Slot[] {
  if (cfg.blocked_dates.includes(key)) return [];
  const ranges = cfg.weekly[String(weekdayOf(key))] ?? [];
  const minStart = now.getTime() + cfg.min_notice_hours * 3_600_000;
  const step = Math.max(10, cfg.slot_minutes);
  const taken = busy.map((b) => [new Date(b.starts_at).getTime(), new Date(b.ends_at).getTime()]);
  const out: Slot[] = [];
  for (const [from, to] of ranges) {
    for (let m = toMin(from); m + step <= toMin(to); m += step) {
      const start = at(key, toHHMM(m)).getTime();
      const end = start + step * 60_000;
      if (start < minStart) continue;
      if (taken.some(([s, e]) => start < e && end > s)) continue;
      out.push({ start: new Date(start).toISOString(), end: new Date(end).toISOString(), label: toHHMM(m) });
    }
  }
  return out;
}

/** Próximos dias com pelo menos um horário livre. */
export function availableDays(cfg: AgendaConfig, busy: Busy[], now = new Date()): { date: string; slots: Slot[] }[] {
  const today = dateKey(now);
  const days: { date: string; slots: Slot[] }[] = [];
  for (let i = 0; i <= cfg.horizon_days; i++) {
    const key = addDays(today, i);
    const slots = slotsForDay(cfg, key, busy, now);
    if (slots.length) days.push({ date: key, slots });
  }
  return days;
}

/** O horário escolhido ainda é válido pela configuração? (checagem do servidor) */
export function isOfferedSlot(cfg: AgendaConfig, startIso: string, busy: Busy[], now = new Date()): Slot | null {
  const key = dateKey(new Date(startIso));
  return slotsForDay(cfg, key, busy, now).find((s) => s.start === new Date(startIso).toISOString()) ?? null;
}

/** Link do Google Agenda para a pessoa salvar a entrevista. */
export function googleCalendarLink(title: string, startIso: string, endIso: string, location: string, details: string): string {
  const f = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const p = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${f(startIso)}/${f(endIso)}`, location, details });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
