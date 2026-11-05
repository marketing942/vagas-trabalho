"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import { googleCalendarLink, type Slot } from "@/lib/rh/agenda";
import { formatLongDay, formatTime } from "@/lib/rh/format";
import { formatWhatsapp } from "@/lib/rh/validate";

interface Props {
  token: string | null;
  days: { date: string; slots: Slot[] }[];
  upcoming: { id: string; starts_at: string; ends_at: string } | null;
  location: string;
  instructions: string;
  mapsUrl: string | null;
  jobs: { id: string; title: string }[];
}

const DAY = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Recife", weekday: "short", day: "2-digit", month: "2-digit" });
const dayLabel = (key: string) => DAY.format(new Date(`${key}T12:00:00-03:00`)).replace(".", "");

/** Escolha de dia e horário da entrevista. */
export default function BookingClient({ token, days, upcoming, location, instructions, mapsUrl, jobs }: Props) {
  const [current, setCurrent] = useState(upcoming);
  const [changing, setChanging] = useState(!upcoming);
  const [day, setDay] = useState(days[0]?.date ?? "");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [jobId, setJobId] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [booked, setBooked] = useState<{ start: string; end: string } | null>(null);
  const [cancelled, setCancelled] = useState(false);

  async function call(body: object) {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/agenda", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) setError(data.message ?? "Não foi possível concluir. Tente de novo.");
      return res.ok && data.ok ? data : null;
    } catch {
      setError("Sem conexão. Confira a sua internet e tente de novo.");
      return null;
    } finally {
      setSending(false);
    }
  }

  async function confirm() {
    if (!slot) return setError("Escolha um horário.");
    if (!token) {
      if (name.trim().split(/\s+/).length < 2) return setError("Escreva seu nome completo.");
      if (whatsapp.replace(/\D/g, "").length < 10) return setError("Informe o WhatsApp com DDD.");
      if (!consent) return setError("É preciso concordar com a Política de Privacidade.");
    }
    const data = await call({ token, start: slot.start, name, whatsapp, jobId: jobId || null, consent });
    if (data) {
      setBooked({ start: data.start, end: data.end });
      setCurrent({ id: "novo", starts_at: data.start, ends_at: data.end });
    }
  }

  async function cancel() {
    if (!window.confirm("Cancelar a sua entrevista?")) return;
    if (await call({ token, action: "cancel" })) {
      setCancelled(true);
      setCurrent(null);
    }
  }

  const mapLink = mapsUrl ? (
    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
      Ver no mapa
    </a>
  ) : null;

  if (booked) {
    return (
      <div className="card p-7 sm:p-10" role="status">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-goodsoft text-good">
          <Icon name="calendar" className="h-7 w-7" />
        </span>
        <h2 className="mt-5 text-3xl font-extrabold text-ink">Entrevista marcada!</h2>
        <p className="mt-3 text-xl font-semibold text-ink">
          {formatLongDay(booked.start)}, às {formatTime(booked.start)}
        </p>
        <p className="mt-2 text-inksoft">{location}</p>
        {instructions && <p className="mt-4 rounded-2xl bg-canvas2 p-4 text-sm text-inksoft">{instructions}</p>}
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href={googleCalendarLink("Entrevista no CPPEM", booked.start, booked.end, location, "Entrevista do processo seletivo do CPPEM Colégio e Cursos.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Salvar no Google Agenda
          </a>
          {mapLink}
        </div>
        {token && (
          <p className="mt-6 text-sm text-inkmuted">Precisa mudar? Abra este mesmo link para remarcar ou cancelar.</p>
        )}
      </div>
    );
  }

  if (current && !changing) {
    return (
      <div className="card p-7 sm:p-10">
        <p className="eyebrow">Sua entrevista</p>
        <p className="mt-3 text-2xl font-extrabold text-ink">
          {formatLongDay(current.starts_at)}, às {formatTime(current.starts_at)}
        </p>
        <p className="mt-2 text-inksoft">{location}</p>
        {error && <p className="mt-4 text-sm font-semibold text-bad">{error}</p>}
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={() => setChanging(true)} className="btn-primary">
            Escolher outro horário
          </button>
          <button type="button" disabled={sending} onClick={cancel} className="btn-secondary">
            Cancelar entrevista
          </button>
          {mapLink}
        </div>
      </div>
    );
  }

  const daySlots = days.find((d) => d.date === day)?.slots ?? [];

  return (
    <div className="space-y-6">
      {cancelled && <p className="card p-5 text-inksoft">Sua entrevista foi cancelada. Se quiser, escolha um novo horário abaixo.</p>}
      {days.length === 0 ? (
        <p className="card p-8 text-center text-inksoft">
          No momento não há horários livres. Fale com o RH do CPPEM pelo WhatsApp para combinar.
        </p>
      ) : (
        <>
          <section className="card p-5 sm:p-7" aria-labelledby="dias">
            <h2 id="dias" className="text-base font-bold text-ink">
              1. Escolha o dia
            </h2>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-labelledby="dias">
              {days.map((d) => (
                <button
                  key={d.date}
                  type="button"
                  role="radio"
                  aria-checked={d.date === day}
                  onClick={() => {
                    setDay(d.date);
                    setSlot(null);
                  }}
                  className={`shrink-0 rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition-colors ${
                    d.date === day ? "border-accent-500 bg-goldfaint text-ink" : "border-line2 bg-surface text-inksoft hover:border-goldline"
                  }`}
                >
                  <span className="capitalize">{dayLabel(d.date)}</span>
                  <span className="block text-xs font-normal text-inkmuted">{d.slots.length} horários</span>
                </button>
              ))}
            </div>
          </section>

          <section className="card p-5 sm:p-7" aria-labelledby="horarios">
            <h2 id="horarios" className="text-base font-bold text-ink">
              2. Escolha o horário <span className="font-normal text-inkmuted">(horário de Caruaru)</span>
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5" role="radiogroup" aria-labelledby="horarios">
              {daySlots.map((s) => (
                <button
                  key={s.start}
                  type="button"
                  role="radio"
                  aria-checked={slot?.start === s.start}
                  onClick={() => setSlot(s)}
                  className={`rounded-xl border py-2.5 text-sm font-bold tabular-nums transition-colors ${
                    slot?.start === s.start ? "border-brand-900 bg-brand-900 text-white" : "border-line2 bg-surface text-ink hover:border-goldline"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          {!token && (
            <section className="card space-y-4 p-5 sm:p-7" aria-labelledby="dados">
              <h2 id="dados" className="text-base font-bold text-ink">
                3. Seus dados
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="label">Nome completo</span>
                  <input className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="block">
                  <span className="label">WhatsApp com DDD</span>
                  <input className="input" type="tel" inputMode="tel" placeholder="(81) 9 9999-9999" value={whatsapp} onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))} />
                </label>
              </div>
              {jobs.length > 0 && (
                <label className="block">
                  <span className="label">Vaga da entrevista (se souber)</span>
                  <select className="input" value={jobId} onChange={(e) => setJobId(e.target.value)}>
                    <option value="">Não sei / outra</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="flex items-start gap-3 text-sm text-inksoft">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[#8a7040]" />
                <span>
                  Concordo com a{" "}
                  <Link href="/privacidade" target="_blank" className="font-semibold text-ink underline">
                    Política de Privacidade
                  </Link>
                  .
                </span>
              </label>
            </section>
          )}

          {error && (
            <p role="alert" className="rounded-2xl border border-bad/40 bg-badsoft p-4 text-sm font-semibold text-bad">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" disabled={sending || !slot} onClick={confirm} className="btn-primary !py-4 text-base disabled:opacity-60">
              {sending ? "Confirmando..." : slot ? `Confirmar ${dayLabel(day)} às ${slot.label}` : "Escolha um horário"}
            </button>
            {current && (
              <button type="button" onClick={() => setChanging(false)} className="btn-secondary">
                Manter o horário atual
              </button>
            )}
          </div>
          <p className="text-sm text-inkmuted">Local: {location}</p>
        </>
      )}
    </div>
  );
}
