import Link from "next/link";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import TrackedLink from "./TrackedLink";

interface HeaderProps {
  formUrl: string;
}

/** Cabeçalho branco e limpo: as duas marcas, o link da cultura e o botão de candidatura. */
export default function Header({ formUrl }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 shadow-soft backdrop-blur">
      <div className="container-page flex h-[68px] items-center justify-between gap-4">
        <Link href="/carreiras" className="flex min-w-0 items-center gap-2 sm:gap-3" aria-label="CPPEM Colégio e Cursos — Carreiras">
          <Logo variant="cppem" className="h-12 sm:h-[60px] -my-1" />
          <span className="h-9 w-px bg-line" aria-hidden />
          <Logo variant="colegio" className="h-12 sm:h-[60px] -my-1" />
        </Link>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <Link
            href="/cultura"
            className="rounded-full px-1.5 py-2 text-sm font-semibold max-[400px]:text-[13px] text-ink transition-colors hover:bg-canvas2 focus:outline-none focus-visible:ring-2 focus-visible:ring-goldink sm:px-4"
          >
            Cultura
          </Link>
          <ThemeToggle />
          <TrackedLink
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            event="candidatar"
            eventProps={{ local: "cabecalho" }}
            className="btn-primary whitespace-nowrap !px-4 !py-2.5 max-[400px]:!px-3 max-[400px]:!text-[13px] sm:!px-5"
          >
            Candidatar-se
            <span className="sr-only"> (abre em nova aba)</span>
          </TrackedLink>
        </div>
      </div>
    </header>
  );
}
