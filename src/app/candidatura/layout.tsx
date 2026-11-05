import PublicBase from "@/components/PublicBase";

export default function CandidaturaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicBase />
      {children}
    </>
  );
}
