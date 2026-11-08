"use client";

import type { ContentItem } from "@/lib/types";

const ICON_OPTIONS: { value: string; label: string }[] = [
  { value: "spark", label: "Brilho (crescimento)" },
  { value: "cap", label: "Capelo (estudo)" },
  { value: "heart", label: "Coração (propósito)" },
  { value: "building", label: "Prédio (sede)" },
  { value: "star", label: "Estrela (reconhecimento)" },
  { value: "check", label: "Visto" },
  { value: "users", label: "Pessoas (equipe)" },
  { value: "book", label: "Livro" },
  { value: "briefcase", label: "Maleta (trabalho)" },
  { value: "sun", label: "Sol" },
];

interface ContentListEditorProps {
  /** Itens salvos. `null` = ainda usando o texto padrão. */
  items: ContentItem[] | null | undefined;
  /** Texto padrão (mostrado enquanto nada foi editado e usado em "Restaurar"). */
  defaults: ContentItem[];
  onChange: (items: ContentItem[] | null) => void;
  titleLabel: string;
  textLabel: string;
  addLabel: string;
  /** Mostra a escolha de ícone (só para os cards de "Por que trabalhar"). */
  withIcon?: boolean;
}

/** Editor de lista de textos (título + texto) com adicionar, remover e reordenar. */
export default function ContentListEditor({
  items,
  defaults,
  onChange,
  titleLabel,
  textLabel,
  addLabel,
  withIcon = false,
}: ContentListEditorProps) {
  const usingDefaults = !items;
  const list = items ?? defaults;

  const update = (index: number, patch: Partial<ContentItem>) =>
    onChange(list.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const remove = (index: number) => onChange(list.filter((_, i) => i !== index));

  const smallBtn =
    "rounded-md border border-line2 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-40";

  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-500">
        {usingDefaults
          ? "Hoje a página usa os textos padrão abaixo. Edite qualquer um para personalizar."
          : "Textos personalizados."}
      </p>

      {list.map((item, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-brand-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <label className="label">{titleLabel}</label>
              <input
                className="input"
                value={item.title}
                onChange={(e) => update(i, { title: e.target.value })}
              />
            </div>
            {withIcon && (
              <div>
                <label className="label">Ícone</label>
                <select
                  className="input"
                  value={item.icon ?? ""}
                  onChange={(e) => update(i, { icon: e.target.value })}
                >
                  <option value="">Automático</option>
                  {ICON_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="label">{textLabel}</label>
            <textarea
              className="input min-h-20"
              value={item.text}
              onChange={(e) => update(i, { text: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={smallBtn} onClick={() => move(i, -1)} disabled={i === 0}>
              ↑ Subir
            </button>
            <button type="button" className={smallBtn} onClick={() => move(i, 1)} disabled={i === list.length - 1}>
              ↓ Descer
            </button>
            <button
              type="button"
              className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              onClick={() => remove(i)}
            >
              Remover
            </button>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-secondary !py-2 text-sm"
          onClick={() => onChange([...list, { title: "", text: "" }])}
        >
          + {addLabel}
        </button>
        {!usingDefaults && (
          <button
            type="button"
            className="btn-secondary !py-2 text-sm"
            onClick={() => {
              if (confirm("Voltar aos textos padrão? As suas edições desta seção serão perdidas.")) onChange(null);
            }}
          >
            Restaurar textos padrão
          </button>
        )}
      </div>
    </div>
  );
}
