import type { Metadata } from "next";
import "./cultura-interna.css";

// Página interna da equipe: fora do Google e sem aparecer em nenhum link público.
export const metadata: Metadata = {
  title: { absolute: "Cultura CPPEM | Interno" },
  description: "Material interno da equipe CPPEM sobre a nossa cultura.",
  robots: { index: false, follow: false, nocache: true },
};

export default function CulturaInternaLayout({ children }: { children: React.ReactNode }) {
  return <div className="ci-root">{children}</div>;
}
