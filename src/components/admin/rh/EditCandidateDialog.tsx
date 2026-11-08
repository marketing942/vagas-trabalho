"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AGE_OPTIONS } from "@/lib/rh/constants";
import { formatWhatsapp, onlyDigits } from "@/lib/rh/validate";
import type { Candidate } from "@/lib/types";

/** Editar os dados de contato e perfil do candidato. */
export default function EditCandidateDialog({
  candidate,
  onClose,
  onSaved,
}: {
  candidate: Candidate;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    full_name: candidate.full_name,
    email: candidate.email ?? "",
    whatsapp: candidate.whatsapp,
    social_url: candidate.social_url ?? "",
    age_range: candidate.age_range ?? "",
    city: candidate.city ?? "",
    about: candidate.about ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (f.full_name.trim().length < 3) return setError("Informe o nome.");
    if (onlyDigits(f.whatsapp).length < 10) return setError("Informe o WhatsApp com DDD.");
    setSaving(true);
    const { error } = await createClient()
      .from("candidates")
      .update({
        full_name: f.full_name.trim(),
        email: f.email.trim().toLowerCase() || null,
        whatsapp: f.whatsapp.trim(),
        social_url: f.social_url.trim() || null,
        age_range: f.age_range || null,
        city: f.city.trim() || null,
        about: f.about.trim() || null,
      })
      .eq("id", candidate.id);
    setSaving(false);
    if (error) return setError("Não foi possível salvar.");
    onSaved();
  }

  const field = (k: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block text-sm font-medium text-brand-800">
      {label}
      <input className="input mt-1" value={f[k]} onChange={(e) => set(k, e.target.value)} {...props} />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-brand-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-title" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <form onSubmit={save} className="w-full max-w-xl space-y-4 rounded-lg bg-white p-6 shadow-xl">
        <h2 id="edit-title" className="text-lg font-bold text-brand-950">
          Editar dados
        </h2>
        {field("full_name", "Nome completo", { autoFocus: true })}
        <div className="grid gap-4 sm:grid-cols-2">
          {field("email", "E-mail", { type: "email" })}
          <label className="block text-sm font-medium text-brand-800">
            WhatsApp
            <input className="input mt-1" value={f.whatsapp} onChange={(e) => set("whatsapp", formatWhatsapp(e.target.value))} />
          </label>
        </div>
        {field("social_url", "Instagram ou LinkedIn")}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-brand-800">
            Idade
            <select className="input mt-1" value={f.age_range} onChange={(e) => set("age_range", e.target.value)}>
              <option value="">Não informada</option>
              {AGE_OPTIONS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          {field("city", "Cidade")}
        </div>
        <label className="block text-sm font-medium text-brand-800">
          Sobre a pessoa e a experiência
          <textarea rows={6} className="input mt-1" value={f.about} onChange={(e) => set("about", e.target.value)} />
        </label>
        {error && <p className="text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
