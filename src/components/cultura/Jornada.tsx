"use client";

import { useEffect, useId, useRef, useState } from "react";
import { TRILHA_ALTA, TRILHA_LARGA, type Trilha } from "@/lib/cultura-trilha";

interface JornadaProps {
  items: string[];
  /** Trecho de cada mandamento que ganha destaque (mesma ordem de `items`). */
  highlights: string[];
}

const pad = (n: number) => String(n).padStart(2, "0");
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const suaviza = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Quebra o texto em volta do trecho destacado. */
function Highlighted({ text, mark }: { text: string; mark: string }) {
  const at = mark ? text.indexOf(mark) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="underline decoration-accent-500 decoration-[5px] underline-offset-[6px] [text-decoration-skip-ink:none]">{mark}</span>
      {text.slice(at + mark.length)}
    </>
  );
}

/**
 * A montanha. Tudo que depende da rolagem (trecho percorrido e posição do ponto)
 * é atualizado direto no SVG pelo `Jornada`; aqui só ficam o desenho e o estado
 * de cada checkpoint (`ativo`: 0 = pé da montanha, 1 a 10 = mandamento, 11 = topo).
 */
function Montanha({ trilha, variante, ativo }: { trilha: Trilha; variante: "alta" | "larga"; ativo: number }) {
  const uid = useId().replace(/:/g, "");
  const { pontos, trechos, raio, fonte, espessura, largura, altura, bandeira } = trilha;
  const pe = pontos[0];
  const topo = pontos[pontos.length - 1];
  const chegou = ativo === pontos.length - 1;
  const checkpoints = pontos.slice(1, -1);

  return (
    <svg
      data-montanha={variante}
      viewBox={`0 0 ${largura} ${altura}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full overflow-visible"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-rocha`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3b4c80" />
          <stop offset="1" stopColor="#1f2f62" />
        </linearGradient>
        <linearGradient id={`${uid}-neve`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbf6e9" />
          <stop offset="1" stopColor="#c3d0e6" />
        </linearGradient>
        <linearGradient id={`${uid}-ouro`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6ebcd" />
          <stop offset="0.55" stopColor="#d3b87f" />
          <stop offset="1" stopColor="#c9ae7a" />
        </linearGradient>
        <linearGradient id={`${uid}-neblina`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f2150" stopOpacity="0" />
          <stop offset="1" stopColor="#0f2150" stopOpacity="0.9" />
        </linearGradient>
        <filter id={`${uid}-brilho`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uid}-halo`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {trilha.estrelas.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={i % 5 === 0 ? 1.3 : 0.8} fill="#fff" opacity={i % 3 === 0 ? 0.55 : 0.28} />
      ))}

      <path d={trilha.fundo} fill="#142355" />
      <path d={trilha.montanha} fill={`url(#${uid}-rocha)`} stroke="#fff" strokeOpacity="0.14" strokeWidth="1" strokeLinejoin="round" />
      <path d={trilha.sombra} fill="#071230" opacity="0.38" />
      <path d={trilha.neve} fill={`url(#${uid}-neve)`} opacity="0.92" strokeLinejoin="round" />
      <rect x="-400" y={altura * 0.78} width={largura + 800} height={altura * 0.22 + 2} fill={`url(#${uid}-neblina)`} />

      {/* Trilha ainda por andar */}
      <g fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth={espessura * 0.55} strokeLinecap="round" strokeDasharray={`0.1 ${espessura * 2.3}`}>
        {trechos.map((d, i) => (
          <path key={i} d={d} data-trecho={i} />
        ))}
      </g>

      {/* Trecho já percorrido (preenchido conforme a rolagem) */}
      <g fill="none" stroke="#d3b87f" strokeWidth={espessura} strokeLinecap="round" filter={`url(#${uid}-brilho)`}>
        {trechos.map((d, i) => (
          <path key={i} d={d} data-feito={i} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} />
        ))}
      </g>

      {/* Pé da montanha */}
      <circle cx={pe.x} cy={pe.y} r={raio * 0.8} fill="#0f2150" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.5" />
      {variante === "alta" && (
        <text x={pe.x + raio + 8} y={pe.y} dy=".35em" fontSize={fonte - 2} fontWeight={700} letterSpacing="2.2" fill="#fff" fillOpacity="0.6" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>
          INÍCIO
        </text>
      )}

      {/* Checkpoints: um por mandamento */}
      {checkpoints.map((p, k) => {
        const n = k + 1;
        const feito = n < ativo || (n === ativo && ativo > 0) || chegou;
        const atual = n === ativo;
        const esquerda = p.x < largura / 2;
        const acima = n % 2 === 1;
        const rx = variante === "alta" ? p.x + (esquerda ? -(raio + 10) : raio + 10) : p.x;
        const ry = variante === "alta" ? p.y : p.y + (acima ? -(raio + 4) : raio + 3);
        return (
          <g key={n} data-checkpoint={n}>
            <circle
              cx={p.x}
              cy={p.y}
              r={atual ? raio * 1.25 : raio}
              fill={feito ? "#d3b87f" : "#0f2150"}
              stroke={feito ? "#f6ebcd" : "#fff"}
              strokeOpacity={feito ? 1 : 0.75}
              strokeWidth={atual ? 2.5 : 1.8}
              style={{ transition: "fill .3s, r .3s" }}
            />
            <text
              x={rx}
              y={ry}
              dy={variante === "alta" ? ".35em" : acima ? "0" : ".8em"}
              textAnchor={variante === "alta" ? (esquerda ? "end" : "start") : "middle"}
              fontSize={atual ? fonte + 2 : fonte}
              fontWeight={800}
              fill={atual ? "#f6ebcd" : "#fff"}
              fillOpacity={atual ? 1 : feito ? 0.85 : 0.6}
              style={{ fontFamily: "var(--font-display), system-ui, sans-serif", transition: "fill .3s, fill-opacity .3s" }}
            >
              {pad(n)}
            </text>
          </g>
        );
      })}

      {/* Bandeira do topo */}
      <g transform={`translate(${topo.x} ${topo.y})`}>
        <circle cx="0" cy={-bandeira.mastro * 0.55} r={bandeira.mastro * 0.9} fill="#d3b87f" filter={`url(#${uid}-halo)`} style={{ opacity: chegou ? 0.4 : 0, transition: "opacity .7s ease" }} />
        <g
          style={{
            opacity: chegou ? 1 : 0.4,
            transform: chegou ? "none" : "translateY(7px)",
            transition: "opacity .6s ease, transform .6s ease",
          }}
        >
          <line x1="0" y1="0" x2="0" y2={-bandeira.mastro} stroke="#fff" strokeWidth={raio * 0.45} strokeLinecap="round" />
          <path
            d={`M0 ${-bandeira.mastro} H${bandeira.largura} L${bandeira.largura - bandeira.altura * 0.4} ${-bandeira.mastro + bandeira.altura / 2} L${bandeira.largura} ${-bandeira.mastro + bandeira.altura} H0 Z`}
            fill={`url(#${uid}-ouro)`}
          />
          <text
            x={bandeira.largura * 0.14}
            y={-bandeira.mastro + bandeira.altura / 2}
            dy=".35em"
            fontSize={bandeira.fonte}
            fontWeight={800}
            letterSpacing="1.6"
            fill="#071230"
            style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
          >
            TOPO
          </text>
        </g>
      </g>

      {/* O ponto que sobe */}
      <g data-escalador transform={`translate(${pe.x} ${pe.y})`}>
        <circle r={raio * 3} fill="#d3b87f" opacity="0.28" />
        <circle r={raio * 1.55} fill="#fbf6e9" stroke="#071230" strokeWidth={raio * 0.35} />
      </g>
    </svg>
  );
}

/**
 * Os mandamentos como uma subida: conforme a pessoa rola, um ponto avança pela
 * trilha de uma montanha e cada mandamento é um checkpoint, até passar do último
 * e chegar ao topo, onde fica a bandeira.
 * O texto continua sendo uma lista comum: sem JavaScript, tudo segue legível.
 */
export default function Jornada({ items, highlights }: JornadaProps) {
  const [ativo, setAtivo] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const alvos = useRef<(HTMLElement | null)[]>([]);
  const ultimo = items.length + 1; // posição do topo

  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const grande = window.matchMedia("(min-width: 1024px)");
    const montanhas = Array.from(el.querySelectorAll<SVGSVGElement>("svg[data-montanha]")).map((svg) => ({
      svg,
      trechos: Array.from(svg.querySelectorAll<SVGPathElement>("path[data-trecho]")),
      feitos: Array.from(svg.querySelectorAll<SVGPathElement>("path[data-feito]")),
      escalador: svg.querySelector<SVGGElement>("g[data-escalador]"),
      comprimentos: null as number[] | null,
    }));

    let atual = 0;
    let pedido = 0;

    const atualizar = () => {
      pedido = 0;
      const pontos = alvos.current.filter((a): a is HTMLElement => !!a);
      if (pontos.length < 2 || !painel.current) return;

      // Linha de leitura: onde a pessoa está lendo (meio da área visível).
      const vh = window.innerHeight;
      const topoUtil = 68 + (grande.matches ? 0 : painel.current.offsetHeight);
      const leitura = topoUtil + (vh - topoUtil) * (grande.matches ? 0.5 : 0.32);

      // Âncoras: o centro de cada mandamento, mais o topo; antes do primeiro, o pé da montanha.
      const centros = pontos.map((a) => {
        const r = a.getBoundingClientRect();
        return r.top + r.height / 2;
      });
      const ancoras = [centros[0] - (centros[1] - centros[0]) * 0.25, ...centros];

      let p = ancoras.length - 1;
      for (let j = 0; j < ancoras.length - 1; j++) {
        if (leitura < ancoras[j + 1]) {
          const local = clamp((leitura - ancoras[j]) / (ancoras[j + 1] - ancoras[j]), 0, 1);
          p = j + suaviza(local);
          break;
        }
      }

      const proximo = Math.round(p);
      if (proximo !== atual) {
        atual = proximo;
        setAtivo(proximo);
      }

      const k = Math.min(Math.floor(p), ancoras.length - 2);
      const frac = clamp(p - k, 0, 1);
      for (const m of montanhas) {
        if (!m.svg.getClientRects().length) continue; // montanha escondida neste tamanho de tela
        m.comprimentos ??= m.trechos.map((t) => t.getTotalLength());
        m.feitos.forEach((f, i) => f.setAttribute("stroke-dashoffset", String(1 - clamp(p - i, 0, 1))));
        const pt = m.trechos[k].getPointAtLength(frac * m.comprimentos[k]);
        m.escalador?.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      }
    };

    const agendar = () => {
      if (!pedido) pedido = requestAnimationFrame(atualizar);
    };

    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar);
    agendar();
    return () => {
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
      if (pedido) cancelAnimationFrame(pedido);
    };
  }, []);

  const chegou = ativo === ultimo;
  const rotulo = ativo === 0 ? "Pé da montanha" : chegou ? "Você chegou" : "Mandamento";

  return (
    <div ref={raiz} className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
      {/* A montanha: fixa no alto da tela (celular) ou ao lado do texto (computador) */}
      <div
        ref={painel}
        className="sticky top-[68px] z-20 -mx-4 h-[210px] overflow-hidden border-b border-white/10 bg-gradient-to-b from-brand-950 to-brand-800 sm:-mx-6 sm:h-[240px] lg:top-24 lg:z-0 lg:mx-0 lg:h-[calc(100svh-8rem)] lg:max-h-[740px] lg:self-start lg:rounded-3xl lg:border lg:border-white/10"
      >
        <div className="absolute inset-0 hidden lg:block">
          <Montanha trilha={TRILHA_ALTA} variante="alta" ativo={ativo} />
        </div>
        <div className="absolute inset-0 lg:hidden">
          <Montanha trilha={TRILHA_LARGA} variante="larga" ativo={ativo} />
        </div>

        <div data-contador aria-hidden className="pointer-events-none absolute left-4 top-3 sm:left-6 lg:left-7 lg:top-6">
          <p className="font-eyebrow text-[0.7rem] font-bold uppercase tracking-[0.2em] text-accent-300 lg:text-xs">{rotulo}</p>
          {chegou ? (
            <p className="font-display text-4xl font-extrabold leading-none text-white lg:text-6xl">Topo</p>
          ) : (
            <p className="font-display text-4xl font-extrabold leading-none tabular-nums text-white lg:text-6xl">
              {pad(ativo)}
              <span className="ml-1.5 text-lg font-bold text-white/45 lg:text-2xl">/ {items.length}</span>
            </p>
          )}
        </div>
      </div>

      {/* Os mandamentos */}
      <div>
        <ol className="pt-[6vh] lg:pt-[14vh]">
          {items.map((text, i) => (
            <li
              key={text}
              id={`mandamento-${i + 1}`}
              ref={(el) => {
                alvos.current[i] = el;
              }}
              className={`flex min-h-[30svh] flex-col justify-center py-5 transition-opacity duration-300 lg:min-h-[52vh] ${
                ativo >= 1 && ativo !== i + 1 ? "opacity-30" : "opacity-100"
              }`}
            >
              <span className="font-eyebrow text-sm font-bold uppercase tracking-[0.2em] text-goldink">Mandamento {pad(i + 1)}</span>
              <p className="mt-3 text-[1.75rem] font-extrabold leading-[1.12] tracking-tight text-ink sm:text-4xl lg:text-[2.6rem]">
                <span className="sr-only">Mandamento {i + 1}: </span>
                <Highlighted text={text} mark={highlights[i] ?? ""} />
              </p>
            </li>
          ))}
        </ol>

        {/* Chegada */}
        <div
          id="topo"
          ref={(el) => {
            alvos.current[items.length] = el;
          }}
          className="flex min-h-[48svh] flex-col justify-center py-8 lg:min-h-[78svh]"
        >
          <span className="eyebrow">Você chegou</span>
          <h3 className="mt-4 text-6xl font-extrabold leading-none tracking-tight text-ink sm:text-8xl">
            <span className="underline decoration-accent-500 decoration-[8px] underline-offset-[10px] [text-decoration-skip-ink:none]">Topo.</span>
          </h3>
          <p className="mt-8 max-w-xl text-xl leading-relaxed text-inksoft sm:text-2xl">
            É assim que a gente chega lá: um mandamento de cada vez, todos os dias.
          </p>

        </div>
      </div>
    </div>
  );
}
