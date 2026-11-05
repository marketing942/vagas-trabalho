"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchAll } from "@/lib/rh/fetch-all";
import { AGE_OPTIONS, jobTitles, PIPELINE_LABEL, SOURCE_OPTIONS, stageDelay, STAGES } from "@/lib/rh/constants";
import { feedbackKey } from "@/lib/rh/messages";
import { loadRhSettings } from "@/lib/rh/rh-settings";
import { useOrigin } from "@/lib/use-origin";
import { formatDate, formatTime, hireChance, since } from "@/lib/rh/format";
import { setAppStatus } from "@/lib/rh/status-actions";
import type { AppStatus, Application, Candidate, MessageTemplate, Pipeline, Stage } from "@/lib/types";
import CandidatePreview from "./CandidatePreview";
import MessageDialog from "./MessageDialog";
import RejectDialog from "./RejectDialog";

export type BoardApp = Pick<
  Application,
  | "id"
  | "candidate_id"
  | "job_id"
  | "job_title"
  | "jobs"
  | "pipeline"
  | "stage"
  | "status"
  | "ai_status"
  | "ai_score"
  | "interview_score"
  | "stage_changed_at"
  | "created_at"
  | "booking_token"
> & {
  rec: string | null;
  /** Nota do questionário de cultura (0 a 100) */
  culture: number | null;
  /** Respostas às perguntas eliminatórias */
  screening: { question: string; ok: boolean; job: string }[] | null;
  candidates: Pick<Candidate, "full_name" | "city" | "email" | "whatsapp" | "age_range" | "sources" | "origin" | "resume_path" | "resume_name"> | null;
};

const COLUMNS =
  "id,candidate_id,job_id,job_title,jobs,pipeline,stage,status,ai_status,ai_score,interview_score,stage_changed_at,created_at,booking_token,rec:ai_report->>recomendacao,culture:culture_quiz->score,screening,candidates(full_name,city,email,whatsapp,age_range,sources,origin,resume_path,resume_name)";
const PAGE = 40;
const DAY = 86_400_000;

type Sort = "recentes" | "antigas" | "score" | "chance" | "entrevista" | "parados" | "nome";

interface Filters {
  job: string;
  ai: "" | "85" | "70" | "50" | "baixo" | "sem";
  rec: "" | "avancar" | "talvez" | "nao_avancar";
  entrevista: "" | "com" | "sem" | "7" | "8";
  agenda: "" | "marcada" | "sem";
  cidade: string;
  idade: "" | "jovem" | "18-24" | "25-34" | "35-49" | "50";
  origem: string;
  canal: "" | "site" | "notion" | "admin" | "agenda";
  curriculo: "" | "com" | "sem";
  periodo: "" | "1" | "7" | "30" | "90";
  parado: "" | "prazo" | "3" | "7" | "15" | "30";
  vagas: "" | "varias" | "uma";
  ia: "" | "erro" | "aguardando";
  cultura: "" | "respondido" | "pendente" | "80" | "baixo";
  eliminatorias: "" | "atende" | "nao_atende";
}

const EMPTY: Filters = {
  job: "",
  ai: "",
  rec: "",
  entrevista: "",
  agenda: "",
  cidade: "",
  idade: "",
  origem: "",
  canal: "",
  curriculo: "",
  periodo: "",
  parado: "",
  vagas: "",
  ia: "",
  cultura: "",
  eliminatorias: "",
};

const OPTS: { [K in keyof Filters]?: { label: string; options: [Filters[K], string][] } } = {
  ai: { label: "Score da IA", options: [["", "Qualquer score"], ["85", "85 a 100 · muito aderente"], ["70", "70 a 84 · boa aderência"], ["50", "50 a 69 · parcial"], ["baixo", "Abaixo de 50"], ["sem", "Sem score"]] },
  rec: { label: "Recomendação da IA", options: [["", "Qualquer"], ["avancar", "Avançar"], ["talvez", "Talvez"], ["nao_avancar", "Não avançar"]] },
  entrevista: { label: "Nota da entrevista", options: [["", "Qualquer"], ["com", "Com nota"], ["sem", "Sem nota"], ["7", "7 ou mais"], ["8", "8 ou mais"]] },
  agenda: { label: "Entrevista marcada", options: [["", "Tanto faz"], ["marcada", "Com entrevista marcada"], ["sem", "Sem entrevista marcada"]] },
  idade: { label: "Idade", options: [["", "Qualquer idade"], ["jovem", "16 e 17 (Jovem Aprendiz)"], ["18-24", "18 a 24"], ["25-34", "25 a 34"], ["35-49", "35 a 49"], ["50", "50 ou mais"]] },
  canal: { label: "Entrou por", options: [["", "Qualquer canal"], ["site", "Formulário do site"], ["notion", "Importado do Notion"], ["agenda", "Link de agendamento"], ["admin", "Cadastro manual"]] },
  curriculo: { label: "Currículo", options: [["", "Tanto faz"], ["com", "Com currículo"], ["sem", "Sem currículo"]] },
  periodo: { label: "Candidatura recebida", options: [["", "Qualquer data"], ["1", "Hoje"], ["7", "Últimos 7 dias"], ["30", "Últimos 30 dias"], ["90", "Últimos 90 dias"]] },
  parado: { label: "Parado na etapa", options: [["", "Qualquer tempo"], ["prazo", "Passou do prazo da etapa (atrasado)"], ["3", "Há mais de 3 dias"], ["7", "Há mais de 7 dias"], ["15", "Há mais de 15 dias"], ["30", "Há mais de 30 dias"]] },
  vagas: { label: "Quantidade de vagas", options: [["", "Qualquer"], ["varias", "Escolheu mais de uma vaga"], ["uma", "Uma vaga só"]] },
  cultura: { label: "Questionário de cultura", options: [["", "Tanto faz"], ["respondido", "Respondeu"], ["pendente", "Ainda não respondeu"], ["80", "80 ou mais"], ["baixo", "Abaixo de 60"]] },
  eliminatorias: { label: "Perguntas eliminatórias", options: [["", "Tanto faz"], ["atende", "Atende a todas"], ["nao_atende", "Não atende alguma"]] },
  ia: { label: "Avaliação da IA", options: [["", "Qualquer"], ["erro", "Deu erro (reavaliar na ficha)"], ["aguardando", "Aguardando / avaliando"]] },
};

const ageOf = (range: string | null) => {
  const m = /(\d+)/.exec(range ?? "");
  return m ? Number(m[1]) : null;
};
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Barra de 0 a max com o número na ponta. */
function ScoreBar({ label, value, max, tone, title }: { label: string; value: number; max: number; tone: string; title: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-2" title={title}>
      <span className="w-[52px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-brand-500">{label}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-100" role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={title}>
        <span className={`block h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="w-7 shrink-0 text-right text-xs font-bold tabular-nums text-brand-900">{max === 10 ? value.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : value}</span>
    </div>
  );
}

const aiTone = (s: number) => (s >= 80 ? "bg-emerald-500" : s >= 65 ? "bg-sky-500" : s >= 50 ? "bg-amber-500" : "bg-rose-500");

export default function PipelineBoard({ pipeline, onPipeline }: { pipeline: Pipeline; onPipeline: (p: Pipeline) => void }) {
  const [apps, setApps] = useState<BoardApp[]>([]);
  const [booked, setBooked] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [f, setF] = useState<Filters>(EMPTY);
  const [panel, setPanel] = useState(false);
  const [sort, setSort] = useState<Sort>("recentes");
  const [shown, setShown] = useState<Record<string, number>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<BoardApp | null>(null);
  // Logo depois de reprovar: oferece a devolutiva pronta
  const [msg, setMsg] = useState<{ app: BoardApp; key: string; afterReject?: boolean } | null>(null);
  // Finalistas escolhidos para comparar (2 a 4)
  const [compare, setCompare] = useState<string[]>([]);
  const toggleCompare = (id: string) => {
    setMenuFor(null);
    setCompare((list) => (list.includes(id) ? list.filter((x) => x !== id) : list.length >= 4 ? list : [...list, id]));
  };
  // Prévia do candidato (painel lateral)
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const origin = useOrigin();
  const router = useRouter();
  const [toast, setToast] = useState("");
  const [now] = useState(() => Date.now());
  const [reloadKey, setReloadKey] = useState(0);
  const retried = useRef(false);

  useEffect(() => {
    let alive = true;
    const db = createClient();
    loadRhSettings(db).then((s) => alive && setTemplates(s.message_templates));
    Promise.all([
      fetchAll<BoardApp>((from, to) =>
        db.from("applications").select(COLUMNS).eq("pipeline", pipeline).eq("status", "em_processo").order("created_at", { ascending: false }).range(from, to)
      ),
      db.from("interviews").select("application_id, starts_at").eq("status", "agendada").gte("starts_at", new Date().toISOString()).order("starts_at"),
    ]).then(([{ data, error }, { data: ivs }]) => {
      if (!alive) return;
      setApps(data);
      const map = new Map<string, string>();
      (ivs ?? []).forEach((i) => i.application_id && !map.has(i.application_id) && map.set(i.application_id, i.starts_at));
      setBooked(map);
      setError(error ? "Não foi possível carregar as candidaturas. Confira se as migrações 0010 e 0011 foram executadas no Supabase." : "");
      setLoading(false);

      // A IA avalia sozinha cada candidatura nova. Se alguma ficou presa em "aguardando"
      // (ex.: o servidor caiu no meio), tenta de novo em segundo plano, sem botão.
      if (retried.current) return;
      retried.current = true;
      const stuck = data.filter((a) => a.ai_status === "pendente" && Date.now() - new Date(a.created_at).getTime() > 3 * 60_000).slice(0, 5);
      if (!stuck.length) return;
      Promise.all(
        stuck.map((a) =>
          fetch("/api/admin/avaliar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ applicationId: a.id }) }).catch(() => null)
        )
      ).then(() => alive && setReloadKey((k) => k + 1));
    });
    return () => {
      alive = false;
    };
  }, [pipeline, reloadKey]);

  const allJobs = useMemo(() => Array.from(new Set(apps.flatMap((a) => jobTitles(a)))).sort((a, b) => a.localeCompare(b, "pt-BR")), [apps]);
  const cities = useMemo(
    () => Array.from(new Set(apps.map((a) => a.candidates?.city?.trim()).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [apps]
  );

  const filtered = useMemo(() => {
    const term = norm(search.trim());
    const digits = search.replace(/\D/g, "");
    const list = apps.filter((a) => {
      const c = a.candidates;
      const titles = jobTitles(a);
      const ai = a.ai_score;
      const iv = a.interview_score != null && Number(a.interview_score) > 0 ? Number(a.interview_score) : null;
      const age = ageOf(c?.age_range ?? null);
      if (term) {
        const hay = norm([c?.full_name, c?.email, c?.city, ...titles].filter(Boolean).join(" "));
        const phone = (c?.whatsapp ?? "").replace(/\D/g, "");
        if (!hay.includes(term) && !(digits.length >= 4 && phone.includes(digits))) return false;
      }
      if (f.job && !titles.includes(f.job)) return false;
      if (f.ai === "85" && !(ai != null && ai >= 85)) return false;
      if (f.ai === "70" && !(ai != null && ai >= 70 && ai < 85)) return false;
      if (f.ai === "50" && !(ai != null && ai >= 50 && ai < 70)) return false;
      if (f.ai === "baixo" && !(ai != null && ai < 50)) return false;
      if (f.ai === "sem" && ai != null) return false;
      if (f.rec && a.rec !== f.rec) return false;
      if (f.entrevista === "com" && iv == null) return false;
      if (f.entrevista === "sem" && iv != null) return false;
      if ((f.entrevista === "7" || f.entrevista === "8") && !(iv != null && iv >= Number(f.entrevista))) return false;
      if (f.agenda === "marcada" && !booked.has(a.id)) return false;
      if (f.agenda === "sem" && booked.has(a.id)) return false;
      if (f.cidade && norm(c?.city ?? "") !== norm(f.cidade)) return false;
      if (f.idade) {
        if (age == null) return false;
        const [lo, hi] = f.idade === "jovem" ? [0, 17] : f.idade === "50" ? [50, 200] : f.idade.split("-").map(Number);
        if (age < lo || age > hi) return false;
      }
      if (f.origem && !(c?.sources ?? []).includes(f.origem)) return false;
      if (f.canal && c?.origin !== f.canal) return false;
      if (f.curriculo === "com" && !(c?.resume_path || c?.resume_name)) return false;
      if (f.curriculo === "sem" && (c?.resume_path || c?.resume_name)) return false;
      if (f.periodo && now - new Date(a.created_at).getTime() > Number(f.periodo) * DAY) return false;
      if (f.parado === "prazo" && !stageDelay(a, now).late) return false;
      if (f.parado && f.parado !== "prazo" && now - new Date(a.stage_changed_at).getTime() < Number(f.parado) * DAY) return false;
      if (f.vagas === "varias" && titles.length < 2) return false;
      if (f.vagas === "uma" && titles.length !== 1) return false;
      if (f.ia === "erro" && a.ai_status !== "erro") return false;
      if (f.cultura === "respondido" && a.culture == null) return false;
      if (f.cultura === "pendente" && a.culture != null) return false;
      if (f.cultura === "80" && !(a.culture != null && Number(a.culture) >= 80)) return false;
      if (f.cultura === "baixo" && !(a.culture != null && Number(a.culture) < 60)) return false;
      const miss = (a.screening ?? []).filter((x) => !x.ok);
      if (f.eliminatorias === "atende" && (!a.screening?.length || miss.length)) return false;
      if (f.eliminatorias === "nao_atende" && !miss.length) return false;
      if (f.ia === "aguardando" && !(a.ai_status === "pendente" || a.ai_status === "avaliando")) return false;
      return true;
    });
    const t = (iso: string) => new Date(iso).getTime();
    const by: Record<Sort, (a: BoardApp, b: BoardApp) => number> = {
      recentes: (a, b) => t(b.created_at) - t(a.created_at),
      antigas: (a, b) => t(a.created_at) - t(b.created_at),
      score: (a, b) => (b.ai_score ?? -1) - (a.ai_score ?? -1),
      chance: (a, b) => (hireChance(b) ?? -1) - (hireChance(a) ?? -1),
      entrevista: (a, b) => Number(b.interview_score ?? -1) - Number(a.interview_score ?? -1),
      parados: (a, b) => t(a.stage_changed_at) - t(b.stage_changed_at),
      nome: (a, b) => (a.candidates?.full_name ?? "").localeCompare(b.candidates?.full_name ?? "", "pt-BR"),
    };
    return list.sort(by[sort]);
  }, [apps, booked, search, f, sort, now]);

  const activeFilters = (Object.keys(f) as (keyof Filters)[]).filter((k) => f[k]);
  const chipLabel = (k: keyof Filters) => {
    if (k === "job") return `Vaga: ${f.job}`;
    if (k === "cidade") return `Cidade: ${f.cidade}`;
    if (k === "origem") return `Encontrou por: ${f.origem}`;
    const o = OPTS[k];
    return `${o?.label}: ${o?.options.find(([v]) => v === f[k])?.[1] ?? f[k]}`;
  };

  const say = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 3000);
  };

  async function move(app: BoardApp, stage: Stage) {
    setMenuFor(null);
    if (app.stage === stage) return;
    const before = apps;
    setApps((list) => list.map((a) => (a.id === app.id ? { ...a, stage, stage_changed_at: new Date().toISOString() } : a)));
    const { error } = await createClient().from("applications").update({ stage }).eq("id", app.id);
    if (error) {
      setApps(before);
      say("Não foi possível mover. Tente de novo.");
    }
  }

  async function close(app: BoardApp, status: AppStatus, reason?: string) {
    setMenuFor(null);
    if (status === "reprovado" && !reason) return setRejecting(app);
    if (status === "contratado" && !confirm(`Marcar ${app.candidates?.full_name ?? "esta pessoa"} como contratado(a)? O card vai para Finalizados → Contratados.`)) return;
    const before = apps;
    setApps((list) => list.filter((a) => a.id !== app.id));
    const err = await setAppStatus(createClient(), app.id, status, reason);
    if (err) {
      setApps(before);
      return say(err);
    }
    say(status === "contratado" ? `${app.candidates?.full_name ?? "Candidato"} contratado(a) 🎉` : `${app.candidates?.full_name ?? "Candidato"} reprovado(a): ${reason}`);
    setPreviewId(null);
    if (status === "reprovado" && app.candidates?.whatsapp && templates.length) setMsg({ app, key: feedbackKey(app.stage), afterReject: true });
  }

  function dropTo(target: string) {
    const app = apps.find((a) => a.id === dragId);
    setDragId(null);
    setOver(null);
    if (!app) return;
    if (target === "contratado" || target === "reprovado") close(app, target);
    else move(app, target as Stage);
  }

  const dropProps = (target: string) => ({
    onDragOver: (e: React.DragEvent) => {
      if (!dragId) return;
      e.preventDefault();
      setOver(target);
    },
    onDragLeave: () => setOver((o) => (o === target ? null : o)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      dropTo(target);
    },
  });

  const stages = STAGES[pipeline];
  const selectCls = "input !py-2 text-sm";

  return (
    <div>
      {/* Funil, busca e ordenação */}
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <div className="inline-flex rounded-full border border-brand-100 bg-white p-1 shadow-sm" role="tablist" aria-label="Funil">
          {(Object.keys(PIPELINE_LABEL) as Pipeline[]).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={p === pipeline}
              onClick={() => {
                if (p === pipeline) return;
                setLoading(true);
                setF(EMPTY);
                onPipeline(p);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${p === pipeline ? "bg-brand-900 text-white shadow" : "text-brand-600 hover:bg-brand-50"}`}
            >
              {PIPELINE_LABEL[p]}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar nome, e-mail, WhatsApp, cidade ou vaga"
          aria-label="Buscar candidatos"
          className="input !w-full !py-2 sm:!w-80"
        />
        <select aria-label="Vaga" value={f.job} onChange={(e) => setF({ ...f, job: e.target.value })} className={`${selectCls} !w-auto max-w-[16rem]`}>
          <option value="">Todas as vagas</option>
          {allJobs.map((j) => (
            <option key={j}>{j}</option>
          ))}
        </select>
        <button
          type="button"
          aria-expanded={panel}
          aria-controls="painel-filtros"
          onClick={() => setPanel((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${panel || activeFilters.length ? "border-brand-900 bg-brand-900 text-white" : "border-brand-200 bg-white text-brand-800 hover:bg-brand-50"}`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
            <path d="M3 5h18M6 12h12M10 19h4" />
          </svg>
          Filtros{activeFilters.length ? ` (${activeFilters.length})` : ""}
        </button>
        <select aria-label="Ordenar" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`${selectCls} !w-auto`}>
          <option value="recentes">Mais recentes</option>
          <option value="antigas">Mais antigas</option>
          <option value="score">Maior score da IA</option>
          <option value="chance">Maior chance de contratação</option>
          <option value="entrevista">Maior nota de entrevista</option>
          <option value="parados">Parados há mais tempo</option>
          <option value="nome">Nome (A a Z)</option>
        </select>
        <span className="text-sm text-brand-500" aria-live="polite">
          {filtered.length} de {apps.length} em processo
        </span>
      </div>

      {panel && (
        <div id="painel-filtros" className="mb-3 rounded-[22px] border border-brand-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {(Object.keys(OPTS) as (keyof Filters)[]).map((k) => (
              <label key={k} className="text-xs font-semibold text-brand-600">
                {OPTS[k]!.label}
                <select value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={`${selectCls} mt-1 font-normal`}>
                  {OPTS[k]!.options.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <label className="text-xs font-semibold text-brand-600">
              Cidade
              <select value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} className={`${selectCls} mt-1 font-normal`}>
                <option value="">Qualquer cidade</option>
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-brand-600">
              Como encontrou a vaga
              <select value={f.origem} onChange={(e) => setF({ ...f, origem: e.target.value })} className={`${selectCls} mt-1 font-normal`}>
                <option value="">Qualquer</option>
                {SOURCE_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs text-brand-400">Idades: {AGE_OPTIONS[0].replace(" - Jovem Aprendiz", "")} a {AGE_OPTIONS[AGE_OPTIONS.length - 1]}.</p>
        </div>
      )}

      {activeFilters.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {activeFilters.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setF({ ...f, [k]: "" })}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800 hover:bg-brand-200"
              aria-label={`Remover filtro ${chipLabel(k)}`}
            >
              {chipLabel(k)} <span aria-hidden>×</span>
            </button>
          ))}
          <button type="button" onClick={() => setF(EMPTY)} className="text-xs font-semibold text-brand-600 underline hover:text-brand-950">
            Limpar filtros
          </button>
        </div>
      )}

      {error && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {toast && (
        <p role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-brand-950 px-5 py-2.5 text-sm font-semibold text-white shadow-xl">
          {toast}
        </p>
      )}

      {loading ? (
        <div className="flex gap-4 overflow-hidden" aria-busy>
          {stages.slice(0, 5).map((s) => (
            <div key={s.key} className="h-96 w-72 shrink-0 animate-pulse rounded-[22px] bg-white" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((s) => {
            const items = filtered.filter((a) => a.stage === s.key);
            const limit = shown[s.key] ?? PAGE;
            return (
              <section
                key={s.key}
                aria-label={s.label}
                {...dropProps(s.key)}
                className={`flex w-[19rem] shrink-0 flex-col rounded-[22px] border p-3 transition-colors ${
                  over === s.key ? "border-accent-500 bg-accent-50" : s.side ? "border-brand-100 bg-brand-50/70" : "border-brand-100 bg-[#eef1f8]"
                }`}
              >
                <header className="mb-3 flex items-center justify-between px-1">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-brand-900">
                    <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} aria-hidden />
                    {s.label}
                  </h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-brand-700 shadow-sm">{items.length}</span>
                </header>
                <ul className="space-y-2">
                  {items.slice(0, limit).map((a) => {
                    const titles = jobTitles(a);
                    const iv = a.interview_score != null && Number(a.interview_score) > 0 ? Number(a.interview_score) : null;
                    const when = booked.get(a.id);
                    return (
                      <li
                        key={a.id}
                        draggable
                        onDragStart={(e) => {
                          setDragId(a.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setOver(null);
                        }}
                        className={`group relative rounded-2xl border border-white bg-white p-3.5 shadow-[0_1px_2px_rgba(11,26,64,0.06)] transition-shadow hover:shadow-md ${dragId === a.id ? "opacity-50" : ""} ${compare.includes(a.id) ? "ring-2 ring-accent-400" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewId(a.id)}
                            title="Ver prévia"
                            className="min-w-0 text-left font-semibold leading-snug text-brand-950 hover:underline"
                          >
                            {a.candidates?.full_name ?? "Sem nome"}
                          </button>
                          <button
                            type="button"
                            aria-haspopup="menu"
                            aria-expanded={menuFor === a.id}
                            aria-label={`Ações de ${a.candidates?.full_name ?? "candidato"}`}
                            onClick={() => setMenuFor(menuFor === a.id ? null : a.id)}
                            className="-mr-1 -mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-brand-400 hover:bg-brand-50 hover:text-brand-800"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                              <circle cx="5" cy="12" r="1.8" />
                              <circle cx="12" cy="12" r="1.8" />
                              <circle cx="19" cy="12" r="1.8" />
                            </svg>
                          </button>
                        </div>
                        <ul className="mt-2 flex flex-wrap gap-1" aria-label="Vagas">
                          {titles.slice(0, 2).map((t) => (
                            <li key={t} className="max-w-full truncate rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-700">
                              {t}
                            </li>
                          ))}
                          {titles.length > 2 && (
                            <li className="rounded-md bg-accent-50 px-1.5 py-0.5 text-[11px] font-semibold text-accent-700" title={titles.slice(2).join(", ")}>
                              +{titles.length - 2} vaga{titles.length - 2 > 1 ? "s" : ""}
                            </li>
                          )}
                        </ul>
                        <div className="mt-3 space-y-1.5">
                          {a.ai_score != null ? (
                            <ScoreBar label="IA" value={a.ai_score} max={100} tone={aiTone(a.ai_score)} title={`Score de perfil da IA: ${a.ai_score} de 100`} />
                          ) : (
                            <p className={`text-[11px] font-semibold ${a.ai_status === "erro" ? "text-rose-600" : "text-brand-400"}`}>
                              {a.ai_status === "erro" ? "IA: erro na avaliação (reavalie na ficha)" : a.ai_status === "avaliando" || a.ai_status === "pendente" ? "IA avaliando…" : "Sem avaliação da IA"}
                            </p>
                          )}
                          {a.culture != null && (
                            <ScoreBar label="Cultura" value={Number(a.culture)} max={100} tone="bg-amber-500" title={`Questionário de cultura: ${a.culture} de 100`} />
                          )}
                          {iv != null && <ScoreBar label="Entrev." value={iv} max={10} tone="bg-violet-500" title={`Nota da entrevista: ${iv.toLocaleString("pt-BR")} de 10`} />}
                          {(a.screening ?? []).some((x) => !x.ok) && (
                            <p
                              className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] font-semibold text-rose-700"
                              title={(a.screening ?? []).filter((x) => !x.ok).map((x) => `${x.question} (${x.job})`).join("\n")}
                            >
                              ⚠ Não atende: {(a.screening ?? []).filter((x) => !x.ok).length} pergunta(s) eliminatória(s)
                            </p>
                          )}
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-brand-500">
                          {stageDelay(a, now).late ? (
                            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800" title={`O prazo desta etapa é de ${stageDelay(a, now).sla} dia(s)`}>
                              ⚠ Atrasado · {since(a.stage_changed_at, now).replace("há ", "")}
                            </span>
                          ) : (
                            <span>{since(a.stage_changed_at, now)} nesta etapa</span>
                          )}
                          {a.candidates?.city && <span>· {a.candidates.city}</span>}
                          {when && (
                            <span className="rounded-md bg-violet-50 px-1.5 py-0.5 font-semibold text-violet-700">
                              📅 {formatDate(when).slice(0, 5)} {formatTime(when)}
                            </span>
                          )}
                        </div>
                        {menuFor === a.id && (
                          <ul role="menu" className="absolute right-2 top-10 z-20 w-60 rounded-2xl border border-brand-100 bg-white p-1.5 shadow-xl">
                            <li role="none" className="px-3 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-400">
                              Mover para
                            </li>
                            {stages
                              .filter((o) => o.key !== a.stage)
                              .map((o) => (
                                <li key={o.key} role="none">
                                  <button
                                    role="menuitem"
                                    type="button"
                                    onClick={() => move(a, o.key)}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm text-brand-800 hover:bg-brand-50"
                                  >
                                    <span className={`h-2 w-2 rounded-full ${o.dot}`} aria-hidden /> {o.label}
                                  </button>
                                </li>
                              ))}
                            <li role="separator" className="my-1 h-px bg-brand-100" />
                            <li role="none">
                              <button role="menuitem" type="button" onClick={() => close(a, "contratado")} className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                                ✓ Contratar
                              </button>
                            </li>
                            <li role="none">
                              <button role="menuitem" type="button" onClick={() => close(a, "reprovado")} className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50">
                                ✕ Reprovar…
                              </button>
                            </li>
                            <li role="separator" className="my-1 h-px bg-brand-100" />
                            <li role="none">
                              <button
                                role="menuitem"
                                type="button"
                                disabled={!compare.includes(a.id) && compare.length >= 4}
                                onClick={() => toggleCompare(a.id)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm text-brand-800 hover:bg-brand-50 disabled:opacity-40"
                              >
                                {compare.includes(a.id) ? "Tirar da comparação" : "Adicionar à comparação"}
                              </button>
                            </li>
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {items.length > limit && (
                  <button type="button" onClick={() => setShown((m) => ({ ...m, [s.key]: limit + PAGE }))} className="mt-2 rounded-xl py-2 text-sm font-semibold text-brand-600 hover:bg-white">
                    Mostrar mais ({items.length - limit})
                  </button>
                )}
                {items.length === 0 && <p className="px-1 py-6 text-center text-xs text-brand-400">Ninguém nesta etapa</p>}
              </section>
            );
          })}
        </div>
      )}

      {/* Comparação de finalistas */}
      {compare.length > 0 && !dragId && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center p-4 lg:left-64" role="region" aria-label="Comparação">
          <div className="flex flex-wrap items-center gap-3 rounded-full bg-brand-950 px-4 py-2.5 text-sm text-white shadow-2xl">
            <span>
              <strong>{compare.length}</strong> para comparar
              <span className="ml-2 hidden text-brand-300 sm:inline">
                {compare.map((id) => apps.find((x) => x.id === id)?.candidates?.full_name.split(" ")[0]).filter(Boolean).join(", ")}
              </span>
            </span>
            <button
              type="button"
              disabled={compare.length < 2}
              onClick={() => router.push(`/admin/candidatos/comparar?ids=${compare.join(",")}`)}
              className="rounded-full bg-accent-400 px-4 py-1.5 font-bold text-brand-950 hover:bg-accent-300 disabled:opacity-50"
              title={compare.length < 2 ? "Escolha pelo menos 2 pessoas" : undefined}
            >
              Comparar
            </button>
            <button type="button" onClick={() => setCompare([])} className="rounded-full px-2 py-1 text-brand-200 hover:text-white">
              Limpar
            </button>
          </div>
        </div>
      )}

      {/* Resultado (ganho / perdido): aparece ao arrastar um card */}
      {dragId && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center gap-4 p-4 lg:left-64">
          {(
            [
              ["contratado", "✓ Contratado", "border-emerald-300 bg-emerald-50 text-emerald-800", "border-emerald-500 bg-emerald-100"],
              ["reprovado", "✕ Reprovado", "border-rose-300 bg-rose-50 text-rose-800", "border-rose-500 bg-rose-100"],
            ] as const
          ).map(([key, label, base, hover]) => (
            <div
              key={key}
              {...dropProps(key)}
              className={`grid h-20 w-full max-w-xs place-items-center rounded-[22px] border-2 border-dashed text-base font-bold shadow-xl transition-colors ${base} ${over === key ? hover : ""}`}
            >
              {label}
            </div>
          ))}
        </div>
      )}

      {previewId &&
        (() => {
          const pa = apps.find((x) => x.id === previewId);
          if (!pa) return null;
          return (
            <CandidatePreview
              key={pa.id}
              app={pa}
              interviewAt={booked.get(pa.id)}
              now={now}
              onClose={() => setPreviewId(null)}
              onMove={(stage) => move(pa, stage)}
              onHire={() => close(pa, "contratado")}
              onReject={() => close(pa, "reprovado")}
              onMessage={() => pa.candidates?.whatsapp && setMsg({ app: pa, key: booked.has(pa.id) ? "lembrete" : "convite" })}
            />
          );
        })()}
      {msg && msg.app.candidates && (
        <MessageDialog
          target={{
            candidate: { full_name: msg.app.candidates.full_name, whatsapp: msg.app.candidates.whatsapp },
            app: msg.app,
            origin,
            interviewAt: booked.get(msg.app.id),
          }}
          templates={templates}
          initialKey={msg.key}
          title={msg.afterReject ? `Enviar a devolutiva para ${msg.app.candidates.full_name.split(" ")[0]}?` : undefined}
          subtitle={msg.afterReject ? "Dar retorno a quem participou faz diferença. Ajuste o texto se quiser." : undefined}
          skipLabel={msg.afterReject ? "Agora não" : "Cancelar"}
          onClose={() => setMsg(null)}
          onSent={(k) => {
            setMsg(null);
            say(k.startsWith("devolutiva") ? "Devolutiva registrada" : "Mensagem registrada no histórico");
            if (k === "convite") setReloadKey((n) => n + 1);
          }}
        />
      )}
      {rejecting && (
        <RejectDialog
          name={rejecting.candidates?.full_name ?? ""}
          onCancel={() => setRejecting(null)}
          onConfirm={(reason) => {
            const app = rejecting;
            setRejecting(null);
            close(app, "reprovado", reason);
          }}
        />
      )}
    </div>
  );
}
