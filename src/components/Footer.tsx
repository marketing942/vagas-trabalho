import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { BRANDS } from "@/lib/constants";
import Logo from "./Logo";
import Icon from "./Icon";
import SocialIcon from "./SocialIcon";

interface FooterProps {
  settings: SiteSettings;
}

/**
 * Rodapé enxuto: marcas, redes de cada marca, endereço e dados legais
 * em duas faixas baixas (ocupa pouco espaço vertical).
 */
export default function Footer({ settings }: FooterProps) {
  // LinkedIn do grupo (configurável) substitui o padrão do CPPEM Concursos
  const brands = BRANDS.map((b) =>
    b.id === "cppem" && settings.linkedin_url
      ? {
          ...b,
          socials: b.socials.map((s) => (s.key === "linkedin" ? { ...s, href: settings.linkedin_url! } : s)),
        }
      : b
  );

  return (
    <footer className="bg-brand-900 text-brand-100">
      <div className="h-1 bg-gradient-to-r from-transparent via-accent-500 to-transparent" />

      <div className="container-page grid gap-5 py-6 sm:py-8 md:grid-cols-[auto_minmax(0,1fr)] md:items-center lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-10">
        {/* Marcas */}
        <div>
          <div className="flex items-center gap-3">
            <Logo variant="cppem" className="h-10 sm:h-12" />
            <span className="h-9 w-px bg-white/25" aria-hidden />
            <Logo variant="colegio" className="h-10 sm:h-12" />
          </div>
          {settings.footer_description && <p className="mt-2 hidden max-w-[17rem] text-xs leading-relaxed text-brand-300 sm:block">{settings.footer_description}</p>}
        </div>

        {/* Redes de cada marca, em uma linha por marca */}
        <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-3" aria-label="Nossas redes">
          {brands.map((brand) => (
            <li key={brand.id} className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-bold text-white">
                <span className="truncate">{brand.name}</span>
                {brand.site && (
                  <a
                    href={brand.site.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={brand.site.label}
                    aria-label={`${brand.site.label} — ${brand.name}`}
                    className="text-accent-300 transition-colors hover:text-accent-200"
                  >
                    <Icon name="arrow" className="h-3.5 w-3.5 -rotate-45" />
                  </a>
                )}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {brand.socials.map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.label} — ${brand.name}`}
                    title={s.label}
                    className="grid h-8 w-8 place-items-center rounded-full border border-accent-300/40 bg-white/5 text-accent-200 transition-colors hover:border-accent-300 hover:bg-accent-300 hover:text-brand-950"
                  >
                    <SocialIcon name={s.key} className="h-[15px] w-[15px]" />
                  </a>
                ))}
                {brand.socials.length === 0 && <span className="text-xs text-brand-300">Redes em breve.</span>}
              </div>
            </li>
          ))}
        </ul>

        {/* Localização */}
        <div className="flex items-start gap-2.5 text-xs leading-relaxed text-brand-200 md:col-span-2 lg:col-span-1 lg:max-w-[16rem]">
          <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-accent-300" />
          <p>
            {settings.address}
            {settings.maps_url && (
              <>
                {" "}
                <a href={settings.maps_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent-300 underline underline-offset-2 hover:text-accent-200">
                  Ver no mapa
                </a>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 py-3 sm:py-4">
        <div className="container-page flex flex-col items-center justify-between gap-1.5 text-center text-xs text-brand-300 sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} {settings.company_name}
            {settings.cnpj ? ` · CNPJ ${settings.cnpj}` : ""}
          </p>
          <Link href="/privacidade" className="font-semibold text-accent-300 underline underline-offset-4 transition-colors hover:text-accent-200">
            Política de Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
