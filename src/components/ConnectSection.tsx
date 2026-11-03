import SocialIcon from "./SocialIcon";
import TrackedLink from "./TrackedLink";

interface ConnectSectionProps {
  whatsappUrl: string | null;
  linkedinUrl: string | null;
}

/** "Fique por dentro": WhatsApp (vagas em primeira mão) e LinkedIn lado a lado. */
export default function ConnectSection({ whatsappUrl, linkedinUrl }: ConnectSectionProps) {
  if (!whatsappUrl && !linkedinUrl) return null;
  return (
    <section id="conecte-se" className="scroll-mt-20 pb-16 pt-4 sm:pb-20">
      <div className="container-page">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <span className="eyebrow">Fique por dentro</span>
          <h2 className="mt-3 text-3xl font-extrabold text-ink">Não perca nenhuma oportunidade</h2>
        </div>
        <div className={`grid gap-5 ${whatsappUrl && linkedinUrl ? "md:grid-cols-2" : ""}`}>
          {whatsappUrl && (
            <div className="card flex flex-col justify-between gap-6 p-7">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#25D366] text-white">
                  <SocialIcon name="whatsapp" className="h-7 w-7" />
                </span>
                <div>
                  <h3 className="text-xl font-bold text-ink">Receba as vagas em primeira mão</h3>
                  <p className="mt-1 text-sm leading-relaxed text-inksoft">
                    Entre no nosso grupo de WhatsApp e seja avisado(a) sempre que abrirmos novas oportunidades.
                  </p>
                </div>
              </div>
              <TrackedLink
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                event="whatsapp_grupo"
                eventProps={{ local: "secao" }}
                className="btn-primary self-start"
              >
                Entrar no grupo
                <span className="sr-only"> (abre em nova aba)</span>
              </TrackedLink>
            </div>
          )}
          {linkedinUrl && (
            <div className="flex flex-col justify-between gap-6 rounded-3xl bg-gradient-to-br from-brand-800 to-brand-900 p-7 shadow-soft">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-lg font-black text-[#122a5c]">
                  in
                </span>
                <div>
                  <h3 className="text-xl font-bold text-white">Conecte-se conosco no LinkedIn</h3>
                  <p className="mt-1 text-sm leading-relaxed text-brand-200">
                    Acompanhe novidades, vagas e a cultura do CPPEM Colégio e Cursos. Vamos crescer juntos.
                  </p>
                </div>
              </div>
              <TrackedLink
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                event="linkedin"
                eventProps={{ local: "secao" }}
                className="btn-ghost self-start"
              >
                Seguir no LinkedIn
                <span className="sr-only"> (abre em nova aba)</span>
              </TrackedLink>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
