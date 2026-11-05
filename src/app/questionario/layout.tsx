import PublicBase from "@/components/PublicBase";

export default function AgendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicBase />
      {children}
    </>
  );
}
