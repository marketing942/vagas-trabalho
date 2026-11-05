"use client";

import { useEffect, useRef, useState } from "react";

export interface MenuItem {
  label: string;
  onSelect: () => void;
  hint?: string;
  danger?: boolean;
  hidden?: boolean;
}

/** Botão com menu suspenso (fecha ao clicar fora ou com Esc). */
export default function ActionMenu({
  label,
  items,
  className,
  align = "right",
  ariaLabel,
}: {
  label: React.ReactNode;
  items: MenuItem[];
  className: string;
  align?: "left" | "right";
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => root.current && !root.current.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={ariaLabel} onClick={() => setOpen((v) => !v)} className={className}>
        {label}
      </button>
      {open && (
        <ul role="menu" className={`absolute top-full z-30 mt-1.5 w-72 rounded-2xl border border-brand-100 bg-white p-1.5 shadow-xl ${align === "right" ? "right-0" : "left-0"}`}>
          {items
            .filter((i) => !i.hidden)
            .map((i) => (
              <li key={i.label} role="none">
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    i.onSelect();
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm ${i.danger ? "text-rose-700 hover:bg-rose-50" : "text-brand-900 hover:bg-brand-50"}`}
                >
                  <span className="block font-semibold">{i.label}</span>
                  {i.hint && <span className="block text-xs text-brand-500">{i.hint}</span>}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
