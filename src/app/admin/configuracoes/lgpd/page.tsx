"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Panel } from "@/components/admin/rh/charts";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/rh/format";

interface Row {
  id: string;
  full_name: string;
  origin: string;
  last_activity: string;
  applications: number;
  has_resume: boolean;
}

const ORIGIN: Record<string, string> = { site: "Site", notion: "Notion", admin: "Cadastro manual", agenda: "Link de agendamento" };

/** Rotina de LGPD: quem passou do prazo de guarda e a ação (anonimizar ou excluir). */
export default function LgpdPage() {
  const [months, setMonths] = useState<number | null>(null);
  const [savedMonths, setSavedMonths] = useState<number | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [ready, setReady] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    const db = createClient();
    (async () => {
      const { data: s, error: e1 } = await db.from("rh_settings").select("retention_months").eq("id", 1).maybeSingle();
      const m = e1 ? 24 : Number(s?.retention_months ?? 24);
      if (!alive) return;
      setMonths((cur) => cur ?? m);
      setSavedMonths(m);
      const { data, error } = await db.rpc("rh_retention_candidates", { p_months: m });
      if (!alive) return;
      setReady(!e1 && !error);
      setRows((data as Row[]) ?? []);
      setSelected(new Set());
    })();
    return () => {
      alive = false;
    };
  }, [reload]);

  const all = useMemo(() => rows?.map((r) => r.id) ?? [], [rows]);
  const say = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 4000);
  };

  async function saveMonths() {
    if (months == null) return;
    const { error } = await createClient().from("rh_settings").update({ retention_months: months }).eq("id", 1);
    if (error) return say("Erro ao salvar o prazo. Confira se a migração 0014 foi executada.");
    say("Prazo salvo");
    setReload((n) => n + 1);
  }

  async function anonymize() {
    const ids = [...selected];
    if (!ids.length || !confirm(`Anonimizar ${ids.length} cadastro(s)? Nome, contatos, textos e currículo são apagados para sempre. Ficam só os dados para estatística (vagas, etapas, resultado e datas).`)) return;
    setBusy(true);
    const db = createClient();
    const { data, error } = await db.rpc("rh_anonymize_candidates", { p_ids: ids });
    if (!error) {
      const paths = ((data as { resume_paths?: string[] })?.resume_paths ?? []).filter(Boolean);
      if (paths.length) await db.storage.from("curriculos").remove(paths);
    }
    setBusy(false);
    if (error) return say("Não foi possível anonimizar. Tente de novo.");
    say(`${(data as { count?: number })?.count ?? 0} cadastro(s) anonimizado(s)`);
    setReload((n) => n + 1);
  }

  async function remove() {
    const ids = [...selected];
    if (!ids.length || !confirm(`Excluir ${ids.length} cadastro(s) de vez, com candidaturas, entrevistas, histórico e currículo? Os números dos relatórios também perdem esses registros.`)) return;
    setBusy(true);
    const db = createClient();
    const { data: files } = await db.from("candidates").select("resume_path").in("id", ids);
    const paths = (files ?? []).map((f) => f.resume_path).filter(Boolean) as string[];
    if (paths.length) await db.storage.from("curriculos").remove(paths);
    const { error } = await db.from("candidates").delete().in("id", ids);
    setBusy(false);
    if (error) return say("Não foi possível excluir. Tente de novo.");
    say(`${ids.length} cadastro(s) excluído(s)`);
    setReload((n) => n + 1);
  }

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <AdminLayout title="Privacidade (LGPD)" subtitle="Prazo de guarda dos dados de candidatos">
      <Link href="/admin/configuracoes" className="mb-4 inline-block text-sm font-medium text-brand-500 hover:text-brand-900">
        ← Configurações gerais
      </Link>
      {!ready && (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Rode a migração <code>0014_rh_lgpd_retencao.sql</code> no Supabase para usar esta página.
        </p>
      )}
      {msg && (
        <p role="status" className="mb-4 rounded-2xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white">
          {msg}
        </p>
      )}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Panel title="Prazo de guarda" subtitle="Para quem não foi contratado e não tem processo em aberto">
          <label className="block text-sm font-medium text-brand-800" htmlFor="prazo">
            Guardar os dados por
          </label>
          <div className="mt-1.5 flex gap-2">
            <select id="prazo" className="input min-w-0 flex-1" value={months ?? 24} onChange={(e) => setMonths(Number(e.target.value))}>
              {[6, 12, 18, 24, 36, 48].map((m) => (
                <option key={m} value={m}>
                  {m} meses{m === 24 ? " (2 anos, o da Política)" : ""}
                </option>
              ))}
            </select>
            <button type="button" disabled={months === savedMonths} onClick={saveMonths} className="shrink-0 rounded-xl bg-brand-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              Salvar
            </button>
          </div>
          <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-brand-700">
            <li>O prazo conta da última movimentação da pessoa (nova candidatura, mudança de etapa, edição).</li>
            <li>
              <strong>Contratados</strong> e quem tem <strong>processo em aberto</strong> nunca entram na lista.
            </li>
            <li>
              <strong>Anonimizar</strong> (recomendado): apaga nome, contatos, textos, currículo e anotações, e mantém só o que serve para os
              relatórios.
            </li>
            <li>
              <strong>Excluir</strong>: apaga tudo, inclusive dos relatórios.
            </li>
            <li>Se o prazo mudar, ajuste também a Política de Privacidade (hoje ela diz 2 anos).</li>
          </ul>
        </Panel>

        <Panel
          title="Passaram do prazo"
          subtitle={rows ? `${rows.length} cadastro(s) sem movimentação há mais de ${savedMonths} meses` : "Carregando..."}
          action={
            rows && rows.length > 0 ? (
              <div className="flex gap-2">
                <button type="button" disabled={!selected.size || busy} onClick={anonymize} className="rounded-xl bg-brand-900 px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  Anonimizar ({selected.size})
                </button>
                <button
                  type="button"
                  disabled={!selected.size || busy}
                  onClick={remove}
                  className="rounded-xl border border-rose-200 px-3.5 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  Excluir ({selected.size})
                </button>
              </div>
            ) : null
          }
        >
          {!rows ? (
            <p className="text-sm text-brand-500">Carregando...</p>
          ) : rows.length === 0 ? (
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">✓ Ninguém passou do prazo de guarda.</p>
          ) : (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-brand-500">
                  <tr>
                    <th className="px-2 pb-2">
                      <input
                        type="checkbox"
                        aria-label="Selecionar todos"
                        checked={selected.size === all.length && all.length > 0}
                        onChange={(e) => setSelected(new Set(e.target.checked ? all : []))}
                      />
                    </th>
                    <th className="px-2 pb-2 font-semibold">Candidato</th>
                    <th className="px-2 pb-2 font-semibold">Origem</th>
                    <th className="px-2 pb-2 font-semibold">Última movimentação</th>
                    <th className="px-2 pb-2 font-semibold">Candidaturas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-2 py-2.5">
                        <input type="checkbox" aria-label={`Selecionar ${r.full_name}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                      </td>
                      <td className="px-2 py-2.5">
                        <Link href={`/admin/candidatos/${r.id}`} className="font-semibold text-brand-950 hover:underline">
                          {r.full_name}
                        </Link>
                        {r.has_resume && <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-[11px] text-brand-600">currículo</span>}
                      </td>
                      <td className="px-2 py-2.5 text-xs text-brand-700">{ORIGIN[r.origin] ?? r.origin}</td>
                      <td className="px-2 py-2.5 text-xs text-brand-700">{formatDate(r.last_activity)}</td>
                      <td className="px-2 py-2.5 text-xs tabular-nums text-brand-700">{r.applications}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </AdminLayout>
  );
}
