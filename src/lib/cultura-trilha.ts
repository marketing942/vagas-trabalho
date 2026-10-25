/**
 * Geometria da trilha da página /cultura: o desenho da montanha e o caminho
 * que o ponto percorre enquanto a pessoa rola a página.
 *
 * `pontos` tem 12 posições: 0 = pé da montanha, 1 a 10 = um mandamento cada
 * (os checkpoints) e 11 = o topo, onde fica a bandeira.
 * Existem duas montanhas: uma alta (computador, ao lado do texto) e uma larga
 * (celular, fixa no alto da tela).
 */

export interface Ponto {
  x: number;
  y: number;
}

export interface Trilha {
  largura: number;
  altura: number;
  pontos: Ponto[];
  /** Uma curva por trecho (pontos[i] → pontos[i + 1]), passando por todos os checkpoints. */
  trechos: string[];
  raio: number;
  fonte: number;
  espessura: number;
  /** Desenho da montanha, do fundo para a frente. */
  fundo: string;
  montanha: string;
  /** Face da montanha que fica na sombra. */
  sombra: string;
  neve: string;
  estrelas: Ponto[];
  bandeira: { mastro: number; largura: number; altura: number; fonte: number };
}

/** Curva suave (Catmull-Rom → Bézier) entre dois checkpoints vizinhos. */
function trecho(p: Ponto[], i: number): string {
  const a = p[i - 1] ?? p[i];
  const b = p[i];
  const c = p[i + 1];
  const e = p[i + 2] ?? c;
  const f = (n: number) => n.toFixed(1);
  return `M${f(b.x)} ${f(b.y)} C${f(b.x + (c.x - a.x) / 6)} ${f(b.y + (c.y - a.y) / 6)} ${f(c.x - (e.x - b.x) / 6)} ${f(c.y - (e.y - b.y) / 6)} ${f(c.x)} ${f(c.y)}`;
}

function trechos(p: Ponto[]): string[] {
  return p.slice(0, -1).map((_, i) => trecho(p, i));
}

/** Estrelas fixas (sempre as mesmas, para o servidor e o navegador desenharem igual). */
function estrelas(n: number, largura: number, altura: number, semente: number, margem: number): Ponto[] {
  let s = semente;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  return Array.from({ length: n }, () => ({ x: Math.round(rnd() * (largura + 2 * margem)) - margem, y: Math.round(rnd() * altura) }));
}

const P = (x: number, y: number): Ponto => ({ x, y });

/* ---------- Montanha alta (computador) ---------- */
const altaPontos: Ponto[] = [
  P(96, 596), // pé da montanha
  P(392, 552),
  P(118, 508),
  P(392, 464),
  P(138, 420),
  P(376, 376),
  P(162, 332),
  P(352, 288),
  P(188, 244),
  P(330, 200),
  P(234, 160),
  P(270, 88), // topo
];

export const TRILHA_ALTA: Trilha = {
  largura: 480,
  altura: 640,
  pontos: altaPontos,
  trechos: trechos(altaPontos),
  raio: 7,
  fonte: 13,
  espessura: 4.5,
  fundo: "M-200 640 L-200 320 L-110 290 L-60 316 L-20 330 L30 300 L62 322 L104 262 L140 290 L172 236 L200 262 L214 300 L330 300 L346 252 L384 282 L420 244 L452 276 L500 250 L560 290 L620 262 L700 320 L700 640 Z",
  montanha:
    "M270 84 L250 112 L219 140 L199 168 L182 196 L158 224 L127 252 L109 280 L80 308 L50 336 L24 364 L4 392 L-17 420 L-47 448 L-63 476 L-83 504 L-106 532 L-142 560 L-165 588 L-182 616 L-209 640 L743 640 L719 616 L695 588 L670 560 L649 532 L632 504 L599 476 L579 448 L555 420 L533 392 L506 364 L477 336 L459 308 L442 280 L415 252 L384 224 L371 196 L337 168 L315 140 L299 112 L270 84 Z",
  sombra: "M270 84 L268 140 L265 196 L285 252 L263 308 L271 364 L271 420 L268 476 L282 532 L265 588 L265 640 L743 640 L719 616 L695 588 L670 560 L649 532 L632 504 L599 476 L579 448 L555 420 L533 392 L506 364 L477 336 L459 308 L442 280 L415 252 L384 224 L371 196 L337 168 L315 140 L299 112 L270 84 Z",
  neve: "M270 84 L250 112 L219 140 L238 134 L252 152 L268 138 L284 158 L298 140 L315 140 L299 112 Z",
  estrelas: estrelas(30, 480, 190, 7, 70),
  bandeira: { mastro: 52, largura: 82, altura: 28, fonte: 15 },
};

/* ---------- Montanha larga (celular) ---------- */
const largaPontos: Ponto[] = [
  P(24, 196), // pé da montanha
  P(51, 179),
  P(78, 178),
  P(105, 161),
  P(132, 160),
  P(159, 143),
  P(186, 142),
  P(213, 125),
  P(240, 124),
  P(267, 107),
  P(294, 106),
  P(326, 58), // topo
];

export const TRILHA_LARGA: Trilha = {
  largura: 400,
  altura: 210,
  pontos: largaPontos,
  trechos: trechos(largaPontos),
  raio: 5.5,
  fonte: 10.5,
  espessura: 3.5,
  fundo: "M-300 210 L-300 140 L-240 112 L-200 128 L-150 100 L-110 118 L-72 96 L-10 140 L36 118 L66 134 L108 100 L142 118 L184 86 L226 104 L262 84 L292 112 L320 100 L420 160 L480 130 L520 150 L560 120 L600 140 L600 210 Z",
  montanha:
    "M-400 210 L-130 210 L-124 208 L-94 199 L-64 188 L-34 178 L-4 169 L26 162 L56 148 L86 142 L116 129 L146 118 L176 108 L206 98 L236 86 L266 76 L296 66 L326 58 L342 76 L356 70 L374 98 L388 92 L404 140 L420 152 L446 168 L474 192 L500 210 L600 210 Z",
  sombra: "M326 58 L342 76 L356 70 L374 98 L388 92 L404 140 L420 152 L446 168 L474 192 L500 210 L302 210 L312 150 L322 102 Z",
  neve: "M326 58 L296 66 L286 76 L294 70 L304 88 L314 76 L320 92 L326 78 L334 92 L342 76 Z",
  estrelas: estrelas(30, 400, 70, 11, 200),
  bandeira: { mastro: 40, largura: 62, altura: 21, fonte: 11.5 },
};
