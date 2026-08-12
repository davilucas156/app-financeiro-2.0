import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Syne, DM_Mono } from "next/font/google";
import "./globals.css";

// Syne é fonte variável: carrega a faixa de pesos inteira, sem `weight`.
const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

// DM Mono é estática: só publica 300, 400 e 500.
const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Painel Financeiro 6 Potes",
  description: "Controle financeiro pessoal pelo método dos 6 potes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="pt-br"
        className={`${syne.variable} ${dmMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
