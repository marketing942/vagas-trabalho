"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Icon from "@/components/Icon";

export interface PickerOption {
  id: string;
  title: string;
  group: string;
  hint?: string;
}

interface Props {
  options: PickerOption[];
  value: string[];
  onChange: (next: string[]) => void;
  invalid?: boolean;
  describedBy?: string;
  labelledBy: string;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Seletor de vagas compacto: abre ao tocar, tem busca e permite marcar mais de uma.
 * Padrão de combobox com lista (ARIA 1.2): setas navegam, Enter/Espaço marcam, Esc fecha.
 */
export default function JobPicker({ options, value, onChange, invalid, describedBy, labelledBy }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const uid = useId();
  const listId = `${uid}-lista`;

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return q ? options.filter((o) => norm(`${o.title} ${o.group} ${o.hint ?? ""}`).includes(q)) : options;
  }, [options, query]);
  const groups = useMemo(() => Array.from(new Set(filtered.map((o) => o.group))), [filtered]);
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const selected = value.map((id) => byId.get(id)).filter(Boolean) as PickerOption[];

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Mantém a opção ativa visível na lista
  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  /** Marca/desmarca pela lista; se a pessoa buscou, limpa a busca para ver as outras vagas */
  const pick = (id: string) => {
    toggle(id);
    if (query) {
      setQuery("");
      setActive(Math.max(0, options.findIndex((o) => o.id === id)));
    }
  };

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      const n = filtered.length;
      if (n) setActive((a) => (e.key === "ArrowDown" ? (a + 1) % n : (a - 1 + n) % n));
    } else if (e.key === "Enter" || (e.key === " " && open && !query)) {
      e.preventDefault();
      if (!open) return setOpen(true);
      const opt = filtered[active];
      if (opt) pick(opt.id);
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    } else if (e.key === "Backspace" && !query && value.length) {
      onChange(value.slice(0, -1));
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={root} className="relative mt-3">
      <div
        className={`flex min-h-[3.25rem] cursor-text flex-wrap items-center gap-2 rounded-2xl border bg-surface px-3 py-2 transition-colors focus-within:border-accent-500 focus-within:ring-2 focus-within:ring-accent-500/25 ${
          invalid ? "border-bad" : "border-line2 hover:border-goldline"
        }`}
        onClick={() => {
          input.current?.focus();
          setOpen(true);
        }}
      >
        {selected.map((o) => (
          <span key={o.id} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-goldfaint py-1 pl-3 pr-1.5 text-sm font-semibold text-ink ring-1 ring-goldline">
            <span className="truncate">{o.title}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggle(o.id);
              }}
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-inksoft hover:bg-accent-500/20 hover:text-ink"
              aria-label={`Remover ${o.title}`}
            >
              <Icon name="close" className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <div className="flex min-w-[10rem] flex-1 items-center gap-2">
          <Icon name="search" className="h-4 w-4 shrink-0 text-inkmuted" />
          <input
            ref={input}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            aria-activedescendant={open && filtered[active] ? `${uid}-op-${filtered[active].id}` : undefined}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={selected.length ? "Adicionar outra vaga" : "Buscar vaga"}
            className="w-full min-w-0 bg-transparent py-1 text-[15px] text-ink outline-none placeholder:text-inkmuted"
            style={{ outline: "none" }} /* o contorno de foco fica na caixa inteira (focus-within) */
            autoComplete="off"
          />
        </div>
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
            input.current?.focus();
          }}
          className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full text-inksoft hover:bg-canvas2"
        >
          <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line2 bg-surface shadow-[0_18px_40px_-12px_rgba(15,23,42,0.28)]">
          <ul ref={list} id={listId} role="listbox" aria-multiselectable="true" aria-labelledby={labelledBy} className="max-h-72 overflow-y-auto overscroll-contain p-1.5">
            {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-inkmuted">Nenhuma vaga encontrada para “{query}”.</li>}
            {groups.map((g) => (
              <li key={g} role="presentation">
                <p className="px-3 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-inkmuted" aria-hidden>
                  {g}
                </p>
                <ul role="group" aria-label={g}>
                  {filtered
                    .filter((o) => o.group === g)
                    .map((o) => {
                      const i = filtered.indexOf(o);
                      const on = value.includes(o.id);
                      return (
                        <li
                          key={o.id}
                          id={`${uid}-op-${o.id}`}
                          role="option"
                          aria-selected={on}
                          data-index={i}
                          onPointerMove={() => setActive(i)}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pick(o.id)}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${i === active ? "bg-canvas2" : ""} ${on ? "font-semibold text-ink" : "text-inksoft"}`}
                        >
                          <span
                            aria-hidden
                            className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border ${on ? "border-accent-600 bg-accent-600 text-white" : "border-line2 bg-surface"}`}
                          >
                            {on && <Icon name="check" className="h-3 w-3" strokeWidth={3} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">{o.title}</span>
                            {o.hint && <span className="block truncate text-xs font-normal text-inkmuted">{o.hint}</span>}
                          </span>
                        </li>
                      );
                    })}
                </ul>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3 border-t border-line bg-canvas2/60 px-4 py-2.5 text-xs text-inkmuted">
            <span aria-live="polite">{value.length ? `${value.length} selecionada${value.length > 1 ? "s" : ""}` : "Pode marcar mais de uma"}</span>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-ink px-3.5 py-1.5 text-xs font-bold text-surface hover:opacity-90">
              Pronto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
