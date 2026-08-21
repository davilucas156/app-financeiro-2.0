import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { CartaoDoLancamento } from "./CartaoDoLancamento";
import { ListaDeCategorias } from "./ListaDeCategorias";
import { ProgressoDaRevisao } from "./ProgressoDaRevisao";
import { Sugestoes } from "./Sugestoes";
import { porId, type CategoriaEscolhivel } from "./categorias";
import type { PendenteParaRevisar } from "./pendentes";

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
}: {
  pendentes: PendenteParaRevisar[];
  categorias: CategoriaEscolhivel[];
  mes: string;
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
      </>
    );
  }

  const atual = pendentes[0];
  const catalogo = porId(categorias);
  const jaClassificado = atual.categoriaId
    ? catalogo.get(atual.categoriaId)
    : undefined;

  return (
    <>
      <SectionTitle>Revisar transações</SectionTitle>

      <ProgressoDaRevisao posicao={1} total={pendentes.length} mes={mes} />

      <CartaoDoLancamento l={atual} />

      {/*
        As duas saídas que não são categoria, juntas e logo abaixo do cartão:
        são ações sobre o lançamento, não escolhas de onde ele vai. Enterrá-las
        no fim de uma lista de 25 categorias faria "sempre disponível" virar
        mentira.
      */}
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" className="flex-1 px-3 text-xs" disabled>
          ← Voltar
        </Button>
        <Button variant="secondary" className="flex-1 px-3 text-xs">
          Fora do cálculo
        </Button>
      </div>

      {atual.motivo && (
        <Card className="mt-3 border-gold/20 bg-gold/8">
          <p className="text-xs leading-relaxed text-dim">{atual.motivo}</p>
        </Card>
      )}

      {atual.categoriaId ? (
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
              <Button className="w-full">Está certo</Button>
            </div>
          </Card>

          <SectionTitle>Ou troque a categoria</SectionTitle>
          <ListaDeCategorias categorias={categorias} direcao={atual.direcao} />
        </>
      ) : (
        <>
          <Sugestoes sugestoes={atual.sugestoes} porId={catalogo} />
          <ListaDeCategorias categorias={categorias} direcao={atual.direcao} />

          {/*
            A pergunta "sempre classificar assim?" **não** aparece aqui, e é
            deliberado: ela só faz sentido depois de você escolher, e escolher
            é a D4. Mostrá-la antes diria "guardado em…" sem nada ter sido
            guardado — a tela mentindo de novo.

            O `trecho` e o `pegaJunto` já vêm calculados de `pendentes.ts`,
            prontos para a D5 usar.
          */}
        </>
      )}
    </>
  );
}
