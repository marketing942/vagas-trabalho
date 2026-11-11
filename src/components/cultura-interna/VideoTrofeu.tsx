"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  src: string;
  poster: string;
  titulo: string;
}

/**
 * Vídeo do troféu girando: toca sozinho (sem som, em loop) quando aparece na tela e pausa quando sai.
 * Quem prefere menos movimento vê só a imagem e aperta o botão para assistir.
 */
export default function VideoTrofeu({ src, poster, titulo }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [tocando, setTocando] = useState(false);
  const manual = useRef<"" | "pausado" | "tocando">("");

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (manual.current === "pausado" || (reduzido && manual.current !== "tocando")) return;
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    const aoTocar = () => setTocando(true);
    const aoPausar = () => setTocando(false);
    el.addEventListener("play", aoTocar);
    el.addEventListener("pause", aoPausar);
    return () => {
      obs.disconnect();
      el.removeEventListener("play", aoTocar);
      el.removeEventListener("pause", aoPausar);
    };
  }, []);

  const alternar = () => {
    const el = video.current;
    if (!el) return;
    if (el.paused) {
      manual.current = "tocando";
      el.play().catch(() => {});
    } else {
      manual.current = "pausado";
      el.pause();
    }
  };

  return (
    <div className="group relative aspect-video overflow-hidden rounded-3xl border border-[rgba(211,184,127,0.3)] bg-[#e9e9ea] shadow-[0_30px_70px_-34px_rgba(0,0,0,0.9)]">
      <video
        ref={video}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={titulo}
        className="h-full w-full object-cover"
      />
      <button
        type="button"
        onClick={alternar}
        aria-label={tocando ? `Pausar o vídeo: ${titulo}` : `Assistir ao vídeo: ${titulo}`}
        className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-[#f6e3a8] opacity-90 backdrop-blur transition hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d3b87f] sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
      >
        {tocando ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
