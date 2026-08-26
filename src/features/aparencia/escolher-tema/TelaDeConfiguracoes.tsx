import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SeletorDeLetra } from "@/features/aparencia/escolher-letra/SeletorDeLetra";
import type { Tamanho } from "@/features/aparencia/letra/letra";
import type { Tema } from "@/features/aparencia/tema/tema";
import { SeletorDeTema } from "./SeletorDeTema";

/**
 * `/configuracoes` — a tela de preferências (spec 08 B2, spec 10 D3).
 *
 * ## A aposta da spec 08 se pagou
 *
 * Esta tela nasceu com **uma** seção, e o comentário que estava aqui defendia
 * que ela fosse tela e não menuzinho suspenso porque *"é aqui que a próxima
 * preferência vai cair"*. Duas specs depois, caiu: o tamanho da letra.
 *
 * A tentação naquele dia era encher a tela com o que já existia em outro lugar
 * — sair, categorias, regras. Se ela tivesse cedido, hoje o tamanho da letra
 * entraria numa lista de atalhos em vez de numa tela de preferências.
 *
 * ## As duas seções valem para o aparelho, e a frase diz isso uma vez
 *
 * ⚠ **A frase sobe, não se repete.** Tema e tamanho são a mesma decisão
 * ("vale neste aparelho, não nesta conta") tomada duas vezes; escrita dentro de
 * cada cartão, ela seria a mesma advertência lida duas vezes na mesma rolagem.
 *
 * ## Continua fora da barra de navegação
 *
 * A volta explícita, como na `/categorias` (B2 da spec 07): no app instalado não
 * existe botão de voltar — sobra o gesto de borda, que funciona e não aparece.
 */
export function TelaDeConfiguracoes({
  tema,
  letra,
}: {
  tema: Tema;
  letra: Tamanho;
}) {
  return (
    <>
      <Link
        href="/dashboard"
        className="inline-flex min-h-11 items-center font-mono text-4xs font-bold tracking-wider text-dim uppercase transition-colors hover:text-text"
      >
        ← Painel
      </Link>

      <SectionTitle className="mt-2">Configurações</SectionTitle>

      <p className="text-xs leading-relaxed text-dim">
        As escolhas abaixo valem{" "}
        <strong className="font-bold text-text">neste aparelho</strong>. O mesmo
        login em outro celular ou no computador pode ter outras.
      </p>

      <section className="mt-6">
        <p className="font-mono text-4xs font-bold tracking-[1.5px] text-dim uppercase">
          Aparência
        </p>

        <Card className="mt-2">
          <SeletorDeTema escolhido={tema} />
        </Card>
      </section>

      <section className="mt-6">
        <p className="font-mono text-4xs font-bold tracking-[1.5px] text-dim uppercase">
          Tamanho da letra
        </p>

        <Card className="mt-2">
          {/*
            ⚠ **O aviso da exceção fica aqui, e não é enfeite.** Sem ele, quem
            escolhe "Maior" e olha o painel vê os potes com a mesma letra de
            antes e conclui que a configuração não funcionou — quando na verdade
            tudo em volta cresceu. Dizer que aquelas duas letras já são as
            maiores da tela transforma um defeito aparente em decisão visível.
          */}
          <p className="text-xs leading-relaxed text-dim">
            Vale para o app todo, menos o nome e o valor dos potes no painel —
            eles já são a maior letra da tela, e crescer mais quebraria a linha.
          </p>

          <div className="mt-4">
            <SeletorDeLetra escolhido={letra} />
          </div>
        </Card>
      </section>
    </>
  );
}
