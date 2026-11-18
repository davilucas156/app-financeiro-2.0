/**
 * A coluna de conteúdo do app: largura máxima e recuo lateral.
 *
 * O cabeçalho e o `<main>` precisam dela igual para o "6 Potes" e o mês ficarem
 * alinhados com a primeira coluna do conteúdo. Duplicada em duas strings, uma
 * mudança em só uma delas quebraria o alinhamento sem erro nenhum; aqui a
 * medida mora num lugar só. Cada uso acrescenta por `cn()` o que é só dele.
 */
export const COLUNA_DO_APP = "mx-auto w-full max-w-5xl px-5";
