import type { Metadata, Viewport } from "next";
import { EB_Garamond, Inter } from "next/font/google";
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

export const metadata: Metadata = {
  title: "infonte, um percurso em sete etapas",
  description:
    "A abundância não responde a quem a persegue, responde a quem se basta. Um percurso de Vivianne dos Santos, da Sete Ecos.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/favicon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#2E1D12",
  width: "device-width",
  initialScale: 1,
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
      </body>
    </html>
  );
}
