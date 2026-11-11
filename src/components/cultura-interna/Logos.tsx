/** As duas marcas juntas (CPPEM e Colégio CPPEM): a cultura vale para as duas. `tam` é a altura (classe do Tailwind). */
export default function Logos({ tam = "h-9", prioridade = false, className = "" }: { tam?: string; prioridade?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.45em] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logos/cppem.png" alt="CPPEM" width={480} height={480} fetchPriority={prioridade ? "high" : undefined} className={`${tam} w-auto object-contain`} />
      <span aria-hidden className="h-[70%] w-px self-center bg-gradient-to-b from-transparent via-[#d3b87f]/70 to-transparent" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logos/colegio.png" alt="Colégio CPPEM" width={480} height={480} fetchPriority={prioridade ? "high" : undefined} className={`${tam} w-auto object-contain`} />
    </span>
  );
}
