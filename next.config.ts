import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Garante que os markdowns ficam disponíveis em runtime nas serverless
  // functions (para os endpoints de seed lerem o conteúdo do repo).
  outputFileTracingIncludes: {
    "/api/admin/seed/**": [
      "./content/**/*.md",
      "./infonte-campanha-30-dias/**/*.md",
    ],
  },
};

export default withNextIntl(nextConfig);
