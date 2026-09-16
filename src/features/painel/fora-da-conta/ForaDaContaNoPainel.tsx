"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { diaEMes, emReais } from "@/lib/dinheiro";
import type { ForaDaConta, ParAnulado } from "./foraDaConta";
import { desfazerAnulacao } from "./../trazer-de-volta/trazerDeVolta.action";

/**
 * "Fora da conta deste mês" — o rastro do dinheiro que o painel não somou.
 *
 * ## Por que ela vale o espaço na tela
 *
 * O par que se anula sai da conta sozinho. Sem esta seção, um repasse de
 * R$ 300 que entrou e saiu simplesmente não existiria em lugar nenhum do app:
 * fora do painel, fora da `/revisao` (`naFilaDeRevisao` pula `excluido`), fora
 * de qualquer lista. Conferir o mês contra o extrato do banco viraria um
 * quebra-cabeça sem peça.
 *
 * O extrato do banco não sabe o que é repasse. Somar o que está aqui de volta
 * tem de dar o que o banco mostra — é essa a conta que a seção permite fazer.
 *
 * ## Fica embaixo dos potes, e não no topo
 *
 * O topo é o mês; isto é a nota de rodapé do mês. Quem procura já sabe o que
 * procura — "por que as entradas deram menos do que o banco diz?" — e encontra
 * rolando. Pôr no topo gastaria a atenção da tela com o que é exceção.
 */
export function ForaDaContaNoPainel({ dados }: { dados: ForaDaConta }) {
  const temPares = dados.pares.length > 0;
  const temPassagens = dados.passagens.quantas > 0;

  // Mês limpo não ganha seção: um cartão dizendo "nada ficou de fora" seria
  // ruído em todo mês normal.
  if (!temPares && !temPassagens) return null;

  return (
    <>
      <SectionTitle>Fora da conta</SectionTitle>

      {temPares && (
        <Card className="border-gold/20 bg-gold/8">
          <div className="flex items-start gap-3">
            <Badge variant="gold">Anulados</Badge>
            <p className="text-xs leading-relaxed text-dim">
              {dados.entradaAnuladaCentavos > 0 && (
                <>
                  <strong className="font-bold text-text">
                    {emReais(dados.entradaAnuladaCentavos)}
                  </strong>{" "}
                  não contaram como entrada
                  {dados.saidaAnuladaCentavos > 0 && " e "}
                </>
              )}
              {dados.saidaAnuladaCentavos > 0 && (
                <>
                  <strong className="font-bold text-text">
                    {emReais(dados.saidaAnuladaCentavos)}
                  </strong>{" "}
                  não contaram como saída
                </>
              )}
              : são repasses que se anulam entre si. O extrato do banco mostra
              os dois; aqui eles se cancelam, para o mês não parecer maior do
              que foi.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {dados.pares.map((par) => (
              <ParNaTela key={par.chave} par={par} />
            ))}
          </div>
        </Card>
      )}

      {temPassagens && (
        <Card className="mt-2 border-blue/20 bg-blue/8">
          <div className="flex items-start gap-3">
            <Badge variant="blue">Passagem</Badge>
            <p className="text-xs leading-relaxed text-dim">
              {dados.passagens.quantas === 1
                ? "1 lançamento de "
                : `${dados.passagens.quantas} lançamentos somando `}
              <strong className="font-bold text-text">
                {emReais(dados.passagens.totalCentavos)}
              </strong>{" "}
              são pagamento de fatura. O gasto do cartão já foi contado pela
              fatura — contar aqui de novo faria o mesmo dinheiro sair duas
              vezes.
            </p>
          </div>
        </Card>
      )}
    </>
  );
}

/**
 * Um par, com os dois lados e o caminho de volta.
 *
 * ⚠ **O botão não é enfeite.** Salário e aluguel do mesmo valor na mesma
 * semana viram um par falso, e o app não sabe distinguir isso de um repasse de
 * verdade. Esta é a única tela do produto onde esse engano dá para desfazer.
 */
function ParNaTela({ par }: { par: ParAnulado }) {
  const [erro, setErro] = useState<string | null>(null);
  const [gravando, iniciar] = useTransition();

  const trazer = () =>
    iniciar(async () => {
      setErro(null);
      const r = await desfazerAnulacao({ lancamentoId: par.lados[0].id });
      if (!r.ok) setErro(r.erro);
    });

  return (
    <div className="rounded-pote border border-border bg-bg px-3 py-2.5">
      <p className="text-xs font-bold text-text">
        {emReais(par.valorCentavos)}
      </p>

      <ul className="mt-1.5 space-y-1">
        {par.lados.map((lado) => (
          <li key={lado.id} className="text-2xs leading-relaxed text-dim">
            <span className="font-bold">
              {lado.direcao === "entrada" ? "entrou" : "saiu"}
            </span>{" "}
            {diaEMes(lado.data)} · {lado.descricao}
          </li>
        ))}
      </ul>

      {/*
        O par que atravessa o mês aparece com um lado só — o outro está
        gravado, mas num mês vizinho. Sem esta linha, o cartão mostraria metade
        de uma anulação sem dizer onde está a outra metade.
      */}
      {par.lados.length === 1 && (
        <p className="mt-1.5 text-2xs leading-relaxed text-dim italic">
          {par.motivo}
        </p>
      )}

      <button
        type="button"
        onClick={trazer}
        disabled={gravando}
        aria-busy={gravando || undefined}
        className="mt-2 min-h-11 text-2xs text-dim underline underline-offset-4 disabled:opacity-40"
      >
        Isto não era repasse — trazer de volta
      </button>

      {erro && (
        <p role="alert" className="mt-1 text-2xs leading-relaxed text-red">
          {erro}
        </p>
      )}
    </div>
  );
}
