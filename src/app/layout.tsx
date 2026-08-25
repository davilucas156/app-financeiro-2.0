import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Syne, DM_Mono } from "next/font/google";
import { temaAtual } from "@/features/aparencia/tema/temaAtual";
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

/*
 * ⚠ **Metadata e viewport viraram funções na spec 08, e não por gosto.**
 *
 * A moldura que o **sistema** desenha em volta do app instalado não é CSS: ela
 * é decidida por estas duas metas, no HTML, antes de a página existir. Com
 * valores fixos, o tema claro abriria com uma faixa preta em cima (o
 * `themeColor`) e com o relógio do iPhone em branco sobre fundo claro (o
 * `black-translucent`) — invisível.
 *
 * ⚠ **"Seguir o sistema" aqui vira o padrão, e é a única perda conhecida da
 * spec.** Estas metas são hex, não variável, e o servidor não tem como saber a
 * configuração do aparelho. Quem escolhe "sistema" num celular claro fica com
 * o app claro e a barra do sistema escura. É uma faixa de 40px numa tela só, e
 * não fica errado — fica menos bonito. Escolher "claro" resolve.
 */
export async function generateMetadata(): Promise<Metadata> {
  const claro = (await temaAtual()) === "claro";

  return {
    title: "Painel Financeiro 6 Potes",
    description: "Controle financeiro pessoal pelo método dos 6 potes.",

    /*
     * O que muda quando o app é aberto pelo ícone da tela inicial (spec 07).
     *
     * O `<link rel="manifest">` o Next emite sozinho a partir de `manifest.ts`;
     * o `apple-touch-icon`, a partir de `app/apple-icon.png`. O que **não** sai
     * de nenhum dos dois é o bloco abaixo: o iOS ignora o manifesto inteiro e
     * lê estas metas antigas.
     */
    applicationName: "6 Potes",
    appleWebApp: {
      capable: true,
      title: "6 Potes",
      /*
       * ⚠ **`black-translucent` no escuro, `default` no claro.** A
       * `black-translucent` desenha o relógio do iPhone em **branco**; sobre
       * uma tela clara ele some. A `default` desenha em preto e é a certa aqui.
       *
       * É a spec 07 ao contrário: lá, `default` pintaria uma faixa clara em
       * cima de um app `#060608`.
       */
      statusBarStyle: claro ? "default" : "black-translucent",
    },

    /*
     * ⚠ **`format-detection` desligado.** O Safari transforma sequências de
     * dígitos em links de telefone, e esta é uma tela cheia de números com
     * ponto e vírgula. Um valor virando botão de ligação no meio do painel
     * seria engraçado uma vez e irritante todo mês.
     */
    formatDetection: { telephone: false },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const claro = (await temaAtual()) === "claro";

  return {
    /*
     * A cor da barra do sistema quando instalado. A mesma `--color-bg` do tema
     * em uso, para a moldura do sistema desaparecer dentro do app em vez de
     * emoldurá-lo.
     */
    themeColor: claro ? "#eeeef3" : "#060608",

    /*
     * ⚠ **`viewportFit: "cover"` por causa do `black-translucent`.** Com a
     * barra de status transparente, o conteúdo passa a começar embaixo do
     * entalhe do iPhone — o `cover` é o que libera as `safe-area-inset-*` do
     * CSS para o cabeçalho se afastar dele.
     *
     * Fica nos dois temas: no claro a barra é opaca, mas as `safe-area` do
     * rodapé (a barra de gestos) continuam valendo.
     */
    viewportFit: "cover",
  };
}

/**
 * ⚠ **`afterSignOutUrl` é opção do `<ClerkProvider>` no Core 3**, não prop do
 * `<UserButton />`. Passada no botão, ela compila e não faz nada.
 *
 * O destino é `/entrar` e não `/`: quem acabou de sair não tem sessão, e `/`
 * só o mandaria para `/entrar` de qualquer forma — um salto a mais e uma
 * piscada de tela.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  /*
   * ⚠ **O tema é decidido no servidor, e é o que impede a piscada** (descoberta
   * 5 da spec 08). Lido no cliente depois de montar, ele custaria uma piscada
   * escura em toda abertura para quem escolheu claro — e num app que se abre uma
   * vez por mês, essa piscada é a primeira coisa que a pessoa vê.
   *
   * É a **raiz** e não a moldura de `(app)` porque `/entrar`, `/cadastrar` e
   * `/bem-vindo` estão fora dela e precisam do tema igual. `/entrar` é
   * justamente a primeira tela que alguém vê.
   */
  const tema = await temaAtual();

  return (
    <ClerkProvider afterSignOutUrl="/entrar">
      <html
        lang="pt-br"
        data-tema={tema}
        className={`${syne.variable} ${dmMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
