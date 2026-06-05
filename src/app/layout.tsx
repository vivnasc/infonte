import type { Metadata, Viewport } from "next";
import { EB_Garamond, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { RegistarSW } from "@/components/RegistarSW";
import "./globals.css";

const serif = EB_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://infonte.vivannedossantos.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "infonte, um percurso em sete etapas",
  description:
    "A abundância não responde a quem a persegue, responde a quem se basta. Um percurso de Vivianne dos Santos, da Sete Ecos.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "infonte",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "infonte, um percurso em sete etapas",
    description:
      "Da dispersão à ação concreta. Sete etapas, ferramentas que ficam para a vida.",
    url: SITE_URL,
    siteName: "Infonte",
    locale: "pt_PT",
    type: "website",
    images: [{ url: "/vivianne-ambiente.jpg", width: 1200, height: 750 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "infonte, um percurso em sete etapas",
    description:
      "A abundância não responde a quem a persegue, responde a quem se basta.",
    images: ["/vivianne-ambiente.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/favicon-180.png", sizes: "180x180", type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#2E1D12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <body className="font-sans bg-creme text-terra-texto min-h-screen">
        {children}
        <RegistarSW />
        <Analytics />
      </body>
    </html>
  );
}
