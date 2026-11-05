"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import JobPicker from "./JobPicker";
import type { ScreeningQuestion } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { AGE_OPTIONS, RESUME_ACCEPT, SOURCE_OPTIONS, TALENT_POOL } from "@/lib/rh/constants";
import {
  screeningKey,
  ABOUT_MAX,
  ABOUT_MIN,
  formatWhatsapp,
  validateFields,
  validateResumeMeta,
  type ApplicationFields,
  type FieldErrors,
} from "@/lib/rh/validate";

interface JobOption {
  id: string;
  title: string;
  slug: string;
  category: "trabalho" | "professor";
  hint?: string;
  screening?: ScreeningQuestion[];
}

interface Props {
  jobs: JobOption[];
  preselectedId?: string;
  whatsappGroupUrl: string | null;
}

type Done = { nome: string; vagas: string[]; repetidas: string[] };

const ORDER: (keyof FieldErrors)[] = ["vagas", "eliminatorias", "nome", "email", "whatsapp", "social", "idade", "cidade", "curriculo", "sobre", "origem", "consentimento"];

/** Formulário de candidatura: as mesmas perguntas do formulário do Notion. */
export default function ApplicationForm({ jobs, preselectedId, whatsappGroupUrl }: Props) {
  const [f, setF] = useState<ApplicationFields>({
    vagas: preselectedId ? [preselectedId] : [],
    nome: "",
    email: "",
    whatsapp: "",
    social: "",
    idade: "",
    cidade: "",
    sobre: "",
    origem: [],
    consentimento: false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [screen, setScreen] = useState<Record<string, "sim" | "nao">>({});
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  // Ao confirmar, leva a pessoa (e o leitor de tela) até a mensagem de sucesso
  useEffect(() => {
    if (!done) return;
    doneRef.current?.scrollIntoView({ block: "center" });
    doneRef.current?.focus({ preventScroll: true });
  }, [done]);

  const trabalho = jobs.filter((j) => j.category === "trabalho");
  const professor = jobs.filter((j) => j.category === "professor");
  const isTeacher = f.vagas.some((id) => professor.some((j) => j.id === id));
  // Perguntas eliminatórias das vagas escolhidas (a mesma pergunta em duas vagas aparece uma vez)
  const screeningQuestions = Array.from(
    new Map(jobs.filter((j) => f.vagas.includes(j.id)).flatMap((j) => j.screening ?? []).map((q) => [screeningKey(q.question), q])).values()
  );

  const set = <K extends keyof ApplicationFields>(key: K, value: ApplicationFields[K]) => {
    const next = { ...f, [key]: value };
    setF(next);
    if (tried) setErrors({ ...validateFields(next), ...(errors.curriculo ? { curriculo: errors.curriculo } : {}) });
  };
  const toggle = (key: "vagas" | "origem", value: string) =>
    set(key, f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value]);

  function pickFile(next: File | null) {
    const err = next ? validateResumeMeta(next.size, next.type) : null;
    setErrors((e) => ({ ...e, curriculo: err ?? undefined }));
    setFile(err ? null : next);
  }

  function focusFirst(errs: FieldErrors) {
    const first = ORDER.find((k) => errs[k]);
    if (!first) return;
    const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.querySelector<HTMLElement>("input, select, textarea")?.focus({ preventScroll: true });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    setMessage("");
    const errs: FieldErrors = { ...validateFields(f), ...(errors.curriculo ? { curriculo: errors.curriculo } : {}) };
    if (screeningQuestions.some((q) => !screen[screeningKey(q.question)])) errs.eliminatorias = "Responda as perguntas sobre a vaga.";
    setErrors(errs);
    if (Object.keys(errs).some((k) => errs[k as keyof FieldErrors])) {
      setMessage("Confira os campos destacados.");
      focusFirst(errs);
      return;
    }

    const body = new FormData();
    f.vagas.forEach((v) => body.append("vagas", v));
    f.origem.forEach((v) => body.append("origem", v));
    (["nome", "email", "whatsapp", "social", "idade", "cidade", "sobre"] as const).forEach((k) => body.append(k, f[k]));
    body.append("consentimento", f.consentimento ? "sim" : "");
    body.append("inicio", String(startedAt));
    body.append("eliminatorias", JSON.stringify(screen));
    body.append("empresa", (formRef.current?.elements.namedItem("empresa") as HTMLInputElement | null)?.value ?? "");
    if (file) body.append("curriculo", file);

    setSending(true);
    try {
      const res = await fetch("/api/candidatura", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        trackEvent("candidatura_enviada", { vagas: f.vagas.length });
        setDone({ nome: data.nome, vagas: data.vagas ?? [], repetidas: data.repetidas ?? [] });
        return;
      }
      if (data.errors) {
        setErrors(data.errors);
        focusFirst(data.errors);
      }
      setMessage(data.message ?? "Não foi possível enviar. Tente de novo.");
    } catch {
      setMessage("Sem conexão. Confira a sua internet e tente de novo.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="card p-7 sm:p-10" role="status">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-goodsoft text-good">
          <Icon name="check" className="h-7 w-7" strokeWidth={2.5} />
        </span>
        <h2 ref={doneRef} tabIndex={-1} className="mt-5 text-3xl font-extrabold text-ink outline-none">Candidatura recebida{done.nome ? `, ${done.nome}` : ""}!</h2>
        {done.vagas.length > 0 && (
          <>
            <p className="mt-3 text-lg text-inksoft">Você está oficialmente inscrito(a) no processo seletivo de:</p>
            <ul className="mt-3 space-y-2">
              {done.vagas.map((v) => (
                <li key={v} className="flex items-center gap-2 font-semibold text-ink">
                  <Icon name="check" className="h-5 w-5 text-good" /> {v}
                </li>
              ))}
            </ul>
          </>
        )}
        {done.repetidas.length > 0 && (
          <p className="mt-4 rounded-2xl bg-canvas2 p-4 text-sm text-inksoft">
            Você já estava inscrito(a) em: <strong>{done.repetidas.join(", ")}</strong>. Atualizamos os seus dados.
          </p>
        )}
        <h3 className="mt-8 text-lg font-extrabold text-ink">E agora?</h3>
        <p className="mt-2 leading-relaxed text-inksoft">
          Nossa equipe analisa todas as candidaturas. Se o seu perfil avançar, falamos com você pelo WhatsApp que você
          informou para combinar a entrevista.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          {whatsappGroupUrl && (
            <a href={whatsappGroupUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
              Entrar no grupo de vagas
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          )}
          <Link href="/cultura" className="btn-secondary">
            Conhecer a nossa cultura
          </Link>
          <Link href="/carreiras#vagas" className="btn-secondary">
            Ver outras vagas
          </Link>
        </div>
      </div>
    );
  }

  const err = (k: keyof FieldErrors) =>
    errors[k] ? (
      <p id={`erro-${k}`} className="mt-1.5 text-sm font-medium text-bad">
        {errors[k]}
      </p>
    ) : null;
  const aria = (k: keyof FieldErrors) => ({ "aria-invalid": !!errors[k] || undefined, "aria-describedby": errors[k] ? `erro-${k}` : undefined });
  const req = <span className="text-bad" aria-hidden> *</span>;

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-6">
      <p className="text-sm text-inkmuted">
        Campos com <span className="text-bad">*</span> são obrigatórios.
      </p>

      {/* Campo invisível contra robôs */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Empresa <input name="empresa" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div data-field="vagas" className="card p-5 sm:p-7">
        <p className="text-base font-bold text-ink" id="rotulo-vagas">
          Qual vaga você quer se candidatar?{req}
        </p>
        <p className="mt-1 text-sm text-inkmuted" id="dica-vagas">
          {jobs.length === 0 ? "Não há vagas abertas agora. Você pode entrar no Banco de Talentos." : "Toque para ver as vagas ou digite para buscar. Pode marcar mais de uma."}
        </p>
        <JobPicker
          labelledBy="rotulo-vagas"
          describedBy={errors.vagas ? "dica-vagas erro-vagas" : "dica-vagas"}
          invalid={!!errors.vagas}
          value={f.vagas}
          onChange={(v) => set("vagas", v)}
          options={[
            ...trabalho.map((j) => ({ id: j.id, title: j.title, group: "Trabalho", hint: j.hint })),
            { id: "banco", title: TALENT_POOL, group: "Trabalho", hint: "Sem vaga específica: entra no nosso banco para próximas vagas" },
            ...professor.map((j) => ({ id: j.id, title: j.title, group: "Professores", hint: j.hint })),
          ]}
        />
        {err("vagas")}
      </div>

      {screeningQuestions.length > 0 && (
        <fieldset data-field="eliminatorias" className="card p-5 sm:p-7" aria-describedby={errors.eliminatorias ? "erro-eliminatorias" : undefined}>
          <legend className="sr-only">Perguntas sobre a vaga</legend>
          <p className="text-base font-bold text-ink">
            Algumas perguntas sobre a vaga{req}
          </p>
          <ul className="mt-4 space-y-4">
            {screeningQuestions.map((q) => {
              const k = screeningKey(q.question);
              return (
                <li key={k}>
                  <p className="text-sm font-semibold text-ink" id={`pe-${q.id}`}>
                    {q.question}
                  </p>
                  <div className="mt-2 flex gap-2" role="radiogroup" aria-labelledby={`pe-${q.id}`}>
                    {(["sim", "nao"] as const).map((v) => (
                      <label
                        key={v}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${screen[k] === v ? "border-accent-500 bg-goldfaint text-ink" : "border-line2 text-inksoft hover:border-goldline"}`}
                      >
                        <input type="radio" name={`pe-${q.id}`} checked={screen[k] === v} onChange={() => setScreen({ ...screen, [k]: v })} className="h-4 w-4 accent-[#8a7040]" />
                        {v === "sim" ? "Sim" : "Não"}
                      </label>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
          {err("eliminatorias")}
        </fieldset>
      )}

      <div className="card space-y-5 p-5 sm:p-7">
        <div data-field="nome">
          <label htmlFor="c-nome" className="label">
            Seu nome completo{req}
          </label>
          <input id="c-nome" className="input" autoComplete="name" value={f.nome} onChange={(e) => set("nome", e.target.value)} {...aria("nome")} />
          {err("nome")}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div data-field="email">
            <label htmlFor="c-email" className="label">
              Seu melhor e-mail{req}
            </label>
            <input id="c-email" type="email" className="input" autoComplete="email" inputMode="email" value={f.email} onChange={(e) => set("email", e.target.value)} {...aria("email")} />
            {err("email")}
          </div>
          <div data-field="whatsapp">
            <label htmlFor="c-whats" className="label">
              Seu WhatsApp com o DDD{req}
            </label>
            <input
              id="c-whats"
              type="tel"
              className="input"
              autoComplete="tel-national"
              inputMode="tel"
              placeholder="(81) 9 9999-9999"
              value={f.whatsapp}
              onChange={(e) => set("whatsapp", formatWhatsapp(e.target.value))}
              {...aria("whatsapp")}
            />
            {err("whatsapp")}
          </div>
        </div>
        <div data-field="social">
          <label htmlFor="c-social" className="label">
            Link do seu Instagram ou LinkedIn{req}
          </label>
          <input
            id="c-social"
            className="input"
            placeholder="instagram.com/seuperfil ou linkedin.com/in/seuperfil"
            value={f.social}
            onChange={(e) => set("social", e.target.value)}
            {...aria("social")}
          />
          {err("social")}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div data-field="idade">
            <label htmlFor="c-idade" className="label">
              Sua idade{req}
            </label>
            <select id="c-idade" className="input" value={f.idade} onChange={(e) => set("idade", e.target.value)} {...aria("idade")}>
              <option value="">Selecione</option>
              {AGE_OPTIONS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            {err("idade")}
          </div>
          <div data-field="cidade">
            <label htmlFor="c-cidade" className="label">
              Cidade que você mora atualmente{req}
            </label>
            <input id="c-cidade" className="input" autoComplete="address-level2" value={f.cidade} onChange={(e) => set("cidade", e.target.value)} {...aria("cidade")} />
            {err("cidade")}
          </div>
        </div>
      </div>

      <div className="card space-y-5 p-5 sm:p-7">
        <div data-field="curriculo">
          <p className="label" id="rotulo-curriculo">
            Envie seu currículo (se houver)
          </p>
          {file ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-goldline bg-goldfaint p-3.5">
              <span className="min-w-0 truncate text-sm font-semibold text-ink">{file.name}</span>
              <button type="button" onClick={() => pickFile(null)} className="shrink-0 text-sm font-semibold text-inksoft underline hover:text-ink">
                Remover
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-line2 p-6 text-center transition-colors hover:border-goldline">
              <span className="text-sm font-semibold text-ink">Escolher arquivo</span>
              <span className="text-xs text-inkmuted">PDF, Word ou imagem, até 4 MB</span>
              <input
                type="file"
                accept={RESUME_ACCEPT}
                className="sr-only"
                aria-labelledby="rotulo-curriculo"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                {...aria("curriculo")}
              />
            </label>
          )}
          {err("curriculo")}
        </div>

        <div data-field="sobre">
          <label htmlFor="c-sobre" className="label">
            {isTeacher ? "Escreva uma descrição/redação sobre você e sua experiência!" : "Escreva uma descrição sobre você e sua experiência!"}
            {req}
          </label>
          <textarea
            id="c-sobre"
            rows={7}
            className="input"
            maxLength={ABOUT_MAX}
            placeholder="Conte quem você é, onde já trabalhou, o que sabe fazer e por que quer trabalhar no CPPEM."
            value={f.sobre}
            onChange={(e) => set("sobre", e.target.value)}
            {...aria("sobre")}
          />
          <p className="mt-1 text-right text-xs text-inkmuted">
            {f.sobre.trim().length < ABOUT_MIN ? `mínimo de ${ABOUT_MIN} caracteres · ` : ""}
            {f.sobre.length}/{ABOUT_MAX}
          </p>
          {err("sobre")}
        </div>
      </div>

      <fieldset data-field="origem" className="card p-5 sm:p-7" {...aria("origem")}>
        <legend className="sr-only">Como encontrou essa vaga?</legend>
        <p className="text-base font-bold text-ink">
          Como encontrou essa vaga?{req}
        </p>
        <p className="mt-1 text-sm text-inkmuted">Pode marcar mais de uma.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {SOURCE_OPTIONS.map((o) => (
            <label key={o} className="flex cursor-pointer items-center gap-3 rounded-xl px-1 py-1.5 text-sm text-inksoft">
              <input type="checkbox" checked={f.origem.includes(o)} onChange={() => toggle("origem", o)} className="h-4 w-4 accent-[#8a7040]" />
              {o}
            </label>
          ))}
        </div>
        {err("origem")}
      </fieldset>

      <div data-field="consentimento" className="card p-5 sm:p-7">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-inksoft">
          <input
            type="checkbox"
            checked={f.consentimento}
            onChange={(e) => set("consentimento", e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-[#8a7040]"
            {...aria("consentimento")}
          />
          <span>
            Li e concordo com a{" "}
            <Link href="/privacidade" target="_blank" className="font-semibold text-ink underline">
              Política de Privacidade
            </Link>{" "}
            e autorizo o CPPEM a usar os meus dados neste processo seletivo, inclusive com apoio de inteligência
            artificial na triagem (a decisão é sempre da nossa equipe).{req}
          </span>
        </label>
        {err("consentimento")}
      </div>

      {message && (
        <p role="alert" className="rounded-2xl border border-bad/40 bg-badsoft p-4 text-sm font-semibold text-bad">
          {message}
        </p>
      )}

      <button type="submit" disabled={sending} className="btn-primary w-full !py-4 text-base sm:w-auto">
        {sending ? "Enviando..." : "Enviar candidatura"}
        {!sending && <Icon name="arrow" className="h-4 w-4" />}
      </button>
    </form>
  );
}
