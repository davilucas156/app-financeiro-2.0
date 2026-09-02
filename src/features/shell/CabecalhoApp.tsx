import Link from "next/link";
import { BotaoDoUsuario } from "@/features/aparencia/clerk/BotaoDoUsuario";
import type { Tema } from "@/features/aparencia/tema/tema";
import { NavegacaoPrincipal } from "@/features/shell/NavegacaoPrincipal";

/**
 * Cabeçalho da área interna — Server Component.
 *
 * Continua servidor mesmo importando o `<UserButton />`: o widget já vem
 * marcado como cliente pelo próprio Clerk.
 *
 * Perdeu a prop `nome` na D8 — quem sabe o nome e a foto agora é o Clerk, e
 * sem foto o widget mostra iniciais sozinho. A moldura de `(app)` continua
 * chamando `garantirUsuario()`, que nunca foi por causa do nome: é a garantia
 * da linha no banco (D5) antes de qualquer filha ler por `user_id`.
 */
export function CabecalhoApp({
  mesReferencia,
  tema,
}: {
  mesReferencia: string;
  tema: Tema;
}) {
  return (
    /*
      ⚠ **`padding-top` da área segura (spec 07).**

      Instalado, o app roda com a barra de status transparente por cima da
      tela. Sem esta linha, o mês e o botão do usuário ficam embaixo do
      relógio do iPhone. No navegador o valor é zero e nada muda.
    */
    <header
      className="sticky top-0 z-10 border-b border-border bg-bg/92 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex h-[62px] w-full max-w-5xl items-center gap-4 px-5">
        <div className="min-w-0">
          <p className="font-mono text-4xs font-bold tracking-[2px] text-primary uppercase">
            6 Potes
          </p>
          <p className="truncate text-sm font-bold">{mesReferencia}</p>
        </div>

        {/* No desktop a navegação vive aqui; no mobile, na barra inferior. */}
        <NavegacaoPrincipal
          variante="topo"
          className="ml-auto hidden md:flex"
        />

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {/*
            ⚠ **A engrenagem, e não um quinto item na barra** (tarefa B3 da
            spec 08). São 4 itens de navegação desde a D9, e a 360px isso já é
            90px cada; um quinto derrubaria o alvo de toque abaixo dos 44px.

            Aqui ela custa 44px de um canto que hoje só tem o avatar, e fica
            alcançável de **toda** tela interna — o que a barra também daria,
            sem o preço.
          */}
          <Link
            href="/configuracoes"
            aria-label="Configurações"
            className="pressiona flex size-11 items-center justify-center rounded-pote text-dim hover:bg-card2 hover:text-text"
          >
            <Engrenagem />
          </Link>

          <BotaoDoUsuario tema={tema} />
        </div>
      </div>
    </header>
  );
}

/**
 * Engrenagem em `currentColor`, desenhada e não importada.
 *
 * O projeto não tem biblioteca de ícones, e trazer uma para um símbolo seria
 * pagar um pacote inteiro pelo primeiro uso. `currentColor` faz ela seguir o
 * `text-dim`/`text-text` do link — e, por tabela, os dois temas.
 */
function Engrenagem() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
