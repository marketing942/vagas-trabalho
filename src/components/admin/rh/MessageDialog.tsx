"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { whatsappLink } from "@/lib/rh/constants";
import { afterMessageSent } from "@/lib/rh/message-actions";
import { renderMessage, type MessageContext } from "@/lib/rh/messages";
import type { Application, Candidate, MessageTemplate } from "@/lib/types";

export interface MessageTarget extends MessageContext {
  candidate: Pick<Candidate, "full_name" | "whatsapp">;
  app: Pick<Application, "id" | "stage" | "jobs" | "job_id" | "job_title" | "booking_token">;
}

/**
 * Enviar uma mensagem pelo WhatsApp a partir de um modelo: escolhe o modelo, revisa/edita o texto
 * e abre a conversa já escrita. Ao enviar, registra no histórico (e marca convite/devolutiva).
 */
export default function MessageDialog({
  target,
  templates,
  initialKey,
  title,
  subtitle,
  onClose,
  onSent,
  skipLabel = "Cancelar",
  progress,
}: {
  target: MessageTarget;
  templates: MessageTemplate[];
  initialKey: string;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onSent: (key: string) => void;
  skipLabel?: string;
  /** Envio em sequência: "3 de 12" */
  progress?: string;
}) {
  const [key, setKey] = useState(initialKey);
  const tpl = templates.find((t) => t.key === key) ?? templates[0];
  const [text, setText] = useState(() => (tpl ? renderMessage(tpl.text, target) : ""));
  const [busy, setBusy] = useState(false);

  function pick(k: string) {
    setKey(k);
    const t = templates.find((x) => x.key === k);
    if (t) setText(renderMessage(t.text, target));
  }

  async function send() {
    if (!tpl || !text.trim()) return;
    window.open(whatsappLink(target.candidate.whatsapp, text.trim()), "_blank", "noopener");
    setBusy(true);
    await afterMessageSent(createClient(), target.app, tpl);
    setBusy(false);
    onSent(tpl.key);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-brand-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="msg-titulo"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="msg-titulo" className="text-lg font-bold text-brand-950">
              {title ?? `Mensagem para ${target.candidate.full_name.split(" ")[0]}`}
            </h2>
            <p className="mt-0.5 text-sm text-brand-500">{subtitle ?? `${target.candidate.full_name} · ${target.candidate.whatsapp}`}</p>
          </div>
          {progress && <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">{progress}</span>}
        </div>
        <label className="mt-4 block text-xs font-semibold text-brand-700">
          Modelo
          <select value={key} onChange={(e) => pick(e.target.value)} className="input mt-1">
            {templates.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-xs font-semibold text-brand-700">
          Mensagem (pode ajustar antes de enviar)
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} className="input mt-1 text-sm font-normal" />
        </label>
        <p className="mt-2 text-xs text-brand-500">Abre o WhatsApp com o texto pronto. Os modelos ficam em Configurações → RH.</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
            {skipLabel}
          </button>
          <button type="button" disabled={busy || !text.trim()} onClick={send} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
            Abrir no WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
