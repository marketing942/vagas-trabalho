/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // As imagens de compartilhamento (Open Graph) leem as logos de public/logos
  // em tempo de execução. Isto garante que esses arquivos acompanhem a função
  // na hospedagem (Vercel).
  outputFileTracingIncludes: {
    "/opengraph-image": ["./public/logos/**/*"],
    "/carreiras/[slug]/opengraph-image": ["./public/logos/**/*"],
    "/cultura/opengraph-image": ["./public/logos/**/*"],
  },
  async redirects() {
    return [
      // A raiz leva para a página de vagas. O Next repassa a query string
      // (ex.: /?categoria=professor -> /carreiras?categoria=professor),
      // então links compartilhados com filtros não perdem o filtro.
      { source: "/", destination: "/carreiras", permanent: false },
    ];
  },
};

module.exports = nextConfig;
