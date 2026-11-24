"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/admin/rh/charts";
import { createClient } from "@/lib/supabase/client";
import { fetchAll } from "@/lib/rh/fetch-all";

interface Row {
  kind: "avaliacao" | "copiloto" | "comparacao";
  prompt_tokens: number;
  cache_hit_tokens: number;
  completion_tokens: number;
}
interface Prices {
  ai_price_in: number;
  ai_price_in_cache: number;
  ai_price_out: number;
  ai_usd_brl: number;
}

const DEFAULT_PRICES: Prices = { ai_price_in: 0.14, ai_price_in_cache: 0.0028, ai_price_out: 0.28, ai_usd_brl: 5.5 };
const KINDS: { key: Row["kind"]; label: string; hint: string }[] = [
  { key: "avaliacao", label: "Triagem das candidaturas", hint: "quando o candidato entra e na reavaliação" },
  { key: "copiloto", label: "Análise da entrevista", hint: "botão da ficha" },
  { key: "comparacao", label: "Comparar finalistas", hint: "resumo comparativo" },
];

const NF = new Intl.NumberFormat("pt-BR");
const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: v < 1 ? 4 : 2 }).format(v);
const usd = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: v < 1 ? 4 : 2 }).format(v);
const tokens = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2).replace(".", ",")} mi` : n >= 10_000 ? `${Math.round(n / 1000)} mil` : NF.format(n));

/** Quanto a IA consumiu no período: tokens e custo (US$ e R$), por tipo de uso. */
export default function AiUsagePanel({ days }: { days: number | null }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [prices, setPrices] = useState<Prices>(DEFAULT_PRICES);
  const [missing, setMissing] = useState(false);
  const [draft, setDraft] = useState<Record<keyof Prices, string> | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let alive = true;
    const db = createClient();
    const since = days ? new Date(Date.now() - days * 86_400_000).toISOString() : null;
    Promise.all([
      fetchAll<Row>((from, to) => {
        const q = db.from("ai_usage").select("kind,prompt_tokens,cache_hit_tokens,completion_tokens").order("created_at", { ascending: false });
        return (since ? q.gte("created_at", since) : q).range(from, to);
      }),
      db.from("rh_settings").select("ai_price_in,ai_price_in_cache,ai_price_out,ai_usd_brl").eq("id", 1).maybeSingle(),
    ]).then(([u, s]) => {
      if (!alive) return;
      setMissing(!!u.error);
      setRows(u.error ? [] : u.data);
      if (s.data) setPrices({ ...DEFAULT_PRICES, ...Object.fromEntries(Object.entries(s.data).map(([k, v]) => [k, Number(v)])) } as Prices);
    });
    return () => {
      alive = false;
    };
  }, [days]);

  const cost = (r: Pick<Row, "prompt_tokens" | "cache_hit_tokens" | "completion_tokens">) =>
    ((r.prompt_tokens - r.cache_hit_tokens) * prices.ai_price_in + r.cache_hit_tokens * prices.ai_price_in_cache + r.completion_tokens * prices.ai_price_out) / 1_000_000;

  const sum = useMemo(() => {
    const list = rows ?? [];
    const by = KINDS.map((k) => {
      const mine = list.filter((r) => r.kind === k.key);
      return {
        ...k,
        calls: mine.length,
        tokens: mine.reduce((s, r) => s + r.prompt_tokens + r.completion_tokens, 0),
        usd: mine.reduce((s, r) => s + cost(r), 0),
      };
    });
    return {
      by,
      calls: list.length,
      tokens: by.reduce((s, k) => s + k.tokens, 0),
      usd: by.reduce((s, k) => s + k.usd, 0),
      input: list.reduce((s, r) => s + r.prompt_tokens, 0),
      output: list.reduce((s, r) => s + r.completion_tokens, 0),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, prices]);

  async function save() {
    if (!draft) return;
    const next = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, Number(String(v).replace(",", "."))])) as unknown as Prices;
    if (Object.values(next).some((v) => !Number.isFinite(v) || v < 0) || next.ai_usd_brl <= 0) return setMsg("Confira os números (use ponto ou vírgula).");
    const { error } = await createClient().from("rh_settings").update(next).eq("id", 1);
    if (error) return setMsg("Não foi possível salvar. Rode a migração 0015 no Supabase.");
    setPrices(next);
    setDraft(null);
    setMsg("");
  }

  const evals = sum.by[0];
  const field = (k: keyof Prices, label: string) => (
    <label className="block text-xs font-medium text-stone-600">
      {label}
      <input className="input mt-1" inputMode="decimal" value={draft?.[k] ?? ""} onChange={(e) => setDraft((d) => (d ? { ...d, [k]: e.target.value } : d))} />
    </label>
  );

  return (
    <Panel
      title="Uso da IA"
      subtitle={`tokens e custo da DeepSeek, ${days ? `últimos ${days === 365 ? "12 meses" : `${days} dias`}` : "todo o período"}`}
      action={
        !draft && !missing ? (
          <button
            type="button"
            className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs font-semibold text-brand-800 hover:bg-stone-50"
            onClick={() => setDraft(Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, String(v).replace(".", ",")])) as Record<keyof Prices, string>)}
          >
            Ajustar preços
          </button>
        ) : null
      }
    >
      {!rows ? (
        <p className="text-sm text-stone-500">Carregando...</p>
      ) : missing ? (
        <p className="text-sm text-stone-600">
          O consumo da IA aparece aqui depois que a migração <strong>0015</strong> for executada no Supabase.
        </p>
      ) : (
        <>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-[13px] font-medium text-stone-500">Custo no período</p>
              <p className="mt-1 text-[26px] font-semibold leading-tight tabular-nums text-brand-950">{brl(sum.usd * prices.ai_usd_brl)}</p>
              <p className="text-xs text-stone-500">
                {usd(sum.usd)} · dólar a {brl(prices.ai_usd_brl)}
              </p>
            </div>
            <div>
              <p className="text-[13px] font-medium text-stone-500">Tokens gastos</p>
              <p className="mt-1 text-[26px] font-semibold leading-tight tabular-nums text-brand-950">{tokens(sum.tokens)}</p>
              <p className="text-xs text-stone-500">
                {tokens(sum.input)} de entrada · {tokens(sum.output)} de saída
              </p>
            </div>
            <div>
              <p className="text-[13px] font-medium text-stone-500">Chamadas à IA</p>
              <p className="mt-1 text-[26px] font-semibold leading-tight tabular-nums text-brand-950">{NF.format(sum.calls)}</p>
              <p className="text-xs text-stone-500">todas as respostas pagas, certas ou não</p>
            </div>
            <div>
              <p className="text-[13px] font-medium text-stone-500">Triagem por candidatura</p>
              <p className="mt-1 text-[26px] font-semibold leading-tight tabular-nums text-brand-950">{evals.calls ? brl((evals.usd * prices.ai_usd_brl) / evals.calls) : "–"}</p>
              <p className="text-xs text-stone-500">{evals.calls ? `em média, ${tokens(Math.round(evals.tokens / evals.calls))} tokens` : "sem triagens no período"}</p>
            </div>
          </div>

          <table className="mt-5 w-full text-left text-sm">
            <thead className="text-xs text-stone-500">
              <tr>
                <th className="pb-2 font-medium">Para quê</th>
                <th className="pb-2 text-right font-medium">Chamadas</th>
                <th className="pb-2 text-right font-medium">Tokens</th>
                <th className="pb-2 text-right font-medium">Custo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sum.by.map((k) => (
                <tr key={k.key}>
                  <td className="py-1.5 text-brand-900">
                    {k.label} <span className="hidden text-xs text-stone-500 sm:inline">· {k.hint}</span>
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{NF.format(k.calls)}</td>
                  <td className="py-1.5 text-right tabular-nums">{tokens(k.tokens)}</td>
                  <td className="py-1.5 text-right font-semibold tabular-nums">{brl(k.usd * prices.ai_usd_brl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-stone-500">
            O custo é calculado pelos tokens que a DeepSeek informa em cada resposta e pelos preços abaixo. Só vale a partir de quando a migração 0015 foi executada.
          </p>

          {draft && (
            <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm font-medium text-brand-950">Preços da DeepSeek (US$ por 1 milhão de tokens) e dólar</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {field("ai_price_in", "Entrada")}
                {field("ai_price_in_cache", "Entrada em cache")}
                {field("ai_price_out", "Saída")}
                {field("ai_usd_brl", "Dólar (R$)")}
              </div>
              <p className="mt-2 text-xs text-stone-500">
                Confira os valores atuais em api-docs.deepseek.com/quick_start/pricing. Ao salvar, o histórico é recalculado com os novos preços.
              </p>
              {msg && <p className="mt-2 text-sm text-rose-700">{msg}</p>}
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={save} className="rounded-lg bg-brand-950 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-800">
                  Salvar
                </button>
                <button type="button" onClick={() => (setDraft(null), setMsg(""))} className="rounded-lg border border-stone-300 px-3.5 py-2 text-sm font-semibold text-brand-800 hover:bg-white">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
