"use client";

import { useState } from "react";
import { REJECTION_REASONS } from "@/lib/rh/constants";
import type { Pipeline } from "@/lib/types";

/** Pergunta o motivo antes de mover alguém para "Reprovado". */
export default function RejectDialog({
  pipeline,
  name,
  onConfirm,
  onCancel,
}: {
  pipeline: Pipeline;
  name: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState(REJECTION_REASONS[pipeline][0]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brand-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="rej-title" onKeyDown={(e) => e.key === "Escape" && onCancel()}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="rej-title" className="text-lg font-bold text-brand-950">
          Reprovar {name}
        </h2>
        <label htmlFor="rej-reason" className="mt-4 block text-sm font-medium text-brand-800">
          Motivo
        </label>
        <select id="rej-reason" autoFocus className="input mt-1.5" value={reason} onChange={(e) => setReason(e.target.value)}>
          {REJECTION_REASONS[pipeline].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
            Cancelar
          </button>
          <button type="button" onClick={() => onConfirm(reason)} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
            Reprovar
          </button>
        </div>
      </div>
    </div>
  );
}
