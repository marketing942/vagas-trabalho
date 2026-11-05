/**
 * Importação dos bancos de candidatos exportados do Notion (CSV).
 * Tudo aqui é cálculo puro: o arquivo é lido no navegador do admin e gravado
 * direto no Supabase. Nenhum dado pessoal passa pelo código do site.
 */
import { TALENT_POOL } from "./constants";
import { formatWhatsapp, onlyDigits } from "./validate";
import type { Pipeline, Stage } from "@/lib/types";

/** Lê CSV (aspas, quebras de linha dentro de campos, BOM). */
export function parseCsv(text: string): Record<string, string>[] {
  const src = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows.filter((r) => r.some((v) => v.trim()));
  if (!header) return [];
  const keys = header.map((h) => h.trim());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

const COL = {
  nome: "Seu nome completo",
  status: "Status de participação",
  vaga: "Qual vaga você quer se candidatar?",
  score: "Score de Perfil - IA",
  email: "Seu melhor email",
  whatsapp: "Seu WhatsApp com o DDD",
  social: "Link do seu Instagram ou linkedin",
  idade: "Sua idade",
  cidade: "Cidade que você mora atualmente",
  curriculo: "Envie seu currículo (Se houver)",
  data: "Horário do envio",
  origem: "Como encontrou essa vaga?",
  fit: "Fit Cultural (0 a 10)",
  proatividade: "Proatividade (0 a 10)",
  comunicacao: "Comunicação (0 a 10)",
  resiliencia: "Resiliência (0 a 10)",
  tecnica: "Técnica (0 a 10)",
} as const;
const ABOUT_KEYS = ["Escreva uma descrição sobre você e sua experiência!", "Escreva uma descrição/redação sobre você e sua experiência!"];

/** Qual funil é o arquivo, pelas colunas. */
export function detectPipeline(rows: Record<string, string>[]): Pipeline | null {
  const cols = Object.keys(rows[0] ?? {});
  if (!cols.includes(COL.nome) || !cols.includes(COL.vaga)) return null;
  if (cols.includes(ABOUT_KEYS[1]) && !cols.includes(COL.email)) return "professor";
  return "trabalho";
}

/** Status do Notion -> etapa (e motivo de reprovação). */
export function mapStatus(status: string, pipeline: Pipeline): { stage: Stage; reason: string | null } {
  const s = status.trim();
  const reprovado = /^Reprovado\s*(?:-|\()\s*(.*?)\)?\s*$/i.exec(s);
  if (reprovado) return { stage: "reprovado", reason: reprovado[1] || "Sem motivo" };
  const map: Record<string, Stage> = {
    "Não avaliado": "novo",
    Visto: "visto",
    "Avaliado por IA": "avaliado_ia",
    "Convite Enviado": "convite",
    "Reunião agendada": "entrevista",
    "Possivelmente Depois": "depois",
    Contratado: "contratado",
    Demitido: "desligado",
    Reprovado: "reprovado",
  };
  if (s === "Reprovado") return { stage: "reprovado", reason: "Sem motivo" };
  if (/^20\d\d$/.test(s)) return { stage: pipeline === "professor" ? "proximo_ano" : "depois", reason: null };
  return { stage: map[s] ?? "novo", reason: null };
}

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** "4 de novembro de 2026 14:41" (horário de Caruaru) -> ISO. */
export function parseNotionDate(value: string): string | null {
  const m = /(\d{1,2}) de ([a-zç]+) de (\d{4})(?: (\d{1,2}):(\d{2}))?/i.exec(value);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].toLowerCase());
  if (month < 0) return null;
  const pad = (n: string | number) => String(n).padStart(2, "0");
  return new Date(`${m[3]}-${pad(month + 1)}-${pad(m[1])}T${pad(m[4] ?? 12)}:${m[5] ?? "00"}:00-03:00`).toISOString();
}

const STOP = new Set(["de", "da", "do", "e", "a", "o", "em", "para", "cppem", "colegio", "unicive", "curso", "cursos", "concursos"]);
/**
 * Palavras que identificam uma vaga: sem acento, sem "(Colégio Cppem)" e cortadas
 * nas 6 primeiras letras, para "Coordenação" e "Coordenador" contarem como a mesma.
 */
export function titleTokens(title: string): string[] {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/polivante/g, "polivalente")
    .replace(/relogioso/g, "religioso")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => w.slice(0, 6));
}

/** Melhor vaga do site para o nome de vaga do Notion (ou null). */
export function matchJob<J extends { id: string; title: string; category: string }>(name: string, jobs: J[], pipeline: Pipeline): J | null {
  const a = new Set(titleTokens(name));
  if (!a.size) return null;
  let best: J | null = null;
  let bestScore = 0;
  for (const j of jobs) {
    if (j.category !== pipeline) continue;
    const b = new Set(titleTokens(j.title));
    const inter = [...a].filter((w) => b.has(w)).length;
    const score = inter / new Set([...a, ...b]).size;
    if (score > bestScore) {
      bestScore = score;
      best = j;
    }
  }
  return bestScore >= 0.5 ? best : null;
}

/** Nomes de vaga do Notion vêm juntos, separados por vírgula. */
export const splitJobs = (value: string) => value.split(/,\s*(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/).map((v) => v.trim()).filter(Boolean);

const score10 = (v: string) => {
  if (!v) return null;
  const n = Math.round(Number(v.replace(",", ".")));
  return Number.isFinite(n) ? Math.max(0, Math.min(10, n)) : null;
};

export interface ImportApplication {
  vaga: string;
  stage: Stage;
  reason: string | null;
  ai_score: number | null;
  scores: { score_fit: number | null; score_proatividade: number | null; score_comunicacao: number | null; score_resiliencia: number | null; score_tecnica: number | null };
  created_at: string;
}

export interface ImportPerson {
  key: string;
  full_name: string;
  email: string | null;
  whatsapp: string;
  whatsapp_digits: string;
  social_url: string | null;
  age_range: string | null;
  city: string | null;
  about: string | null;
  sources: string[];
  resume_name: string | null;
  created_at: string;
  applications: ImportApplication[];
}

/**
 * Agrupa as linhas por pessoa (mesmo WhatsApp, ou mesmo nome quando não há WhatsApp).
 * Os dados da pessoa vêm do envio mais recente; cada vaga vira uma candidatura com
 * o status do envio mais recente para aquela vaga.
 */
export function buildPeople(rows: Record<string, string>[], pipeline: Pipeline): ImportPerson[] {
  const people = new Map<string, ImportPerson>();
  const sorted = rows
    .map((r) => ({ r, at: parseNotionDate(r[COL.data] ?? "") ?? new Date(0).toISOString() }))
    .sort((x, y) => x.at.localeCompare(y.at));
  for (const { r, at } of sorted) {
    const name = (r[COL.nome] ?? "").replace(/\s+/g, " ").trim();
    if (!name) continue;
    let digits = onlyDigits(r[COL.whatsapp] ?? "");
    if (digits.length > 11 && digits.startsWith("55")) digits = digits.slice(2);
    const key = digits.length >= 10 ? digits : `nome:${name.toLowerCase()}`;
    const about = ABOUT_KEYS.map((k) => r[k]).find((v) => v?.trim()) ?? null;
    const resume = r[COL.curriculo] ? decodeURIComponent(r[COL.curriculo].split("/").pop() ?? "").slice(0, 200) : null;
    const prev = people.get(key);
    const person: ImportPerson = {
      key,
      full_name: name,
      email: r[COL.email]?.trim().toLowerCase() || prev?.email || null,
      whatsapp: digits.length >= 10 ? formatWhatsapp(digits) : r[COL.whatsapp] || prev?.whatsapp || "não informado",
      whatsapp_digits: digits,
      social_url: r[COL.social]?.trim() || prev?.social_url || null,
      age_range: r[COL.idade]?.trim() || prev?.age_range || null,
      city: r[COL.cidade]?.trim() || prev?.city || null,
      about: about?.trim() || prev?.about || null,
      sources: Array.from(new Set([...(prev?.sources ?? []), ...(r[COL.origem] ? r[COL.origem].split(/,\s*/) : [])])),
      resume_name: resume || prev?.resume_name || null,
      created_at: prev?.created_at ?? at,
      applications: prev?.applications ?? [],
    };
    const { stage, reason } = mapStatus(r[COL.status] ?? "", pipeline);
    const aiRaw = (r[COL.score] ?? "").trim();
    const app = (vaga: string): ImportApplication => ({
      vaga,
      stage,
      reason,
      ai_score: aiRaw ? Math.max(0, Math.min(100, Math.round(Number(aiRaw.replace(",", "."))) || 0)) : null,
      scores: {
        score_fit: score10(r[COL.fit] ?? ""),
        score_proatividade: score10(r[COL.proatividade] ?? ""),
        score_comunicacao: score10(r[COL.comunicacao] ?? ""),
        score_resiliencia: score10(r[COL.resiliencia] ?? ""),
        score_tecnica: score10(r[COL.tecnica] ?? ""),
      },
      created_at: at,
    });
    const vagas = splitJobs(r[COL.vaga] ?? "");
    for (const v of vagas.length ? vagas : [TALENT_POOL]) {
      const i = person.applications.findIndex((a) => a.vaga === v);
      if (i < 0) {
        person.applications.push(app(v));
        continue;
      }
      // Mesma vaga enviada de novo: vale a decisão do RH (um envio repetido "Não avaliado"
      // não apaga um "Reprovado" ou "2027" dado antes); notas vêm de qualquer um dos envios.
      const old = person.applications[i];
      const next = app(v);
      const untouched = (s: Stage) => s === "novo" || s === "visto";
      const keepOld = untouched(next.stage) && !untouched(old.stage);
      const base = keepOld ? old : next;
      const other = keepOld ? next : old;
      person.applications[i] = {
        ...base,
        ai_score: base.ai_score ?? other.ai_score,
        scores: Object.fromEntries(
          Object.entries(base.scores).map(([k, val]) => [k, val ?? other.scores[k as keyof typeof other.scores]])
        ) as ImportApplication["scores"],
        created_at: old.created_at,
      };
    }
    people.set(key, person);
  }
  return [...people.values()];
}
