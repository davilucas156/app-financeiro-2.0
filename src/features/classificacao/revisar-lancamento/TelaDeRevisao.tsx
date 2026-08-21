"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AcaoDeDecidir } from "./AcaoDeDecidir";
import { AcaoDeVoltar } from "./AcaoDeVoltar";
import { CartaoDoLancamento } from "./CartaoDoLancamento";
import { ListaDeCategorias } from "./ListaDeCategorias";
import { ProgressoDaRevisao } from "./ProgressoDaRevisao";
import { Sugestoes } from "./Sugestoes";
import { PerguntaDeRegra } from "./PerguntaDeRegra";
import { porId, type CategoriaEscolhivel } from "./categorias";
import { avisoDoVoltar, type PodeVoltar } from "./desfazer";
import type { PendenteParaRevisar } from "./pendentes";
import type { FonteDeSugestao } from "@/features/classificacao/motor/sugestoes";

/**
 * `/revisao` — um lançamento por vez, no polegar (B1, B2, B3 e D3).
 *
 * ## A ordem da tela é a ordem da decisão
 *
 * Progresso → o lançamento → sugestões (se houver) → a lista completa → as
 * saídas. Você olha o que é, escolhe onde vai, e só então o app pergunta se
 * quer aprender. Perguntar antes de escolher seria pedir compromisso sobre uma
 * decisão que ainda não foi tomada.
 *
 * ## Dois tipos de pendência, duas perguntas diferentes
 *
 * Um lançamento **sem categoria** pergunta "onde isto vai?". Um lançamento
 * **com categoria** — o valor alto que uma regra já classificou (D1), ou um
 * par que se anula (spec 02) — pergunta outra coisa: "está certo?".
 *
 * Tratar os dois iguais perderia o trabalho que o motor já fez, e faria você
 * escolher categoria de novo para algo que já tem uma.
 */
export function TelaDeRevisao({
  pendentes,
  categorias,
  mes,
  voltar,
}: {
  pendentes: PendenteParaRevisar[];
  categorias: CategoriaEscolhivel[];
  mes: string;
  voltar: PodeVoltar | null;
}) {
  if (pendentes.length === 0) {
    return (
      <>
        <SectionTitle>Revisar transações</SectionTitle>
        <EstadoVazio
          emoji="✅"
          titulo="Nada pendente"
          descricao="Todos os lançamentos importados já têm categoria. O painel pode contar a história inteira do mês."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/dashboard">
            <Button>Ver o painel</Button>
          </Link>
        </div>

        {/*
          ⚠ **O "Voltar" precisa existir aqui também.**

          Ao classificar o último pendente a tela vira esta — e o botão mora
          dentro do componente do lançamento. Sem esta cópia ele sumiria
          exatamente na decisão mais provável de se querer desfazer: a última.
        */}
        {voltar && (
          <div className="mx-auto mt-8 max-w-xs">
            <AcaoDeVoltar voltar={voltar} />
            <AvisoDoVoltar voltar={voltar} />
          </div>
        )}
      </>
    );
  }

  return (
    <Revisando
      key={pendentes[0].id}
      atual={pendentes[0]}
      total={pendentes.length}
      categorias={categorias}
      mes={mes}
      voltar={voltar}
    />
  );
}

/**
 * O que o "Voltar" **não** desfaz, dito antes de você tocar nele.
 *
 * Desfazer reabre um lançamento; a regra que aquela decisão criou fica, e os
 * irmãos que ela pegou seguem classificados. É o que a D6 manda — e é
 * surpreendente se ninguém disser. Avisar depois seria explicar um susto.
 */
function AvisoDoVoltar({ voltar }: { voltar: PodeVoltar | null }) {
  const aviso = avisoDoVoltar(voltar);
  if (!aviso) return null;

  return (
    <p className="mt-2 text-[11px] leading-relaxed text-dim">↩ {aviso}</p>
  );
}

/**
 * ⚠ **A `key` acima é o que faz a escolha não vazar de um lançamento para o
 * seguinte.**
 *
 * Sem ela, o React reaproveitaria este componente quando a lista revalidasse, e
 * o estado `escolhida` sobreviveria — a tela abriria o próximo lançamento já
 * com a pergunta de regra do anterior aberta. Trocando a chave, o estado morre
 * junto com o lançamento a que pertencia.
 */
function Revisando({
  atual,
  total,
  categorias,
  mes,
  voltar,
}: {
  atual: PendenteParaRevisar;
  total: number;
  categorias: CategoriaEscolhivel[];
  mes: string;
  voltar: PodeVoltar | null;
}) {
  const [escolhida, setEscolhida] = useState<{
    categoria: CategoriaEscolhivel;
    fonte?: FonteDeSugestao;
  } | null>(null);

  const catalogo = porId(categorias);
  const jaClassificado = atual.categoriaId
    ? catalogo.get(atual.categoriaId)
    : undefined;

  return (
    <>
      <SectionTitle>Revisar transações</SectionTitle>

      <ProgressoDaRevisao posicao={1} total={total} mes={mes} />

      <CartaoDoLancamento l={atual} />

      {/*
        As duas saídas que não são categoria, juntas e logo abaixo do cartão:
        são ações sobre o lançamento, não escolhas de onde ele vai. Enterrá-las
        no fim de uma lista de 25 categorias faria "sempre disponível" virar
        mentira.
      */}
      <div className="mt-3 flex gap-2">
        <div className="flex-1">
          <AcaoDeVoltar voltar={voltar} />
        </div>

        <div className="flex-1">
          <AcaoDeDecidir
            entrada={{ tipo: "fora-do-calculo", lancamentoId: atual.id }}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-card border border-border2 bg-card px-3 text-xs font-bold text-text hover:bg-card2"
          >
            Fora do cálculo
          </AcaoDeDecidir>
        </div>
      </div>

      <AvisoDoVoltar voltar={voltar} />

      {atual.motivo && (
        <Card className="mt-3 border-gold/20 bg-gold/8">
          <p className="text-xs leading-relaxed text-dim">{atual.motivo}</p>
        </Card>
      )}

      {/*
        Escolheu: a tela vira a pergunta de virar regra e a lista some.
        Deixar as 25 categorias abertas embaixo da pergunta convidaria a tocar
        noutra sem perceber que já havia uma escolha pendente.
      */}
      {escolhida ? (
        <PerguntaDeRegra
          lancamentoId={atual.id}
          categoria={escolhida.categoria}
          fonteDaSugestao={escolhida.fonte}
          trecho={atual.trecho}
          pegaJunto={atual.pegaJunto}
          aoCancelar={() => setEscolhida(null)}
        />
      ) : atual.categoriaId ? (
        <>
          <Card className="mt-4 border-green/20 bg-green/8">
            <p className="text-xs text-dim">
              Uma regra já classificou como{" "}
              <strong className="font-bold text-text">
                {jaClassificado
                  ? `${jaClassificado.emoji} ${jaClassificado.nome}`
                  : "uma categoria que não existe mais"}
              </strong>
              .
            </p>

            {atual.regraChave && (
              <p className="mt-2 rounded-pote border border-border bg-bg px-3 py-2 font-mono text-[11px] break-words text-dim">
                {atual.regraChave}
              </p>
            )}

            <div className="mt-4">
              <AcaoDeDecidir
                entrada={{ tipo: "confirmar", lancamentoId: atual.id }}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-card bg-primary px-5 text-sm font-bold text-bg hover:bg-orange"
              >
                Está certo
              </AcaoDeDecidir>
            </div>
          </Card>

          <SectionTitle>Ou troque a categoria</SectionTitle>
          <ListaDeCategorias
            categorias={categorias}
            direcao={atual.direcao}
            aoEscolher={(categoria) => setEscolhida({ categoria })}
          />
        </>
      ) : (
        <>
          <Sugestoes
            sugestoes={atual.sugestoes}
            porId={catalogo}
            aoEscolher={(categoria, fonte) => setEscolhida({ categoria, fonte })}
          />
          <ListaDeCategorias
            categorias={categorias}
            direcao={atual.direcao}
            aoEscolher={(categoria) => setEscolhida({ categoria })}
          />
        </>
      )}
    </>
  );
}
