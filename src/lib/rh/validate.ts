import { AGE_OPTIONS, RESUME_MAX_BYTES, RESUME_TYPES, SOURCE_OPTIONS } from "./constants";

/** Campos do formulário de candidatura (os mesmos do Notion). */
export interface ApplicationFields {
  vagas: string[];
  nome: string;
  email: string;
  whatsapp: string;
  social: string;
  idade: string;
  cidade: string;
  sobre: string;
  origem: string[];
  consentimento: boolean;
}

export type FieldErrors = Partial<Record<keyof ApplicationFields | "curriculo", string>>;

export const ABOUT_MIN = 30;
export const ABOUT_MAX = 5000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

/** Máscara do WhatsApp: (81) 9 9999-9999 */
export function formatWhatsapp(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 3) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
}

export function validateFields(f: ApplicationFields): FieldErrors {
  const e: FieldErrors = {};
  if (!f.vagas.length) e.vagas = "Escolha pelo menos uma vaga.";
  const nome = f.nome.trim();
  if (nome.split(/\s+/).filter(Boolean).length < 2 || nome.length < 5) e.nome = "Escreva seu nome completo.";
  else if (nome.length > 120) e.nome = "Nome muito longo.";
  if (!EMAIL_RE.test(f.email.trim()) || f.email.length > 160) e.email = "Informe um e-mail válido.";
  const d = onlyDigits(f.whatsapp);
  if (d.length < 10 || d.length > 13) e.whatsapp = "Informe o WhatsApp com DDD, ex.: (81) 9 9999-9999.";
  if (f.social.trim().length < 3) e.social = "Informe o link do seu Instagram ou LinkedIn.";
  else if (f.social.length > 300) e.social = "Link muito longo.";
  if (!AGE_OPTIONS.includes(f.idade)) e.idade = "Escolha a sua idade.";
  if (f.cidade.trim().length < 2) e.cidade = "Informe a cidade onde você mora.";
  else if (f.cidade.length > 120) e.cidade = "Nome da cidade muito longo.";
  const sobre = f.sobre.trim();
  if (sobre.length < ABOUT_MIN) e.sobre = `Conte um pouco mais sobre você (mínimo de ${ABOUT_MIN} caracteres).`;
  else if (sobre.length > ABOUT_MAX) e.sobre = `Use no máximo ${ABOUT_MAX} caracteres.`;
  if (!f.origem.length || f.origem.some((o) => !SOURCE_OPTIONS.includes(o))) e.origem = "Marque como você encontrou a vaga.";
  if (!f.consentimento) e.consentimento = "É preciso concordar com a Política de Privacidade para enviar.";
  return e;
}

export function validateResumeMeta(size: number, type: string): string | null {
  if (size > RESUME_MAX_BYTES) return "O currículo precisa ter até 4 MB. Se for foto, envie em PDF ou diminua a imagem.";
  if (!RESUME_TYPES[type]) return "Envie o currículo em PDF, Word (DOC/DOCX) ou imagem (JPG/PNG).";
  return null;
}

/** Confere a "assinatura" do arquivo, para não aceitar arquivo disfarçado. */
export function resumeSignatureOk(bytes: Uint8Array, type: string): boolean {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  switch (type) {
    case "application/pdf":
      return starts(0x25, 0x50, 0x44, 0x46); // %PDF
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return starts(0x50, 0x4b, 0x03, 0x04); // zip
    case "application/msword":
      return starts(0xd0, 0xcf, 0x11, 0xe0);
    case "image/jpeg":
      return starts(0xff, 0xd8, 0xff);
    case "image/png":
      return starts(0x89, 0x50, 0x4e, 0x47);
    case "image/webp":
      return starts(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45;
    default:
      return false;
  }
}
