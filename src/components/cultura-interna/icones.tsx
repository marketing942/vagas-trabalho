import type { SVGProps } from "react";

export type NomeIcone =
  | "premio" | "grupo" | "alvo" | "balanca" | "crescimento"
  | "chefe" | "camadas" | "cadeado" | "terno" | "queda"
  | "coroa" | "moedas" | "predio" | "harpa" | "tabuas" | "trofeu";

const CAMINHOS: Record<NomeIcone, React.ReactNode> = {
  premio: (<><circle cx="12" cy="9" r="5.5" /><path d="M8.6 13.6 7 21.5l5-3 5 3-1.6-7.9" /></>),
  grupo: (<><circle cx="9" cy="8" r="3" /><path d="M3.5 19.5v-1a4.5 4.5 0 0 1 4.5-4.5h2a4.5 4.5 0 0 1 4.5 4.5v1" /><circle cx="17" cy="9" r="2.4" /><path d="M16.5 14.2a3.8 3.8 0 0 1 4 3.8v1.5" /></>),
  alvo: (<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.8" fill="currentColor" /><path d="m12 12 7-7M16 5h3v3" /></>),
  balanca: (<><path d="M12 4v16M7 20h10M5 7h14" /><path d="m5 7-3 7a3.2 3.2 0 0 0 6 0L5 7ZM19 7l-3 7a3.2 3.2 0 0 0 6 0l-3-7Z" /></>),
  crescimento: (<><path d="M4 20.5h16" /><rect x="5" y="13" width="3.5" height="7" rx=".6" /><rect x="10.3" y="9" width="3.5" height="11" rx=".6" /><rect x="15.6" y="4.5" width="3.5" height="15.5" rx=".6" /></>),
  chefe: (<><circle cx="12" cy="5.8" r="2.8" /><path d="M8 12.6c0-2.1 1.8-3.4 4-3.4s4 1.3 4 3.4" /><circle cx="5.5" cy="17" r="2" /><circle cx="18.5" cy="17" r="2" /><circle cx="12" cy="19" r="2" /></>),
  camadas: (<><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12.5 9 5 9-5M3 16.5l9 5 9-5" /></>),
  cadeado: (<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /><circle cx="12" cy="16" r="1.2" fill="currentColor" /></>),
  terno: (<><circle cx="12" cy="6.5" r="3" /><path d="M6 21v-3.5a6 6 0 0 1 12 0V21" /><path d="m12 12-1.5 3 1.5 5 1.5-5L12 12Z" /></>),
  queda: (<><path d="M4 20.5h16" /><rect x="5" y="5" width="3.5" height="15" rx=".6" /><rect x="10.3" y="10" width="3.5" height="10" rx=".6" /><rect x="15.6" y="15" width="3.5" height="5" rx=".6" /></>),
  coroa: (<><path d="m3 18 1.6-10 5 4.4L12 5l2.4 7.4L19.4 8 21 18H3Z" /><path d="M3 21h18" /></>),
  moedas: (<><ellipse cx="8.5" cy="17.5" rx="5.5" ry="2.5" /><path d="M3 17.5v-3c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v3M3 14.5v-3c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v3" /><ellipse cx="15.5" cy="8" rx="5.5" ry="2.5" /><path d="M10 8v3.2M21 8v6" /></>),
  predio: (<><path d="M4 21V5l8-2 8 2v16" /><path d="M9 21v-4h6v4M8 9h.01M12 9h.01M16 9h.01M8 13h.01M12 13h.01M16 13h.01" /></>),
  harpa: (<><path d="M7 20c-3-3-4-9-1-15 1.5 3 4.5 4.5 7 4.5 2.5 0 4-1.2 5-3.5 1 5-.5 10-4 14" /><path d="M7 20h10M10 9.500V20M13 9.500V20M16 8V20" /></>),
  tabuas: (<><path d="M3.500 20V9a3.500 3.500 0 0 1 7 0v11H3.500ZM13.500 20V9a3.500 3.500 0 0 1 7 0v11h-7Z" /><path d="M6 12h2M6 15h2M16 12h2M16 15h2" /></>),
  trofeu: (<><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 6H4v1.500A3.500 3.500 0 0 0 8 11M16 6h4v1.500A3.500 3.500 0 0 1 16 11M12 13v4M8.500 20h7M10 17h4v3h-4z" /></>),
};

export default function Icone({ nome, className = "h-6 w-6", ...resto }: { nome: NomeIcone } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden focusable="false" {...resto}>
      {CAMINHOS[nome]}
    </svg>
  );
}
