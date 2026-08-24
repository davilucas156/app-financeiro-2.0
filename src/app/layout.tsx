import type { Metadata, Viewport } from "next";
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

  /*
   * O que muda quando o app é aberto pelo ícone da tela inicial (spec 07).
   *
   * O `<link rel="manifest">` o Next emite sozinho a partir de `manifest.ts`;
   * o `apple-touch-icon`, a partir de `app/apple-icon.png`. O que **não** sai
   * de nenhum dos dois é o bloco abaixo: o iOS ignora o manifesto inteiro e lê
   * estas metas antigas.
   */
  applicationName: "6 Potes",
  appleWebApp: {
    capable: true,
    title: "6 Potes",
    /*
     * ⚠ **`black-translucent` e não `default`.** O app é escuro; com
     * `default`, o iOS pinta a barra de status de branco e sobra uma faixa
     * clara em cima de uma tela `#060608`.
     */
    statusBarStyle: "black-translucent",
  },

  /*
   * ⚠ **`format-detection` desligado.** O Safari transforma sequências de
   * dígitos em links de telefone, e esta é uma tela cheia de números com
   * ponto e vírgula. Um valor virando botão de ligação no meio do painel
   * seria engraçado uma vez e irritante todo mês.
   */
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  /*
   * A cor da barra do sistema quando instalado. A mesma `--color-bg`, para a
   * moldura do sistema desaparecer dentro do app em vez de emoldurá-lo.
   */
  themeColor: "#060608",

  /*
   * ⚠ **`viewportFit: "cover"` por causa do `black-translucent`.** Com a barra
   * de status transparente, o conteúdo passa a começar embaixo do entalhe do
   * iPhone — o `cover` é o que libera as `safe-area-inset-*` do CSS para o
   * cabeçalho se afastar dele.
   */
  viewportFit: "cover",
};

/**
 * ⚠ **`afterSignOutUrl` é opção do `<ClerkProvider>` no Core 3**, não prop do
 * `<UserButton />`. Passada no botão, ela compila e não faz nada.
 *
 * O destino é `/entrar` e não `/`: quem acabou de sair não tem sessão, e `/`
 * só o mandaria para `/entrar` de qualquer forma — um salto a mais e uma
 * piscada de tela.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider afterSignOutUrl="/entrar">
      <html
        lang="pt-br"
        className={`${syne.variable} ${dmMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
