import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { Tema } from "@/features/aparencia/tema/tema";
import { SeletorDeTema } from "./SeletorDeTema";

/**
 * `/configuracoes` — a tela de preferências (tarefa B2 da spec 08).
 *
 * ## Uma tela com uma seção, e ela é honesta
 *
 * Hoje só existe aparência. A tentação era encher a tela com o que já existe em
 * outro lugar — sair, categorias, regras — mas duas delas já estão na barra de
 * navegação e a terceira tem o próprio caminho. Repetir atalho não é
 * configuração; é a tela pedindo desculpa por estar vazia.
 *
 * Ela é uma tela, e não um menuzinho suspenso, porque é aqui que a próxima
 * preferência vai cair.
 */
export function TelaDeConfiguracoes({ tema }: { tema: Tema }) {
  return (
    <>
      {/*
        A volta explícita, como na `/categorias` (B2 da spec 07): a rota fica
        fora da barra de navegação, e no app instalado não existe botão de
        voltar — sobra o gesto de borda, que funciona e não aparece.
      */}
      <Link
        href="/dashboard"
        className="inline-flex min-h-11 items-center font-mono text-3xs font-bold tracking-wider text-dim uppercase transition-colors hover:text-text"
      >
        ← Painel
      </Link>

      <SectionTitle className="mt-2">Configurações</SectionTitle>

      <section className="mt-6">
        <p className="font-mono text-4xs font-bold tracking-[1.5px] text-dim uppercase">
          Aparência
        </p>

        <Card className="mt-2">
          <p className="text-xs leading-relaxed text-dim">
            A escolha vale{" "}
            <strong className="font-bold text-text">neste aparelho</strong>. O
            mesmo login em outro celular ou no computador pode ter outra.
          </p>

          <div className="mt-4">
            <SeletorDeTema escolhido={tema} />
          </div>
        </Card>
      </section>
    </>
  );
}
