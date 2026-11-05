"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import ContentListEditor from "@/components/admin/ContentListEditor";
import RhSetupCard from "@/components/admin/rh/RhSetupCard";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_FAQ_ITEMS, DEFAULT_PROCESS_STEPS, DEFAULT_WHY_ITEMS } from "@/lib/content-defaults";
import type { SiteSettings } from "@/lib/types";

type Editable = Partial<SiteSettings>;

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<Editable>({});
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSettings(data as SiteSettings);
          setId((data as SiteSettings).id);
        }
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  // Gerencia listas (setores / unidades)
  function addToList(key: "departments" | "units", value: string) {
    const v = value.trim();
    if (!v) return;
    const current = settings[key] ?? [];
    if (current.includes(v)) return;
    set(key, [...current, v]);
  }
  function removeFromList(key: "departments" | "units", value: string) {
    const current = settings[key] ?? [];
    set(
      key,
      current.filter((x) => x !== value)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = { ...settings };
    delete (payload as Record<string, unknown>).id;
    delete (payload as Record<string, unknown>).created_at;
    delete (payload as Record<string, unknown>).updated_at;

    let result;
    if (id) {
      result = await supabase
        .from("site_settings")
        .update(payload)
        .eq("id", id);
    } else {
      result = await supabase.from("site_settings").insert(payload);
    }

    setMessage(
      result.error
        ? `Erro ao salvar: ${result.error.message}`
        : "Configurações salvas com sucesso!"
    );
    setSaving(false);
  }

  return (
    <AdminLayout title="Configurações">
      {loading ? (
        <p className="text-brand-500">Carregando...</p>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
          {message && (
            <p
              className={`rounded-lg px-4 py-3 text-sm ${
                message.startsWith("Erro")
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {message}
            </p>
          )}

          {/* Candidaturas pelo site (só aparece depois da migração 0010) */}
          {"applications_enabled" in settings && (
            <RhSetupCard
              enabled={!!settings.applications_enabled}
              autoAi={settings.ai_auto_evaluate ?? true}
              onEnabled={(v) => set("applications_enabled", v)}
              onAutoAi={(v) => set("ai_auto_evaluate", v)}
            />
          )}

          {/* Configurações do RH (página própria) */}
          <Link
            href="/admin/configuracoes/rh"
            className="card flex items-center justify-between gap-4 p-5 transition-shadow hover:shadow-md"
          >
            <span>
              <span className="block font-bold text-brand-950">Configurações do RH</span>
              <span className="mt-0.5 block text-sm text-brand-500">Motivos de reprovação e roteiro padrão de entrevista</span>
            </span>
            <span aria-hidden className="text-brand-400">→</span>
          </Link>

          <Link
            href="/admin/configuracoes/lgpd"
            className="card flex items-center justify-between gap-4 p-5 transition-shadow hover:shadow-md"
          >
            <span>
              <span className="block font-bold text-brand-950">Privacidade (LGPD)</span>
              <span className="mt-0.5 block text-sm text-brand-500">Prazo de guarda dos dados e cadastros para anonimizar ou excluir</span>
            </span>
            <span aria-hidden className="text-brand-400">→</span>
          </Link>

          {/* Setores e Unidades */}
          <Card title="Setores e unidades">
            <p className="text-sm text-brand-500">
              Gerencie as opções disponíveis ao criar/editar vagas.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              <ListEditor
                label="Setores"
                items={settings.departments ?? []}
                onAdd={(v) => addToList("departments", v)}
                onRemove={(v) => removeFromList("departments", v)}
                placeholder="Novo setor (ex.: Jurídico)"
              />
              <ListEditor
                label="Unidades"
                items={settings.units ?? []}
                onAdd={(v) => addToList("units", v)}
                onRemove={(v) => removeFromList("units", v)}
                placeholder="Nova unidade"
              />
            </div>
          </Card>

          {/* Seções da página pública */}
          <Card title="Por que trabalhar no CPPEM (cards)">
            <ContentListEditor
              items={settings.why_items}
              defaults={DEFAULT_WHY_ITEMS}
              onChange={(v) => set("why_items", v)}
              titleLabel="Título do card"
              textLabel="Texto do card"
              addLabel="Adicionar card"
              withIcon
            />
          </Card>

          <Card title="Como funciona o processo seletivo (etapas)">
            <ContentListEditor
              items={settings.process_steps}
              defaults={DEFAULT_PROCESS_STEPS}
              onChange={(v) => set("process_steps", v)}
              titleLabel="Nome da etapa"
              textLabel="O que acontece nessa etapa"
              addLabel="Adicionar etapa"
            />
          </Card>

          <Card title="Perguntas frequentes">
            <ContentListEditor
              items={settings.faq_items}
              defaults={DEFAULT_FAQ_ITEMS}
              onChange={(v) => set("faq_items", v)}
              titleLabel="Pergunta"
              textLabel="Resposta"
              addLabel="Adicionar pergunta"
            />
          </Card>

          {/* Página pública */}
          <Card title="Textos da página pública">
            <Field label="Nome da empresa">
              <input
                className="input"
                value={settings.company_name ?? ""}
                onChange={(e) => set("company_name", e.target.value)}
              />
            </Field>
            <Field label="Texto 'Sobre'">
              <textarea
                className="input min-h-32"
                value={settings.about_text ?? ""}
                onChange={(e) => set("about_text", e.target.value)}
              />
            </Field>
          </Card>

          {/* Indicadores */}
          <Card title="Indicadores institucionais">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Indicador 1">
                <input
                  className="input"
                  value={settings.stat_years ?? ""}
                  onChange={(e) => set("stat_years", e.target.value)}
                />
              </Field>
              <Field label="Indicador 2">
                <input
                  className="input"
                  value={settings.stat_students ?? ""}
                  onChange={(e) => set("stat_students", e.target.value)}
                />
              </Field>
              <Field label="Indicador 3">
                <input
                  className="input"
                  value={settings.stat_team ?? ""}
                  onChange={(e) => set("stat_team", e.target.value)}
                />
              </Field>
              <Field label="Indicador 4">
                <input
                  className="input"
                  value={settings.stat_extra ?? ""}
                  onChange={(e) => set("stat_extra", e.target.value)}
                />
              </Field>
            </div>
          </Card>

          {/* Formulário Notion */}
          <Card title="Formulário de candidatura (Notion)">
            <Field label="Link do formulário do Notion (usado enquanto as candidaturas pelo site estiverem desligadas)">
              <input
                className="input"
                value={settings.form_url ?? ""}
                onChange={(e) => set("form_url", e.target.value)}
              />
            </Field>
          </Card>

          {/* Redes sociais e links */}
          <Card title="Redes sociais e links">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="LinkedIn (único do grupo)">
                <input
                  className="input"
                  value={settings.linkedin_url ?? ""}
                  onChange={(e) => set("linkedin_url", e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                />
              </Field>
              <Field label="Grupo de WhatsApp (anúncios de vagas)">
                <input
                  className="input"
                  value={settings.whatsapp_group_url ?? ""}
                  onChange={(e) => set("whatsapp_group_url", e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                />
              </Field>
            </div>
          </Card>

          {/* Institucional */}
          <Card title="Informações institucionais (rodapé)">
            <Field label="Endereço / localização">
              <input
                className="input"
                value={settings.address ?? ""}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CNPJ">
                <input
                  className="input"
                  value={settings.cnpj ?? ""}
                  onChange={(e) => set("cnpj", e.target.value)}
                  placeholder="00.000.000/0001-00"
                />
              </Field>
              <Field label="Link da localização (Maps)">
                <input
                  className="input"
                  value={settings.maps_url ?? ""}
                  onChange={(e) => set("maps_url", e.target.value)}
                  placeholder="https://..."
                />
              </Field>
            </div>
            <Field label="E-mail para pedidos de privacidade (aparece na Política de Privacidade)">
              <input
                type="email"
                className="input"
                value={settings.privacy_email ?? ""}
                onChange={(e) => set("privacy_email", e.target.value)}
                placeholder="privacidade@seudominio.com.br"
              />
            </Field>
            <Field label="Descrição do rodapé">
              <textarea
                className="input min-h-20"
                value={settings.footer_description ?? ""}
                onChange={(e) => set("footer_description", e.target.value)}
              />
            </Field>
          </Card>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </form>
      )}
    </AdminLayout>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="card space-y-4 p-6">
      <legend className="px-2 text-sm font-semibold text-brand-500">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function ListEditor({
  label,
  items,
  onAdd,
  onRemove,
  placeholder,
}: {
  label: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");

  function handleAdd() {
    onAdd(value);
    setValue("");
  }

  return (
    <div>
      <label className="label">{label}</label>
      <ul className="mb-3 space-y-2">
        {items.length === 0 && (
          <li className="text-sm text-brand-400">Nenhum item.</li>
        )}
        {items.map((item) => (
          <li
            key={item}
            className="flex items-center justify-between rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-800"
          >
            <span>{item}</span>
            <button
              type="button"
              onClick={() => onRemove(item)}
              className="text-red-600 hover:text-red-700"
              title="Remover"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="btn-secondary !py-2 whitespace-nowrap"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
