"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { rotuloDeMes } from "@/lib/mes";
import { removerMes, resumoDaRemocao } from "./removerOMes.action";
/*
 * ⚠ **`import type` de statement, e não `{ type X }` embutido.** O service tem
 * `import "server-only"`, que sobe pela cadeia de importação e reprova o
 * componente de cliente. A forma de statement é apagada inteira na compilação,
 * então nada do service chega aqui. É o mesmo que a `LinhaDeEnvio` faz com o
 * `ResultadoDesfazer`.
 */
import type { ResultadoDaRemocao } from "./removerOMes.service";
import { fraseDoTransbordo, type OQueSaiDoMes } from "./oQueSaiDoMes";

/**
 * A saída para um mês que entrou errado (tarefas D1 e D2).
 *
 * ## O resumo vem depois do toque, e não com a página
 *
 * ⚠ A rota da `/dashboard` já faz seis consultas e tem um aviso escrito nela
 * contra acrescentar a sétima. Remover um mês acontece uma vez a cada muitos
 * meses; o painel abre todo dia. Pendurar `enviosDoMes` no carregamento faria
 * todo mundo pagar pelo caso raro — então a tela pergunta quando o dedo toca.
 *
 * ## Enquanto o resumo carrega, o botão vermelho **não existe**
 *
 * ⚠ Não basta desabilitar. Um botão vermelho já desenhado, mesmo cinza, ensina
 * o polegar onde ele vai estar — e o polegar chega lá antes de os números
 * aparecerem. As duas etapas existem para que a segunda seja **lida**, e um
 * alvo que aparece pronto convida a confirmar sem ler.
 *
 * ## Onde ele fica
 *
 * No pé da tela, depois do caminho até a `/categorias`. Arrumar categoria é
 * rotineiro e nasce de olhar os potes; remover um mês é raro e destrutivo — o
 * último item é o que se encontra procurando, não o que se esbarra rolando. É a
 * mesma razão de ele não ficar junto das abas, onde o dedo passa todo dia.
 */
export function RemoverOMes({ mes }: { mes: string }) {
  const router = useRouter();

  /*
   * ⚠ **`resumo !== null` é o que abre a confirmação**, e não um
   * `confirmando: boolean` ao lado. Dois fatos sobre o mesmo estado divergem um
   * dia — e a divergência aqui seria uma confirmação desenhada sem números.
   */
  const [resumo, setResumo] = useState<OQueSaiDoMes | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pedindo, comecarAPedir] = useTransition();

  const [resultado, agir, apagando] = useActionState<
    ResultadoDaRemocao | null,
    FormData
  >(removerMes, null);

  /*
   * ⚠ **Sai sem `?mes=`, e é isso que faz funcionar.** A rota cai no padrão, que
   * é o mês mais recente com movimento. Escolher o vizinho na mão seria uma
   * segunda regra de qual mês abrir, e ela divergiria da primeira no dia em que
   * o vizinho também não tivesse movimento.
   */
  useEffect(() => {
    if (resultado?.ok) router.replace("/dashboard");
  }, [resultado, router]);

  function pedirOResumo() {
    setErro(null);

    comecarAPedir(async () => {
      const resposta = await resumoDaRemocao(mes);

      if (resposta.ok) setResumo(resposta.resumo);
      else setErro(resposta.erro);
    });
  }

  function desistir() {
    setResumo(null);
    setErro(null);
  }

  const rotulo = rotuloDeMes(mes);
  const erroDaRemocao = resultado && !resultado.ok ? resultado.erro : null;

  return (
    <section
      aria-labelledby="remover-o-mes"
      className="mt-8 border-t border-border pt-6"
    >
      <p id="remover-o-mes" className="text-2xs leading-relaxed text-dim">
        Este mês entrou errado? Remover apaga os arquivos que o formaram, e você
        pode enviá-los de novo depois.
      </p>

      {resumo === null && (
        <div className="mt-3">
          {pedindo ? (
            /*
             * Texto, e não um botão desabilitado: ver o docblock. Nada clicável
             * nasce no lugar onde o vermelho vai aparecer.
             */
            <p className="text-2xs text-dim2">Vendo o que sairia…</p>
          ) : (
            <Button
              variant="secondary"
              className="text-xs"
              onClick={pedirOResumo}
              aria-label={`Remover ${rotulo} e os arquivos que formaram esse mês`}
            >
              Remover este mês
            </Button>
          )}

          {erro && (
            <p className="mt-3 text-xs leading-relaxed text-red">{erro}</p>
          )}
        </div>
      )}

      {resumo !== null && (
        <form action={agir}>
          {/*
            O mês viaja no formulário, e não numa variável de closure: o servidor
            recebe sempre o mesmo dado. Ele não autoriza nada sozinho — quem
            decide é o `user_id` da sessão.
          */}
          <input type="hidden" name="mes" value={mes} />

          <div
            role="alert"
            className="mt-3 rounded-card border border-red/20 bg-red/8 p-4"
          >
            {/*
              O número e o mês no título, como no `LinhaDeEnvio`: um "tem
              certeza?" genérico pede certeza sem dar a informação que ela exige.
            */}
            <p className="text-xs font-bold text-red">
              Apagar {resumo.noMes} lançamentos de {rotulo}?
            </p>

            <ul className="mt-2.5 space-y-1">
              {resumo.envios.map((envio) => (
                <li
                  key={envio.importId}
                  className="truncate font-mono text-3xs text-dim2"
                >
                  {envio.nomeArquivo} · {envio.rotuloDeOrigem}
                </li>
              ))}
            </ul>

            {/*
              ⚠ **O transbordo.** É a única consequência que não dá para prever
              olhando a tela: o extrato da conta é arquivado pelo mês da data, e
              o que vai de 02/06 a 02/07 põe lançamentos em julho.
            */}
            {resumo.transbordo.length > 0 && (
              <div className="mt-3 border-t border-red/20 pt-3">
                <p className="text-xs font-bold text-gold">
                  Um destes arquivos também tem lançamentos em outro mês:
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {resumo.transbordo.map((atingido) => (
                    <li
                      key={atingido.mes}
                      className="text-xs leading-relaxed text-dim"
                    >
                      {fraseDoTransbordo(atingido, mes)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/*
              As três perguntas que vêm depois, respondidas antes. Sem isto, a
              confirmação diz o que some e deixa em aberto o que sobra — e o que
              sobra é o trabalho de meses.
            */}
            <p className="mt-3 text-xs leading-relaxed text-dim">
              Continuam aqui: as regras que você criou na revisão, a renda
              declarada do mês e os formatos que você ensinou.
            </p>

            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                className="text-xs"
                disabled={apagando}
                onClick={desistir}
              >
                Cancelar
              </Button>

              {/* `loading` desabilita: o duplo toque não dispara duas vezes.
                  Se ainda assim disparar, a segunda remoção não acha nada. */}
              <Button
                type="submit"
                loading={apagando}
                className="bg-red text-bg enabled:hover:bg-red/80 text-xs"
                aria-label={`Remover ${rotulo}`}
              >
                {apagando ? "Removendo…" : "Remover"}
              </Button>
            </div>

            {/*
              O erro aparece **dentro** do bloco, sem fechá-lo: fechar apagaria a
              mensagem no mesmo gesto que a criou.
            */}
            {erroDaRemocao && (
              <p className="mt-3 text-xs leading-relaxed text-red">
                {erroDaRemocao}
              </p>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
