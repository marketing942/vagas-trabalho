/**
 * A tríade dos valores: três círculos que se cruzam, com o encontro dos três no meio.
 * Aparece abaixo do texto de chegada ("Topo"), no fim da montanha da página /cultura.
 * Recebe os 3 títulos na ordem: em cima, embaixo à esquerda, embaixo à direita.
 */
const POSICOES = [
  { cx: 240, cy: 135, tx: 240, ty: 96, fill: "#d3b87f", opacidade: 0.3 }, // em cima
  { cx: 160, cy: 270, tx: 120, ty: 282, fill: "#6f89d1", opacidade: 0.36 }, // embaixo à esquerda
  { cx: 320, cy: 270, tx: 360, ty: 282, fill: "#f6ebcd", opacidade: 0.18 }, // embaixo à direita
];

export default function Triade({ valores }: { valores: string[] }) {
  return (
    <figure className="mt-10 w-full max-w-lg">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-brand-950 to-brand-800 p-5 shadow-xl sm:p-8">
        <svg
          viewBox="0 0 480 410"
          role="img"
          aria-label={`Tríade dos valores do CPPEM: ${valores.join(", ")}.`}
          className="h-auto w-full"
        >
          <defs>
            <radialGradient id="triade-brilho" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#fbf6e9" stopOpacity="0.55" />
              <stop offset="1" stopColor="#fbf6e9" stopOpacity="0" />
            </radialGradient>
          </defs>

          {POSICOES.map((p, i) => (
            <circle key={`f${i}`} cx={p.cx} cy={p.cy} r={120} fill={p.fill} fillOpacity={p.opacidade} />
          ))}
          {/* Encontro dos três valores */}
          <circle cx={240} cy={225} r={62} fill="url(#triade-brilho)" />
          {POSICOES.map((p, i) => (
            <circle key={`c${i}`} cx={p.cx} cy={p.cy} r={120} fill="none" stroke="#d3b87f" strokeOpacity={0.95} strokeWidth={2} />
          ))}
          {POSICOES.map((p, i) => (
            <text
              key={`t${i}`}
              x={p.tx}
              y={p.ty}
              textAnchor="middle"
              fontSize={21}
              fontWeight={800}
              fill="#ffffff"
              style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
            >
              {valores[i]}
            </text>
          ))}
        </svg>
      </div>
    </figure>
  );
}
