import Link from "next/link";
import Icon, { type IconName } from "./Icon";

interface HeroProps {
  openJobsCount: number;
  areasCount: number;
  /** Indicadores institucionais (editáveis no admin): viram cartões flutuantes. */
  stats: string[];
}

const ICONS: IconName[] = ["calendar", "cap", "users", "heart"];
// deslocamentos e tempos diferentes: dá a sensação de "flutuar" sem ficar uma grade rígida
const OFFSETS = ["lg:translate-y-0", "lg:translate-y-10", "lg:-translate-y-2", "lg:translate-y-8"];
const DELAYS = ["0s", "1.2s", "2.4s", "0.6s"];

/**
 * Hero acolhedor: fundo azul-marinho com brilhos dourados e, à direita,
 * os números da empresa como cartões flutuantes com ícones.
 */
export default function Hero({ openJobsCount, areasCount, stats }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700">
      <div className="pointer-events-none absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-accent-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-[30rem] w-[30rem] rounded-full bg-brand-400/20 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />

      <div className="container-page relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-brand-50">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent-300" />
            Estamos contratando · Caruaru-PE
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl lg:text-[3.4rem]">
            Construa sua carreira na empresa que{" "}
            <span className="bg-gradient-to-r from-accent-200 to-accent-500 bg-clip-text text-transparent">
              transforma vidas
            </span>{" "}
            pela educação.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-brand-100">
            No CPPEM Colégio e Cursos você faz parte de um time que ensina, acolhe e ajuda
            milhares de pessoas a conquistarem seus sonhos.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#vagas" className="btn-primary">
              Ver vagas abertas
              <Icon name="arrow" className="h-4 w-4" />
            </a>
            <Link href="/cultura" className="btn-ghost">
              Nossa cultura
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-4 text-white">
            <div>
              <p className="font-display text-3xl font-extrabold">{openJobsCount}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">Vagas abertas</p>
            </div>
            <div className="h-10 w-px bg-white/20" aria-hidden />
            <div>
              <p className="font-display text-3xl font-extrabold">{areasCount}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">Áreas</p>
            </div>
          </div>
        </div>

        {/* Números da empresa: cartões flutuantes com ícones */}
        <div className="relative">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-500/10 blur-3xl" />
          <ul className="relative grid grid-cols-2 gap-4 sm:gap-5">
            {stats.slice(0, 4).map((stat, i) => {
              const [first, ...rest] = stat.split(" ");
              const numeric = /^[+\d]/.test(first);
              return (
                <li
                  key={i}
                  className={`animate-float rounded-3xl bg-surface p-5 shadow-lift ${OFFSETS[i % OFFSETS.length]}`}
                  style={{ animationDelay: DELAYS[i % DELAYS.length] }}
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-goldsoft text-goldink">
                    <Icon name={ICONS[i % ICONS.length]} className="h-6 w-6" />
                  </span>
                  {numeric ? (
                    <div className="mt-4 leading-tight">
                      <p className="font-display text-3xl font-extrabold text-ink">{first}</p>
                      <p className="mt-1 text-sm text-inksoft">{rest.join(" ")}</p>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm font-semibold leading-snug text-ink">{stat}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* curva de transição para o creme */}
      <div className="h-10 rounded-t-[44px] bg-canvas" />
    </section>
  );
}
