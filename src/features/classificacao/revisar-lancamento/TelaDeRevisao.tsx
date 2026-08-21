import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { CartaoDoLancamento } from "./CartaoDoLancamento";
import { ListaDeCategorias } from "./ListaDeCategorias";
import { PerguntaDeRegra } from "./PerguntaDeRegra";
import { ProgressoDaRevisao } from "./ProgressoDaRevisao";
import { Sugestoes } from "./Sugestoes";
import { ESTADOS, type NomeDoEstado } from "./dadosFalsos";

/**
 * `/revisao` — **protótipo visual** (B1, B2 e B3).
 *
 * Um lançamento por vez, no polegar. Nada de banco, nada de server action,
 * nada de motor rodando: os estados vêm de `dadosFalsos.ts` e a rota escolhe
 * por query string. Some na D3.
 *
 * ## A ordem da tela é a ordem da decisão
 *
 * Progresso → o lançamento → sugestões (se houver) → a lista completa → as
 * saídas. Você olha o que é, escolhe onde vai, e só então o app pergunta se
 * quer aprender. Perguntar antes de escolher seria pedir compromisso sobre uma
 * decisão que ainda não foi tomada.
 */
export function TelaDeRevisao({ estado }: { estado: NomeDoEstado }) {
  const dados = ESTADOS[estado];

  if (!dados) {
    return (
      <>
        <SectionTitle>Revisar transações</SectionTitle>
        <EstadoVazio
          emoji="✅"
          titulo="Nada pendente"
          descricao="Os 17 lançamentos de julho estão classificados. O painel já pode contar a história inteira do mês."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/dashboard">
            <Button>Ver o painel</Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SectionTitle>Revisar transações</SectionTitle>

      <ProgressoDaRevisao
        posicao={dados.posicao}
        total={dados.total}
        mes={dados.mes}
      />

      <CartaoDoLancamento l={dados.lancamento} />

      {/*
        As duas saídas que não são categoria, juntas e logo abaixo do cartão:
        são ações sobre o lançamento, não escolhas de onde ele vai. Enterrá-las
        no fim de uma lista de 22 categorias faria "sempre disponível" virar
        mentira.
      */}
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" className="flex-1 px-3 text-xs">
          ← Voltar
        </Button>
        <Button variant="secondary" className="flex-1 px-3 text-xs">
          Fora do cálculo
        </Button>
      </div>

      {dados.escolhida ? (
        <PerguntaDeRegra
          chaveEscolhida={dados.escolhida}
          trecho={dados.lancamento.trecho}
          pegaJunto={dados.lancamento.pegaJunto}
        />
      ) : (
        <>
          <Sugestoes sugestoes={dados.lancamento.sugestoes} />
          <ListaDeCategorias direcao={dados.lancamento.direcao} />
        </>
      )}
    </>
  );
}
