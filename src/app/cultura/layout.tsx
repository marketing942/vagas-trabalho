import PublicBase from "@/components/PublicBase";

export default function CulturaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicBase />
      {children}
    </>
  );
}
