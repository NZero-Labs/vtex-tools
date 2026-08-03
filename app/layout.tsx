import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/newsreader";

import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "VTEX Tools", template: "%s · VTEX Tools" },
  description: "Ferramentas internas VTEX da Amara Net Zero.",
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico" },
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-dvh">
        <Providers>
          <a
            href="#main-content"
            className="bg-primary text-primary-foreground fixed top-3 left-3 z-50 -translate-y-20 rounded-lg px-4 py-2 font-semibold transition-transform focus:translate-y-0"
          >
            Pular para o conteúdo
          </a>
          {children}
        </Providers>
      </body>
    </html>
  );
}
