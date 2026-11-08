"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Panel } from "@/components/admin/rh/charts";
import { createClient } from "@/lib/supabase/client";
import { cleanScript, cleanTemplates, loadRhSettings } from "@/lib/rh/rh-settings";
import { DEFAULT_INTERVIEW_SCRIPT, DEFAULT_MESSAGE_TEMPLATES, DEFAULT_REJECTION_REASONS, MESSAGE_VARS } from "@/lib/rh/constants";
import type { InterviewScript, MessageTemplate } from "@/lib/types";

const move = <T,>(list: T[], i: number, d: number) => {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

const iconBtn = "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-brand-400 hover:bg-brand-50 hover:text-brand-900 disabled:opacity-30";

/** Configurações do RH: motivos de reprovação e roteiro padrão de entrevista. */
export default function RhConfigPage() {
  const [reasons, setReasons] = useState<string[] | null>(null);
  const [script, setScript] = useState<InterviewScript | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[] | null>(null);
  const [usage, setUsage] = useState<Map<string, number>>(new Map());
  const [ready, setReady] = useState(true);
  const [newReason, setNewReason] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const db = createClient();
    Promise.all([loadRhSettings(db), db.from("applications").select("rejection_reason").eq("status", "reprovado")]).then(([s, { data }]) => {
      setReasons(s.rejection_reasons);
      setScript(s.interview_script);
      setTemplates(s.message_templates);
      setReady(s.ready);
      const m = new Map<string, number>();
      (data ?? []).forEach((r) => r.rejection_reason && m.set(r.rejection_reason, (m.get(r.rejection_reason) ?? 0) + 1));
      setUsage(m);
    });
  }, []);

  const touch = () => {
    setDirty(true);
    setMsg("");
  };
  const editScript = (fn: (s: InterviewScript) => void) => {
    const next = structuredClone(script!);
    fn(next);
    setScript(next);
    touch();
  };

  function addReason() {
    const v = newReason.trim();
    if (!v || reasons!.some((r) => r.toLowerCase() === v.toLowerCase())) return setNewReason("");
    setReasons([...reasons!, v]);
    setNewReason("");
    touch();
  }

  async function save() {
    const cleanReasons = Array.from(new Set(reasons!.map((r) => r.trim()).filter(Boolean)));
    if (!cleanReasons.length) return setMsg("Deixe pelo menos um motivo de reprovação.");
    const cleaned = cleanScript({
      sections: script!.sections
        .map((s) => ({ title: s.title.trim() || "Sem título", questions: s.questions.filter((q) => q.q.trim()).map((q) => ({ q: q.q.trim(), hint: (q.hint ?? "").trim() })) }))
        .filter((s) => s.questions.length),
    });
    setSaving(true);
    const { error } = await createClient()
      .from("rh_settings")
      .upsert({ id: 1, rejection_reasons: cleanReasons, interview_script: cleaned, message_templates: cleanTemplates(templates) });
    setSaving(false);
    if (error) return setMsg("Erro ao salvar. Confira se as migrações 0011 e 0012 foram executadas no Supabase.");
    setReasons(cleanReasons);
    setScript(cleaned);
    setDirty(false);
    setMsg("Configurações do RH salvas ✓");
  }

  const total = script?.sections.reduce((n, s) => n + s.questions.length, 0) ?? 0;

  return (
    <AdminLayout
      title="Configurações do RH"
      subtitle="Motivos de reprovação, roteiro de entrevista e modelos de mensagem"
      actions={
        <>
          <span className="text-sm text-brand-500" aria-live="polite">
            {dirty ? "Alterações não salvas" : msg}
          </span>
          <button type="button" disabled={!dirty || saving || !reasons} onClick={save} className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      <Link href="/admin/configuracoes" className="mb-4 inline-block text-sm font-medium text-brand-500 hover:text-brand-900">
        ← Configurações gerais
      </Link>
      {!ready && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Rode a migração <code>0011_rh_status_vagas_roteiro.sql</code> no Supabase para poder salvar. Por enquanto aparecem os valores padrão.
        </p>
      )}
      {msg && !dirty && msg.startsWith("Erro") && <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{msg}</p>}
      {!reasons || !script || !templates ? (
        <p className="text-brand-500">Carregando...</p>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Panel title="Motivos de reprovação" subtitle="Ao reprovar, a equipe escolhe um destes. A ordem aqui é a ordem da lista.">
            <ul className="space-y-1.5">
              {reasons.map((r, i) => (
                <li key={i} className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white pl-1 pr-1">
                  <input
                    aria-label={`Motivo ${i + 1}`}
                    value={r}
                    onChange={(e) => {
                      const next = [...reasons];
                      next[i] = e.target.value;
                      setReasons(next);
                      touch();
                    }}
                    className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-2 text-sm text-brand-900 outline-none focus:bg-brand-50"
                  />
                  {usage.get(r) ? <span className="shrink-0 text-[11px] text-brand-400">{usage.get(r)} uso{usage.get(r) === 1 ? "" : "s"}</span> : null}
                  <button type="button" className={iconBtn} disabled={i === 0} aria-label="Subir" onClick={() => (setReasons(move(reasons, i, -1)), touch())}>
                    ↑
                  </button>
                  <button type="button" className={iconBtn} disabled={i === reasons.length - 1} aria-label="Descer" onClick={() => (setReasons(move(reasons, i, 1)), touch())}>
                    ↓
                  </button>
                  <button type="button" className={`${iconBtn} hover:!bg-rose-50 hover:!text-rose-700`} aria-label={`Remover ${r}`} onClick={() => (setReasons(reasons.filter((_, k) => k !== i)), touch())}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <input
                className="input !py-2"
                value={newReason}
                placeholder="Novo motivo (ex.: Pretensão salarial)"
                onChange={(e) => setNewReason(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addReason())}
              />
              <button type="button" onClick={addReason} className="shrink-0 rounded-lg border border-brand-200 px-3 text-sm font-semibold text-brand-800 hover:bg-brand-50">
                Adicionar
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-brand-500">
              <span>Remover um motivo não muda quem já foi reprovado com ele.</span>
              <button type="button" onClick={() => confirm("Voltar para a lista padrão de motivos?") && (setReasons(DEFAULT_REJECTION_REASONS), touch())} className="shrink-0 font-semibold underline hover:text-brand-900">
                Lista padrão
              </button>
            </div>
          </Panel>

          <Panel
            title="Roteiro padrão de entrevista"
            subtitle={`${total} perguntas · aparece pronto na ficha de cada candidato, onde pode ser ajustado para a pessoa`}
            action={
              <button
                type="button"
                onClick={() => confirm("Voltar para o roteiro padrão do CPPEM?") && (setScript(DEFAULT_INTERVIEW_SCRIPT), touch())}
                className="text-xs font-semibold text-brand-500 underline hover:text-brand-900"
              >
                Roteiro original
              </button>
            }
          >
            <div className="space-y-5">
              {script.sections.map((sec, si) => (
                <div key={si} className="rounded-lg border border-stone-200 bg-brand-50/40 p-3">
                  <div className="flex items-center gap-1">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-900 text-xs font-bold text-white">{si + 1}</span>
                    <input
                      aria-label={`Título da parte ${si + 1}`}
                      value={sec.title}
                      onChange={(e) => editScript((d) => void (d.sections[si].title = e.target.value))}
                      className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1.5 font-bold text-brand-950 outline-none focus:bg-white"
                    />
                    <button type="button" className={iconBtn} disabled={si === 0} aria-label="Subir parte" onClick={() => editScript((d) => void (d.sections = move(d.sections, si, -1)))}>
                      ↑
                    </button>
                    <button type="button" className={iconBtn} disabled={si === script.sections.length - 1} aria-label="Descer parte" onClick={() => editScript((d) => void (d.sections = move(d.sections, si, 1)))}>
                      ↓
                    </button>
                    <button
                      type="button"
                      className={`${iconBtn} hover:!bg-rose-50 hover:!text-rose-700`}
                      aria-label={`Remover parte ${sec.title}`}
                      onClick={() => confirm(`Remover a parte "${sec.title}" e as perguntas dela?`) && editScript((d) => void d.sections.splice(si, 1))}
                    >
                      ×
                    </button>
                  </div>
                  <ol className="mt-2 space-y-1.5">
                    {sec.questions.map((q, qi) => (
                      <li key={qi} className="flex items-start gap-1 rounded-lg bg-white p-1.5 ring-1 ring-brand-100">
                        <span className="w-8 shrink-0 pt-2 text-center text-xs font-bold tabular-nums text-brand-400">
                          {si + 1}.{qi + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <input
                            aria-label={`Pergunta ${si + 1}.${qi + 1}`}
                            value={q.q}
                            placeholder="Pergunta"
                            onChange={(e) => editScript((d) => void (d.sections[si].questions[qi].q = e.target.value))}
                            className="w-full rounded-lg px-2 py-1.5 text-sm font-semibold text-brand-950 outline-none focus:bg-brand-50"
                          />
                          <input
                            aria-label={`O que a pergunta ${si + 1}.${qi + 1} avalia`}
                            value={q.hint ?? ""}
                            placeholder="O que esta pergunta avalia (opcional)"
                            onChange={(e) => editScript((d) => void (d.sections[si].questions[qi].hint = e.target.value))}
                            className="w-full rounded-lg px-2 py-1 text-xs italic text-brand-500 outline-none focus:bg-brand-50"
                          />
                        </div>
                        <button type="button" className={iconBtn} disabled={qi === 0} aria-label="Subir pergunta" onClick={() => editScript((d) => void (d.sections[si].questions = move(d.sections[si].questions, qi, -1)))}>
                          ↑
                        </button>
                        <button
                          type="button"
                          className={iconBtn}
                          disabled={qi === sec.questions.length - 1}
                          aria-label="Descer pergunta"
                          onClick={() => editScript((d) => void (d.sections[si].questions = move(d.sections[si].questions, qi, 1)))}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className={`${iconBtn} hover:!bg-rose-50 hover:!text-rose-700`}
                          aria-label={`Remover pergunta ${si + 1}.${qi + 1}`}
                          onClick={() => editScript((d) => void d.sections[si].questions.splice(qi, 1))}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ol>
                  <button type="button" onClick={() => editScript((d) => void d.sections[si].questions.push({ q: "", hint: "" }))} className="mt-2 rounded-lg px-2 py-1 text-sm font-semibold text-brand-600 hover:bg-white">
                    + Adicionar pergunta
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => editScript((d) => void d.sections.push({ title: "Nova parte", questions: [{ q: "", hint: "" }] }))}
              className="mt-4 rounded-lg border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              + Nova parte
            </button>
            <p className="mt-3 text-xs text-brand-500">Quem já tem o roteiro salvo na ficha mantém o dele; as mudanças valem para os próximos.</p>
          </Panel>

          <Panel
            title="Modelos de mensagem (WhatsApp)"
            subtitle="Usados no botão WhatsApp da ficha, na devolutiva ao reprovar e no envio em sequência em Finalizados"
            className="xl:col-span-2"
            action={
              <button
                type="button"
                onClick={() => confirm("Voltar para os textos padrão das mensagens?") && (setTemplates(DEFAULT_MESSAGE_TEMPLATES), touch())}
                className="text-xs font-semibold text-brand-500 underline hover:text-brand-900"
              >
                Textos padrão
              </button>
            }
          >
            <p className="mb-3 text-xs text-brand-500">
              Variáveis (trocadas pelos dados da pessoa):{" "}
              {MESSAGE_VARS.map((v) => (
                <code key={v.key} title={v.hint} className="mr-1.5 rounded bg-brand-50 px-1.5 py-0.5 text-[11px] text-brand-800">
                  {`{${v.key}}`}
                </code>
              ))}
            </p>
            <div className="grid gap-3 lg:grid-cols-2">
              {templates.map((t, i) => (
                <div key={t.key} className="rounded-lg border border-stone-200 bg-brand-50/40 p-3">
                  <input
                    aria-label={`Nome do modelo ${i + 1}`}
                    value={t.label}
                    onChange={(e) => {
                      const next = [...templates];
                      next[i] = { ...t, label: e.target.value };
                      setTemplates(next);
                      touch();
                    }}
                    className="w-full rounded-lg bg-transparent px-2 py-1 text-sm font-bold text-brand-950 outline-none focus:bg-white"
                  />
                  <textarea
                    aria-label={`Texto do modelo ${t.label}`}
                    value={t.text}
                    rows={5}
                    onChange={(e) => {
                      const next = [...templates];
                      next[i] = { ...t, text: e.target.value };
                      setTemplates(next);
                      touch();
                    }}
                    className="input mt-1 !bg-white text-sm"
                  />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </AdminLayout>
  );
}
