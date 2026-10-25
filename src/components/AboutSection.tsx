import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import Icon from "./Icon";

interface AboutSectionProps {
  settings: SiteSettings;
}

/** "Nossa missão": só o texto, centralizado e fácil de ler. */
export default function AboutSection({ settings }: AboutSectionProps) {
  return (
    <section id="por-que" className="py-14 sm:py-20">
      <div className="container-page max-w-3xl text-center">
        <span className="eyebrow">Nossa missão</span>
        <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
          Sobre o {settings.company_name}
        </h2>
        <p className="mt-6 hyphens-auto whitespace-pre-line text-justify text-lg leading-relaxed text-inksoft">{settings.about_text}</p>
        <Link href="/cultura" className="btn-secondary mt-8">
          Conheça a nossa cultura
          <Icon name="arrow" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
