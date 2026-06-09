import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SlateProvider } from "@/lib/store";
import { AppShell } from "@/components/AppShell";

/**
 * Fonts (Archivo display + IBM Plex Mono) load at runtime via Google Fonts
 * <link> tags below and are exposed to Tailwind through the --font-display /
 * --font-mono CSS variables defined in globals.css. (Swap to next/font/local
 * with bundled .woff2 files for fully self-hosted fonts in production.)
 */

export const metadata: Metadata = {
  title: "Daily Slate — Pick winners. Beat your friends.",
  description:
    "A daily sports pick'em game. Make your picks, lock your card, share it, and beat your friends.",
};

export const viewport: Viewport = {
  themeColor: "#08090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SlateProvider>
          <AppShell>{children}</AppShell>
        </SlateProvider>
      </body>
    </html>
  );
}
