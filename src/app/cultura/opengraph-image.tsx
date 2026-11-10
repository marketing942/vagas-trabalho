import { ImageResponse } from "next/og";
import { OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Nossa cultura | CPPEM Colégio e Cursos";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    await ogCard({
      eyebrow: "Nossa cultura",
      title: "Os 3 valores do CPPEM",
      meta: "Fé inabalável, disciplina e proatividade. Sem enrolação.",
    }),
    { ...size }
  );
}
