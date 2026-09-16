"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { emReais } from "@/lib/dinheiro";
import type { FonteDeSugestao } from "@/features/classificacao/motor/sugestoes";
import type { CategoriaEscolhivel } from "./categorias";
import { decidir } from "./decidirLancamento.action";

/**
 * "Sempre classificar assim?" (tarefas B3 e D5).
 *
 * ## Ela vem **antes** de gravar, e isso mudou em relação à spec
 *
 * A spec dizia "grava, avança, e pergunta". Implementando, isso dá errado: no
 * instante em que a categoria é gravada o `revalidatePath` tira o lançamento da
 * fila, e a pergunta passaria a ser sobre algo que já saiu da tela.
 *
 * Aqui os **dois** botões gravam, numa transação só. Ganha-se atomicidade — a
 * tarefa pede "na mesma transação" — e ganha-se o principal: você vê o trecho
 * antes de se comprometer.
 *
 * ## É o momento de maior risco da tela inteira
 *
 * Responder "sempre" cria uma regra, e regra errada classifica **em silêncio**
 * por meses — o erro mais caro deste projeto. Por isso a pergunta mostra duas
 * coisas antes:
 *
 * 1. **O texto exato** que a regra vai procurar. É o trecho estável da A2, e
 *    ele nem sempre é o que você imagina — a A2 mantém a cidade de propósito.
 * 2. **Quantos outros pendentes do mês ela pega junto.** Ver "isto vai pegar
 *    mais 4" antes de confirmar é a diferença entre uma regra boa e uma
 *    surpresa.
 *
 * ## A terceira opção, e por que ela quase nunca aparece
 *
 * Quando já existe uma regra pegando este lançamento e mandando para **outro**
 * lugar, "sempre" é ambíguo: você quer trocar o destino daquela regra, ou
 * guardar só este valor como exceção? A tela pergunta, com os dois números de
 * "pega junto" lado a lado.
 *
 * ⚠ **Só nesse caso.** Oferecer sempre a regra por valor encheria a revisão de
 * uma escolha a mais para todo mundo, e amarraria ao valor regras que não
 * precisam disso — um Pix de R$ 300,00 e outro de R$ 300,50 para a mesma
 * pessoa virariam dois cadastros. Sem conflito não há o que desempatar, e a
 * pergunta continua com os dois botões de sempre.
 *
 * ## Sem trecho, sem pergunta
 *
 * Quando a descrição não produz trecho estável, os dois botões viram um só:
 * não há o que oferecer, e inventar um trecho aqui seria criar a regra ruim por
 * conta própria.
 */
export function PerguntaDeRegra({
  lancamentoId,
  categoria,
  fonteDaSugestao,
  trecho,
  pegaJunto,
  pegaJuntoComValor,
  valorCentavos,
  conflito,
  aoCancelar,
}: {
  lancamentoId: string;
  categoria: CategoriaEscolhivel;
  fonteDaSugestao?: FonteDeSugestao;
  trecho: string | null;
  pegaJunto: number;
  pegaJuntoComValor: number;
  valorCentavos: number;
  /**
   * A regra que já pega este lançamento e manda para **outro** lugar, com o
   * nome de onde ela manda. `null` no caso normal, e aí a pergunta continua
   * exatamente como sempre foi.
   */
  conflito: { texto: string; categoria: string } | null;
  aoCancelar: () => void;
}) {
  const [gravando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const gravar = (sempre: boolean, comValor = false) =>
    iniciar(async () => {
      setErro(null);
      const r = await decidir({
        tipo: "categoria",
        lancamentoId,
        categoriaId: categoria.id,
        fonteDaSugestao,
        sempre,
        comValor,
      });
      if (!r.ok) setErro(r.erro);
    });

  return (
    <Card className="mt-4 border-gold/20 bg-gold/8">
      <p className="text-xs text-dim">
        Vai para{" "}
        <strong className="font-bold text-text">
          {categoria.emoji} {categoria.nome}
        </strong>
        .
      </p>

      {trecho === null ? (
        <>
          <p className="mt-3 text-xs leading-relaxed text-dim">
            Esta descrição não tem um pedaço estável que dê para transformar em
            regra — então nada vai ser aprendido, e no mês que vem ela pergunta
            de novo. É melhor assim do que inventar uma regra que pegue o que
            não deve.
          </p>

          <div className="mt-4">
            <Botao onClick={() => gravar(false)} carregando={gravando}>
              Guardar
            </Botao>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm font-bold text-text">
            Classificar sempre assim?
          </p>

          <p className="mt-2 text-xs text-dim">A regra vai procurar por:</p>

          <p className="mt-1.5 rounded-pote border border-gold/20 bg-bg px-3 py-2.5 font-mono text-2xs break-words text-gold">
            {trecho}
          </p>

          <p className="mt-2.5 text-xs leading-relaxed text-dim">
            {frasePegaJunto(pegaJunto, "Isso")}
          </p>

          {conflito && (
            <>
              {/*
                O aviso vem **antes** dos botões, e nomeia as duas pontas.
                "Há um conflito" não é uma frase que dá para responder; "já
                existe uma regra para X mandando para Y" é.
              */}
              <p className="mt-3 rounded-pote border border-red/25 bg-red/8 px-3 py-2.5 text-xs leading-relaxed text-dim">
                Já existe uma regra procurando por{" "}
                <strong className="font-bold text-text">
                  {conflito.texto}
                </strong>{" "}
                que manda para{" "}
                <strong className="font-bold text-text">
                  {conflito.categoria}
                </strong>
                . Responder{" "}
                <strong className="font-bold text-text">sempre</strong> troca o
                destino dela — ou você guarda este valor como exceção e o resto
                continua indo para lá.
              </p>

              <p className="mt-2.5 text-xs leading-relaxed text-dim">
                {frasePegaJunto(
                  pegaJuntoComValor,
                  `Só para ${emReais(valorCentavos)}, isso`,
                )}
              </p>
            </>
          )}

          <div className="mt-4 flex flex-col gap-2">
            {conflito && (
              <Botao onClick={() => gravar(true, true)} carregando={gravando}>
                Sempre, só quando for {emReais(valorCentavos)}
              </Botao>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Botao
                onClick={() => gravar(true)}
                carregando={gravando}
                secundario={conflito !== null}
                className="sm:flex-1"
              >
                {conflito ? "Sempre, para qualquer valor" : "Sempre"}
              </Botao>
              <Botao
                onClick={() => gravar(false)}
                carregando={gravando}
                secundario
                className="sm:flex-1"
              >
                Só desta vez
              </Botao>
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={aoCancelar}
        disabled={gravando}
        className="mt-3 min-h-11 w-full text-xs text-dim underline underline-offset-4 disabled:opacity-40"
      >
        Escolher outra categoria
      </button>

      {erro && (
        <p role="alert" className="mt-2 text-2xs leading-relaxed text-red">
          {erro}
        </p>
      )}
    </Card>
  );
}

/**
 * O número da B3, em uma frase — agora escrito duas vezes na mesma tela: uma
 * para a regra do texto e outra para a versão que também exige o valor. É a
 * comparação lado a lado que faz a escolha do conflito ser decidível.
 */
function frasePegaJunto(quantos: number, oQue: string): string {
  if (quantos === 0)
    return `${oQue} não casa com nenhum outro pendente deste mês.`;
  if (quantos === 1) return `${oQue} também resolve mais 1 pendente deste mês.`;
  return `${oQue} também resolve mais ${quantos} pendentes deste mês.`;
}

function Botao({
  onClick,
  carregando,
  secundario = false,
  className,
  children,
}: {
  onClick: () => void;
  carregando: boolean;
  secundario?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={carregando}
      aria-busy={carregando || undefined}
      className={`inline-flex min-h-11 w-full items-center justify-center rounded-card px-5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        secundario
          ? "border border-border2 bg-card text-text hover:bg-card2"
          : "bg-primary text-bg hover:bg-orange"
      } ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
