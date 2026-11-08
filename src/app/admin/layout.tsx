// A área administrativa é privada e depende de dados em tempo real,
// portanto nunca deve ser gerada estaticamente no build.
export const dynamic = "force-dynamic";

export const metadata = {
  // Nome do sistema na aba do navegador em toda a área administrativa
  title: { absolute: "RH CPPEM" },
  robots: { index: false, follow: false },
};

export default function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
