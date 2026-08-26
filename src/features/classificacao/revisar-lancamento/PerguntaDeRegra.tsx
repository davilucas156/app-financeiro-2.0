"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
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
  aoCancelar,
}: {
  lancamentoId: string;
  categoria: CategoriaEscolhivel;
  fonteDaSugestao?: FonteDeSugestao;
  trecho: string | null;
  pegaJunto: number;
  aoCancelar: () => void;
}) {
  const [gravando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const gravar = (sempre: boolean) =>
    iniciar(async () => {
      setErro(null);
      const r = await decidir({
        tipo: "categoria",
        lancamentoId,
        categoriaId: categoria.id,
        fonteDaSugestao,
        sempre,
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
            {pegaJunto === 0
              ? "Nenhum outro pendente deste mês casa com isso."
              : pegaJunto === 1
                ? "Isso também resolve mais 1 pendente deste mês."
                : `Isso também resolve mais ${pegaJunto} pendentes deste mês.`}
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Botao
              onClick={() => gravar(true)}
              carregando={gravando}
              className="sm:flex-1"
            >
              Sempre
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
