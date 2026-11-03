"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import SocialIcon from "./SocialIcon";

interface ExitIntentPopupProps {
  /** Link do grupo de WhatsApp de vagas (configurado no admin). Sem link, nada é exibido. */
  whatsappUrl: string | null;
}

const DISMISS_KEY = "cppem_wa_popup_dismissed_at";
const JOINED_KEY = "cppem_wa_popup_joined";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // não insiste por 7 dias após fechar
const ARM_AFTER_MS = 5_000; // ignora saídas "sem querer" logo na chegada

function recentlyDismissed(): boolean {
  try {
    if (localStorage.getItem(JOINED_KEY)) return true;
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return at > 0 && Date.now() - at < COOLDOWN_MS;
  } catch {
    return false;
  }
}

/**
 * Pop-up de "intenção de saída": quando a pessoa vai fechar a página,
 * convida para o grupo de WhatsApp que avisa as vagas novas.
 *  - Computador: o mouse sai pela borda de cima da janela (rumo às abas / botão de fechar).
 *  - Celular: rolagem rápida para cima depois de ter lido boa parte da página.
 * Aparece no máximo uma vez por visita e, se for fechado, só volta depois de 7 dias.
 */
export default function ExitIntentPopup({ whatsappUrl }: ExitIntentPopupProps) {
  const [open, setOpen] = useState(false);
  const shownRef = useRef(false);
  const joinRef = useRef<HTMLAnchorElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!whatsappUrl || recentlyDismissed()) return;

    let armed = false;
    const armTimer = setTimeout(() => (armed = true), ARM_AFTER_MS);
    const show = () => {
      if (!armed || shownRef.current) return;
      shownRef.current = true;
      setOpen(true);
    };

    // Computador: mouse saindo pela parte de cima da janela
    const onMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget && e.clientY <= 0) show();
    };
    document.addEventListener("mouseout", onMouseOut);

    // Celular: rolagem rápida para cima após ler boa parte da página
    let lastY = window.scrollY;
    let maxY = window.scrollY;
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;
    const onScroll = () => {
      const y = window.scrollY;
      maxY = Math.max(maxY, y);
      if (coarse && lastY - y > 140 && maxY > 900) show();
      lastY = y;
    };
    if (coarse) window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(armTimer);
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", onScroll);
    };
  }, [whatsappUrl]);

  // Fecha com ESC, leva o foco para o botão principal, mantém o foco do teclado
  // dentro da janela (Tab não "escapa" para a página atrás) e devolve o foco ao
  // lugar de onde veio quando fecha.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    joinRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismiss();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, dismiss]);

  if (!open || !whatsappUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-brand-950/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={dismiss}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wa-popup-title"
        className="relative w-full max-w-md animate-fade-up rounded-3xl bg-surface p-8 text-center shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-inkmuted transition-colors hover:bg-canvas2 hover:text-ink"
        >
          <span aria-hidden className="text-xl leading-none">×</span>
        </button>

        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#25D366] text-white">
          <SocialIcon name="whatsapp" className="h-9 w-9" />
        </span>

        <h2 id="wa-popup-title" className="mt-5 text-2xl font-extrabold leading-tight text-ink">
          Antes de ir: quer saber das próximas vagas?
        </h2>
        <p className="mt-3 leading-relaxed text-inksoft">
          Entre no nosso grupo de WhatsApp e seja avisado(a) em primeira mão sempre que abrirmos uma
          nova oportunidade no CPPEM Colégio e Cursos.
        </p>

        <a
          ref={joinRef}
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            trackEvent("whatsapp_grupo", { local: "popup" });
            try {
              localStorage.setItem(JOINED_KEY, "1");
            } catch {}
            setOpen(false);
          }}
          className="btn-primary mt-7 w-full"
        >
          Entrar no grupo do WhatsApp
        </a>
        <button
          type="button"
          onClick={dismiss}
          className="mt-3 text-sm font-medium text-inkmuted underline-offset-4 hover:text-ink hover:underline"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
