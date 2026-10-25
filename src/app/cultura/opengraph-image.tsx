import { ImageResponse } from "next/og";
import { OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Nossa cultura | CPPEM Colégio e Cursos";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    await ogCard({
      eyebrow: "Nossa cultura",
      title: "Os 10 mandamentos do CPPEM",
      meta: "A forma como trabalhamos e como não trabalhamos, sem enrolação.",
    }),
    { ...size }
  );
}
