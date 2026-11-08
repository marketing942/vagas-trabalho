"use client";

import { useEffect, useRef } from "react";

const EMOJIS = [
  "✅", "🚀", "💡", "📍", "🎯", "⭐", "📚", "💼", "🤝", "🔥", "📈", "🏆",
];

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

/**
 * Editor de texto simples com formatação (negrito, itálico, listas) e
 * inserção de emojis. Armazena HTML. Usado nos campos de conteúdo das vagas.
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Escreva aqui...",
  minHeight = "min-h-28",
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Inicializa o conteúdo apenas uma vez (componente não-controlado)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emit() {
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function exec(command: string) {
    ref.current?.focus();
    document.execCommand(command, false);
    emit();
  }

  function insertEmoji(emoji: string) {
    ref.current?.focus();
    document.execCommand("insertText", false, emoji);
    emit();
  }

  return (
    <div className="rounded-lg border border-brand-200 bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200">
      <div className="flex flex-wrap items-center gap-1 border-b border-stone-200 p-2">
        <button
          type="button"
          onClick={() => exec("bold")}
          className="toolbar-btn font-bold"
          title="Negrito"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => exec("italic")}
          className="toolbar-btn italic"
          title="Itálico"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => exec("insertUnorderedList")}
          className="toolbar-btn"
          title="Lista"
        >
          • Lista
        </button>
        <span className="mx-1 h-5 w-px bg-brand-100" />
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => insertEmoji(e)}
            className="rounded px-1.5 py-1 text-base leading-none hover:bg-brand-50"
            title={`Inserir ${e}`}
          >
            {e}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        data-placeholder={placeholder}
        className={`richtext richtext-editor ${minHeight} w-full px-4 py-3 text-sm text-brand-950 focus:outline-none`}
      />
    </div>
  );
}
