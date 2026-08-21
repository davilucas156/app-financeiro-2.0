/**
 * As rotas internas do app.
 *
 * Um lugar só: a navegação lê daqui, e qualquer breadcrumb ou atalho futuro
 * também deve ler. Acrescentar uma rota interna é acrescentar uma entrada
 * aqui, não editar um `<nav>` à mão.
 *
 * ⚠ **Isto não é a lista de proteção.** `src/proxy.ts` mantém a dele à mão, de
 * propósito: derivar uma da outra faria remover um item daqui por motivo
 * visual tirar a rota da proteção junto, em silêncio.
 */
export type RotaInterna = {
  href: "/dashboard" | "/upload" | "/revisao" | "/regras";
  rotulo: string;
  /** Descrição para leitor de tela, já que o rótulo é curto. */
  descricao: string;
};

export const ROTAS_INTERNAS: RotaInterna[] = [
  { href: "/dashboard", rotulo: "Painel", descricao: "Painel do mês" },
  { href: "/upload", rotulo: "Enviar", descricao: "Enviar extrato" },
  { href: "/revisao", rotulo: "Revisar", descricao: "Revisar transações" },
  // A D9 trouxe a quarta. A 360px são 90px por item na barra inferior — o
  // rótulo cabe e o alvo continua acima de 44px.
  { href: "/regras", rotulo: "Regras", descricao: "Regras de classificação" },
];
