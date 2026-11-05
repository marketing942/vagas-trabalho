"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";

interface Q {
  id: string;
  situation: string;
  options: string[];
}

/** Formulário do questionário de cultura (uma situação por bloco, escolha única). */
export default function QuizClient({ token, questions }: { token: string; questions: Q[] }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const answered = Object.keys(answers).length;

  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const missing = questions.find((q) => answers[q.id] == null);
    if (missing) {
      setMessage("Responda todas as situações para enviar.");
      document.getElementById(`q-${missing.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSending(true);
    setMessage("");
    try {
      const res = await fetch("/api/questionario", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, answers }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setDone(true);
      else setMessage(data.message ?? "Não foi possível enviar. Tente de novo.");
    } catch {
      setMessage("Sem conexão. Confira a sua internet e tente de novo.");
    } finally {
      setSending(false);
    }
  }

  if (done)
    return (
      <div className="card p-8 text-center" role="status">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-goodsoft text-good">
          <Icon name="check" className="h-7 w-7" strokeWidth={2.5} />
        </span>
        <h2 ref={doneRef} tabIndex={-1} className="mt-4 text-2xl font-extrabold text-ink outline-none">
          Respostas enviadas!
        </h2>
        <p className="mt-2 text-inksoft">Obrigado. Nossa equipe vai falar com você pelo WhatsApp sobre os próximos passos.</p>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {questions.map((q, i) => (
        <fieldset key={q.id} id={`q-${q.id}`} className="card p-5 sm:p-6">
          <legend className="sr-only">Situação {i + 1}</legend>
          <p className="text-xs font-bold uppercase tracking-wide text-inkmuted">
            Situação {i + 1} de {questions.length}
          </p>
          <p className="mt-1 text-base font-bold leading-snug text-ink sm:text-lg">{q.situation}</p>
          <div className="mt-4 grid gap-2">
            {q.options.map((o, k) => {
              const on = answers[q.id] === k;
              return (
                <label
                  key={k}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-sm transition-colors ${on ? "border-accent-500 bg-goldfaint font-semibold text-ink" : "border-line2 bg-surface text-inksoft hover:border-goldline"}`}
                >
                  <input type="radio" name={q.id} checked={on} onChange={() => setAnswers({ ...answers, [q.id]: k })} className="mt-0.5 h-4 w-4 shrink-0 accent-[#8a7040]" />
                  {o}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      {message && (
        <p role="alert" className="rounded-2xl border border-bad/40 bg-badsoft p-4 text-sm font-semibold text-bad">
          {message}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={sending} className="btn-primary !py-4 text-base">
          {sending ? "Enviando..." : "Enviar respostas"}
        </button>
        <span className="text-sm text-inkmuted" aria-live="polite">
          {answered} de {questions.length} respondidas
        </span>
      </div>
    </form>
  );
}
