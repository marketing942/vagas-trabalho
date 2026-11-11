"use client";

import { useEffect } from "react";

/**
 * Faz os blocos marcados com data-reveal aparecerem suavemente ao entrar na tela.
 * Só esconde depois que o JavaScript carrega (sem JS, tudo continua visível).
 */
export default function Revelar() {
  useEffect(() => {
    const raiz = document.querySelector<HTMLElement>(".ci-root");
    if (!raiz) return;
    const itens = Array.from(raiz.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (typeof IntersectionObserver === "undefined") return;

    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            obs.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    raiz.classList.add("ci-ready");
    itens.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return null;
}
