"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slug";
import RichTextEditor from "./RichTextEditor";
import {
  CATEGORIES,
  DEPARTMENTS,
  DISCIPLINE_CATEGORIES,
  STATUSES,
  UNITS,
  WORK_TYPES,
  DEFAULT_LOCATION,
  parseUnits,
} from "@/lib/constants";
import type { Job, JobCategory, JobInput } from "@/lib/types";

interface AdminJobFormProps {
  /** Quando presente, o formulário está em modo edição. */
  job?: Job;
}

function emptyForm(): JobInput {
  return {
    title: "",
    slug: "",
    category: "trabalho",
    department: "",
    discipline: "",
    segment: "",
    work_type: "presencial",
    unit: "",
    location: DEFAULT_LOCATION,
    expected_schedule: "",
    status: "rascunho",
    short_description: "",
    description: "",
    responsibilities: "",
    requirements: "",
    differentials: "",
    benefits: "",
    apply_url: "",
    featured: false,
    screening_questions: [],
  };
}

export default function AdminJobForm({ job }: AdminJobFormProps) {
  const router = useRouter();
  const isEdit = !!job;

  const [form, setForm] = useState<JobInput>(
    job
      ? {
          title: job.title,
          slug: job.slug,
          category: job.category,
          department: job.department ?? "",
          discipline: job.discipline ?? "",
          segment: job.segment ?? "",
          work_type: job.work_type ?? "presencial",
          unit: job.unit ?? "",
          location: job.location,
          expected_schedule: job.expected_schedule ?? "",
          status: job.status,
          short_description: job.short_description ?? "",
          description: job.description ?? "",
          responsibilities: job.responsibilities ?? "",
          requirements: job.requirements ?? "",
          differentials: job.differentials ?? "",
          benefits: job.benefits ?? "",
          apply_url: job.apply_url ?? "",
          featured: job.featured ?? false,
          screening_questions: job.screening_questions ?? [],
        }
      : emptyForm()
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Listas configuráveis (setores e unidades) vindas das configurações
  const [deptOptions, setDeptOptions] = useState<string[]>([...DEPARTMENTS]);
  const [unitChoices, setUnitChoices] = useState<string[]>([...UNITS]);

  useEffect(() => {
    createClient()
      .from("site_settings")
      .select("departments, units")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.departments?.length) setDeptOptions(data.departments);
        if (data?.units?.length) setUnitChoices(data.units);
      });
  }, []);

  function set<K extends keyof JobInput>(key: K, value: JobInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Unidades selecionadas (uma vaga pode ter mais de uma)
  const selectedUnits = parseUnits(form.unit);
  // Opções de unidade = configuradas + as já selecionadas (não perde valores)
  const unitOptions = Array.from(new Set([...unitChoices, ...selectedUnits]));
  function toggleUnit(u: string) {
    const next = selectedUnits.includes(u)
      ? selectedUnits.filter((x) => x !== u)
      : [...selectedUnits, u];
    const ordered = unitOptions.filter((x) => next.includes(x));
    set("unit", ordered.join(", "));
  }
  // Opções de setor = configuradas + o já selecionado (não perde o valor)
  const departmentChoices =
    form.department && !deptOptions.includes(form.department)
      ? [...deptOptions, form.department]
      : deptOptions;

  const isProfessor = form.category === "professor";

  function validate(): string | null {
    if (!form.title.trim()) return "O título é obrigatório.";
    if (!form.category) return "A categoria é obrigatória.";
    if (selectedUnits.length === 0)
      return "Selecione pelo menos uma unidade.";
    if (!form.location.trim()) return "O local é obrigatório.";
    if (!form.status) return "O status é obrigatório.";
    if (isProfessor) {
      if (!form.description?.trim())
        return "A descrição da vaga é obrigatória.";
    } else if (!form.responsibilities?.trim()) {
      return "As responsabilidades são obrigatórias.";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    setSaving(true);

    const supabase = createClient();
    const slug = form.slug?.trim() || slugify(form.title);

    // Limpa campos que não pertencem à categoria selecionada
    const payload: JobInput = {
      ...form,
      slug,
      department: isProfessor ? null : form.department || null,
      discipline: isProfessor ? form.discipline || null : null,
      work_type: isProfessor ? null : form.work_type,
      expected_schedule: isProfessor ? null : form.expected_schedule || null,
      // Trabalho usa Responsabilidades; Professor usa Descrição da vaga
      description: isProfessor ? form.description || null : null,
      responsibilities: isProfessor ? null : form.responsibilities || null,
      differentials: null,
      apply_url: form.apply_url?.trim() || null,
    };
    // Perguntas eliminatórias: só vão para o banco se existirem (ou se a vaga já tinha),
    // assim salvar continua funcionando antes da migração 0013
    const questions = (form.screening_questions ?? []).map((q) => ({ ...q, question: q.question.trim() })).filter((q) => q.question);
    if (questions.length || job?.screening_questions?.length) payload.screening_questions = questions;
    else delete payload.screening_questions;

    let result;
    if (isEdit) {
      result = await supabase.from("jobs").update(payload).eq("id", job!.id);
    } else {
      result = await supabase.from("jobs").insert(payload);
    }

    if (result.error) {
      setError(
        result.error.code === "23505"
          ? "Já existe uma vaga com este slug. Altere o título ou o slug."
          : `Erro ao salvar: ${result.error.message}`
      );
      setSaving(false);
      return;
    }

    router.push("/admin/vagas");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Dados principais */}
      <fieldset className="card space-y-4 p-6">
        <legend className="px-2 text-sm font-semibold text-brand-500">
          Dados principais
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Título da vaga *</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (!isEdit) set("slug", slugify(e.target.value));
              }}
              placeholder="Ex.: Analista de Marketing"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Slug (gerado automaticamente)</label>
            <input
              className="input"
              value={form.slug}
              onChange={(e) => set("slug", slugify(e.target.value))}
              placeholder="analista-de-marketing"
            />
          </div>

          <div>
            <label className="label">Categoria *</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => set("category", e.target.value as JobCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Status *</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) =>
                set("status", e.target.value as JobInput["status"])
              }
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-brand-200 bg-white px-4 py-3">
              <input
                type="checkbox"
                checked={form.featured ?? false}
                onChange={(e) => set("featured", e.target.checked)}
                className="h-4 w-4 rounded border-brand-300"
              />
              <span className="text-sm font-medium text-brand-800">
                ⭐ Destacar esta vaga (aparece em primeiro na página de vagas)
              </span>
            </label>
          </div>

          {/* Campos específicos por categoria */}
          {isProfessor ? (
            <div>
              <label className="label">Categoria de professor</label>
              <select
                className="input"
                value={form.discipline ?? ""}
                onChange={(e) => set("discipline", e.target.value)}
              >
                <option value="">Selecione...</option>
                {DISCIPLINE_CATEGORIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="label">Setor</label>
              <select
                className="input"
                value={form.department ?? ""}
                onChange={(e) => set("department", e.target.value)}
              >
                <option value="">Selecione...</option>
                {departmentChoices.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">Segmento</label>
            <input
              className="input"
              value={form.segment ?? ""}
              onChange={(e) => set("segment", e.target.value)}
              placeholder="Ex.: Ensino Médio, Concursos"
            />
          </div>

          {!isProfessor && (
            <div>
              <label className="label">Tipo de vaga</label>
              <select
                className="input"
                value={form.work_type ?? ""}
                onChange={(e) =>
                  set("work_type", e.target.value as JobInput["work_type"])
                }
              >
                {WORK_TYPES.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="label">Unidade(s) *</label>
            <p className="mb-2 text-xs text-brand-500">
              Selecione uma ou mais unidades para esta vaga.
            </p>
            <div className="flex flex-wrap gap-3">
              {unitOptions.map((u) => {
                const selected = selectedUnits.includes(u);
                return (
                  <label
                    key={u}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      selected
                        ? "border-accent-500 bg-accent-50 text-brand-900"
                        : "border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleUnit(u)}
                      className="h-4 w-4 rounded border-brand-300"
                    />
                    {u}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">Local *</label>
            <input
              className="input"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </div>

          {!isProfessor && (
            <div>
              <label className="label">Horário previsto</label>
              <input
                className="input"
                value={form.expected_schedule ?? ""}
                onChange={(e) => set("expected_schedule", e.target.value)}
                placeholder="Ex.: Seg a Sex, 8h às 18h"
              />
            </div>
          )}
        </div>
      </fieldset>

      {/* Descrições */}
      <fieldset className="card space-y-4 p-6">
        <legend className="px-2 text-sm font-semibold text-brand-500">
          Descrição e detalhes
        </legend>

        <div>
          <label className="label">Resumo (aparece no card)</label>
          <input
            className="input"
            value={form.short_description ?? ""}
            onChange={(e) => set("short_description", e.target.value)}
            placeholder="Resumo curto exibido nos cards de vaga"
          />
        </div>

        {isProfessor ? (
          <div>
            <label className="label">Descrição da vaga *</label>
            <RichTextEditor
              value={form.description ?? ""}
              onChange={(html) => set("description", html)}
              placeholder="Descreva a vaga... (use negrito, listas e emojis)"
            />
          </div>
        ) : (
          <div>
            <label className="label">Responsabilidades *</label>
            <RichTextEditor
              value={form.responsibilities ?? ""}
              onChange={(html) => set("responsibilities", html)}
              placeholder="Liste as responsabilidades... (use negrito, listas e emojis)"
            />
          </div>
        )}

        <div>
          <label className="label">Requisitos e Qualificações</label>
          <RichTextEditor
            value={form.requirements ?? ""}
            onChange={(html) => set("requirements", html)}
            placeholder="Liste os requisitos e qualificações..."
          />
        </div>

        <div>
          <label className="label">Benefícios</label>
          <RichTextEditor
            value={form.benefits ?? ""}
            onChange={(html) => set("benefits", html)}
            placeholder="Liste os benefícios..."
          />
        </div>

        <div>
          <label className="label">Link de candidatura (opcional)</label>
          <input
            className="input"
            value={form.apply_url ?? ""}
            onChange={(e) => set("apply_url", e.target.value)}
            placeholder="Deixe vazio para usar o formulário geral das configurações"
          />
        </div>
      </fieldset>

      {/* Perguntas eliminatórias */}
      <fieldset className="card space-y-4 p-6">
        <legend className="px-2 text-sm font-semibold text-brand-500">Perguntas eliminatórias (opcional)</legend>
        <p className="text-sm text-brand-500">
          Perguntas de sim ou não que aparecem no formulário quando a pessoa escolhe esta vaga (ex.: disponibilidade aos sábados, mora em
          Caruaru, tem CNH). <strong>Não reprovam sozinhas</strong>: quem responder diferente do esperado aparece com um aviso no pipeline.
        </p>
        <ul className="space-y-2">
          {(form.screening_questions ?? []).map((q, i) => (
            <li key={q.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-100 p-2">
              <input
                aria-label={`Pergunta eliminatória ${i + 1}`}
                className="input min-w-0 flex-1 !py-2"
                value={q.question}
                maxLength={160}
                placeholder="Ex.: Você tem disponibilidade para trabalhar aos sábados?"
                onChange={(e) => {
                  const next = [...(form.screening_questions ?? [])];
                  next[i] = { ...q, question: e.target.value };
                  set("screening_questions", next);
                }}
              />
              <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-600">
                Resposta esperada
                <select
                  className="input !w-auto !py-2"
                  value={q.expected}
                  onChange={(e) => {
                    const next = [...(form.screening_questions ?? [])];
                    next[i] = { ...q, expected: e.target.value as "sim" | "nao" };
                    set("screening_questions", next);
                  }}
                >
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </label>
              <button
                type="button"
                aria-label={`Remover pergunta ${i + 1}`}
                onClick={() => set("screening_questions", (form.screening_questions ?? []).filter((_, k) => k !== i))}
                className="rounded-lg px-2 py-1 text-sm text-rose-600 hover:bg-rose-50"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        {(form.screening_questions ?? []).length < 5 && (
          <button
            type="button"
            onClick={() =>
              set("screening_questions", [...(form.screening_questions ?? []), { id: `q${Date.now().toString(36)}`, question: "", expected: "sim" }])
            }
            className="btn-secondary !py-2"
          >
            + Adicionar pergunta
          </button>
        )}
      </fieldset>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar vaga"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/vagas")}
          className="btn-secondary"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
