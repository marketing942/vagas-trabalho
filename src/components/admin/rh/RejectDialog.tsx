"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadRhSettings } from "@/lib/rh/rh-settings";

/** Pede um motivo (da lista configurada pelo RH) antes de reprovar. */
export default function RejectDialog({
  name,
  onConfirm,
  onCancel,
  title,
}: {
  name: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  title?: string;
}) {
  const [reasons, setReasons] = useState<string[] | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    loadRhSettings(createClient()).then((s) => setReasons(s.rejection_reasons));
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-brand-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rej-title"
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 id="rej-title" className="text-lg font-bold text-brand-950">
          {title ?? `Reprovar ${name}`}
        </h2>
        <p className="mt-1 text-sm text-brand-500">O card sai do pipeline e vai para Finalizados → Reprovados.</p>
        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-brand-800">Motivo (obrigatório)</legend>
          {!reasons ? (
            <p className="mt-2 text-sm text-brand-500">Carregando motivos...</p>
          ) : (
            <div className="mt-2 grid max-h-72 gap-1.5 overflow-y-auto">
              {reasons.map((r) => (
                <label
                  key={r}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm ${reason === r ? "border-rose-300 bg-rose-50 font-semibold text-rose-900" : "border-stone-200 text-brand-800 hover:bg-brand-50"}`}
                >
                  <input type="radio" name="motivo" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-rose-600" />
                  {r}
                </label>
              ))}
            </div>
          )}
        </fieldset>
        <p className="mt-3 text-xs text-brand-500">A lista de motivos é editada em Configurações → RH.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!reason}
            onClick={() => onConfirm(reason)}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reprovar
          </button>
        </div>
      </div>
    </div>
  );
}
