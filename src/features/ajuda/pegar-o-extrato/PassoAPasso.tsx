import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Voltar } from "@/components/ui/Voltar";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { EMAIL_CONTATO } from "@/features/autenticacao/contato";
import { ajudaPorBanco, arquivosDoBanco } from "./passos";

/**
 * "Como pegar o extrato" (spec 09, tarefa C1).
 *
 * ## O passo que a pessoa não consegue adivinhar acontece fora do app
 *
 * A tela de boas-vindas explica bem o **método** — os potes, os percentuais, o
 * que fica fora do rateio. Depois ela entrega um painel vazio com um botão
 * "Enviar extrato", e o gesto que falta é o único que não é nosso: baixar um
 * arquivo no aplicativo do banco.
 *
 * ## A ressalva vem antes do passo 1, e não depois do último
 *
 * ⚠ O app entende os formatos que estão em `FORMATOS` — hoje dois, os dois do
 * Inter. Um passo a passo que dissesse "abra o app do seu banco" faria a pessoa
 * de outro banco cumprir cinco passos, subir o arquivo e levar uma recusa,
 * depois do trabalho todo e sem entender que o problema não foi ela.
 *
 * A lista de bancos é **derivada** de `FORMATOS`, então esta tela não tem como
 * prometer um banco que o app não lê.
 */
export function PassoAPasso({ voltarPara }: { voltarPara: string }) {
  const bancos = ajudaPorBanco();

  return (
    <>
      <Voltar para={voltarPara}>Voltar</Voltar>

      <SectionTitle className="mt-2">Como pegar o extrato</SectionTitle>

      <p className="text-xs leading-relaxed text-dim">
        O app monta os potes a partir do arquivo que o seu banco exporta. Ele
        não se conecta ao banco e não pede sua senha — quem baixa o arquivo é
        você.
      </p>

      {/* A ressalva, antes de tudo. */}
      <Card className="mt-4 border-gold/20 bg-gold/8">
        <p className="text-xs font-bold text-gold">
          {bancos.length === 1
            ? `Hoje o app lê os arquivos do ${bancos[0].banco}.`
            : `Hoje o app lê os arquivos de ${bancos.length} bancos.`}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-dim">
          Cada formato foi conferido num arquivo de verdade antes de entrar —
          separador, vírgula decimal e codificação são as quatro coisas que todo
          mundo supõe e quase todo mundo erra. Se o seu banco for outro,{" "}
          <a
            href={`mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent("CSV de outro banco")}`}
            className="underline underline-offset-4"
          >
            mande o CSV
          </a>{" "}
          — com o arquivo na mão dá para medir e acrescentar.
        </p>
      </Card>

      {bancos.map(({ banco, passos }) => (
        <section key={banco} className="mt-8">
          <h2 className="text-sm font-bold">{banco}</h2>
          <p className="mt-1 font-mono text-3xs text-dim">
            {arquivosDoBanco(banco).join(" · ")}
          </p>

          {passos.length === 0 ? (
            <p className="mt-3 text-xs leading-relaxed text-dim">
              O app lê os arquivos deste banco, mas o caminho até eles ainda não
              foi escrito aqui. Exporte o extrato em CSV e envie — se algo não
              for reconhecido, o app diz o que não entendeu.
            </p>
          ) : (
            <ol className="mt-3 space-y-2">
              {passos.map((passo, i) => (
                <li key={passo.titulo}>
                  <Card className="flex gap-3 p-4">
                    <span
                      aria-hidden="true"
                      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-2xs font-bold text-primary"
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold break-words">
                        {passo.titulo}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-dim">
                        {passo.detalhe}
                      </span>
                    </span>
                  </Card>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}

      {/*
        ⚠ **Os dois arquivos, e o porquê.** É a parte que a pessoa pula, e a que
        estraga o mês inteiro em silêncio: sem a fatura, o pagamento dela vira um
        gasto único de mil e poucos reais e as compras que ele representa não
        aparecem em pote nenhum. O painel fica certo na soma e mentiroso nos
        potes — que é o pior tipo de errado.
      */}
      <Card className="mt-8 border-blue/20 bg-blue/8">
        <p className="text-xs font-bold text-blue">
          Mande os dois arquivos do mesmo mês.
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-dim">
          Só o extrato da conta, o pagamento da fatura aparece como um gasto
          único de mil e poucos reais — e as compras que ele representa não caem
          em pote nenhum. Com os dois, o app reconhece esse pagamento, tira ele
          da conta e usa os dois arquivos para conferir um o outro.
        </p>
      </Card>

      <Link
        href="/upload"
        className="mt-8 inline-flex min-h-11 items-center rounded-card bg-primary px-5 text-sm font-bold text-bg transition-colors hover:bg-orange"
      >
        Enviar extrato
      </Link>
    </>
  );
}
