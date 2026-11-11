import { cookies } from "next/headers";
import Acesso from "@/components/cultura-interna/Acesso";
import BarraCapitulos from "@/components/cultura-interna/BarraCapitulos";
import Dicionario from "@/components/cultura-interna/Dicionario";
import Hero from "@/components/cultura-interna/Hero";
import Simbolos from "@/components/cultura-interna/Simbolos";
import Fecho from "@/components/cultura-interna/Fecho";
import Herois from "@/components/cultura-interna/Herois";
import Praticas from "@/components/cultura-interna/Praticas";
import Revelar from "@/components/cultura-interna/Revelar";
import Valores from "@/components/cultura-interna/Valores";
import { acessoLiberado, COOKIE_ACESSO } from "./acesso";

// Lê o cookie de acesso a cada visita: nunca é gerada de antemão.
export const dynamic = "force-dynamic";

const CAPITULOS = [
  { id: "dicionario", rotulo: "Dicionário" },
  { id: "simbolos", rotulo: "Símbolos" },
  { id: "herois", rotulo: "Heróis" },
  { id: "praticas", rotulo: "Práticas" },
  { id: "valores", rotulo: "Valores" },
];

export default async function CulturaInternaPage() {
  const jar = await cookies();
  if (!acessoLiberado(jar.get(COOKIE_ACESSO)?.value)) return <Acesso />;

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-[#d3b87f] focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-black"
      >
        Pular para o conteúdo
      </a>
      <BarraCapitulos itens={CAPITULOS} />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <Hero />
        <Dicionario />
        <Simbolos />
        <Herois />
        <Praticas />
        <Valores />
        <Fecho />
      </main>
      <Revelar />
    </>
  );
}
