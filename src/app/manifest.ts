import type { MetadataRoute } from "next";

/**
 * O que o celular precisa saber para instalar o app (spec 07).
 *
 * A documentação do Next é explícita sobre o que basta: **manifesto válido e
 * HTTPS**. Não há service worker aqui, e a ausência é decisão, não esquecimento
 * — ver `specs/07-instalar-no-celular.md`. Cachear tela de app financeiro
 * autenticado é como um painel de agosto continuar mostrando julho depois de
 * uma reclassificação, sem ninguém saber por quê.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Painel Financeiro 6 Potes",
    /*
     * ⚠ **12 caracteres, contados.** É o rótulo embaixo do ícone na tela
     * inicial, e o Android e o iOS cortam com reticências o que passar disso.
     * "Painel Financeiro" viraria "Painel Fina…", que não identifica nada.
     */
    short_name: "6 Potes",
    description: "Controle financeiro pessoal pelo método dos 6 potes.",

    /*
     * ⚠ **`/` e não `/dashboard`.**
     *
     * A raiz já decide para onde mandar (spec 01, D6): quem não tem sessão vai
     * para `/entrar`, quem não concluiu o onboarding vai para `/bem-vindo`.
     * Apontar direto para o painel faria o ícone da tela inicial abrir uma
     * página que redireciona — uma piscada em toda abertura.
     */
    start_url: "/",

    display: "standalone",
    background_color: "#060608", // --color-bg: a mesma tela de abertura do app
    theme_color: "#060608",
    lang: "pt-BR",
    dir: "ltr",

    /*
     * ⚠ **Sem `orientation`.** Travar em retrato pouparia um caso de layout e
     * tiraria do Davi a escolha de virar o celular para ler a lista de
     * lançamentos, que é justamente a tela mais larga do app.
     */

    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      /*
       * O Android recorta o ícone da tela inicial num círculo. Sem uma versão
       * `maskable`, ele recorta a `any` — e os potes das pontas saem cortados.
       * O desenho maskable é o mesmo, menor dentro do mesmo quadrado.
       */
      {
        src: "/icone-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
