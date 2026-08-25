"use client";

import { UserButton } from "@clerk/nextjs";
import { aparenciaClerk } from "@/features/autenticacao/aparencia-clerk";
import type { Tema } from "@/features/aparencia/tema/tema";
import { useTemaEfetivo } from "@/features/aparencia/tema/useTemaEfetivo";

/**
 * O `<UserButton />` acompanhando o tema (tarefa D1 da spec 08).
 *
 * ## Por que um componente de cliente para um widget que já é de cliente
 *
 * Porque o `appearance` precisa ser **escolhido**, e a escolha depende de algo
 * que só o navegador sabe quando o tema é "seguir o sistema". O `CabecalhoApp`
 * é servidor e continua sendo; o que atravessa a fronteira é a preferência
 * crua, e a resolução acontece aqui.
 *
 * O menu do Clerk só monta depois da hidratação de qualquer jeito — então
 * resolver o tema neste ponto não atrasa nada que já não estivesse esperando.
 */
export function BotaoDoUsuario({ tema }: { tema: Tema }) {
  return <UserButton appearance={aparenciaClerk(useTemaEfetivo(tema))} />;
}
