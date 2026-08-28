import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { LinhasIgnoradas } from "@/features/upload/enviar-extrato/LinhasIgnoradas";
import type { LinhaIgnorada } from "@/features/upload/ler-arquivo/lancamentos";
import {
  paraDecidir,
  tudoResolvido,
  type ContagemDaImportacao,
} from "@/features/upload/enviar-extrato/contagemDaImportacao";

/**
 * O que entrou e o que não entrou (tarefa B2) — **protótipo visual**.
 *
 * A fase A veio antes desta tela justamente para que este resumo mostre o que
 * o leitor **de fato** sabe dizer, e não um relatório inventado. Cada número
 * aqui tem uma origem:
 *
 * | Campo | De onde vem |
 * |---|---|
 * | `entraram` | `Leitura.lancamentos` (A3) |
 * | `ignoradas` | `Leitura.ignoradas` (A3), com linha, motivo e conteúdo |
 * | `excluidos` | `marcacao: "excluido"` (A4) |
 * | `revisao` | `marcacao: "revisao"` (A4) |
 *
 * ⚠ **"3 ignoradas" sem dizer quais só gera desconfiança.** Cada linha que
 * ficou de fora aparece com o número da linha, o motivo e o **conteúdo
 * original** — é o que permite abrir o CSV e conferir sem adivinhar.
 */

export type ResumoDeArquivo = {
  rotulo: string;
  entraram: number;
  ignoradas: LinhaIgnorada[];
};

export type DadosDoResumo = {
  arquivos: ResumoDeArquivo[];
  /** Pagamento de fatura e afins: entram, mas fora do cálculo. */
  excluidos: number;
  /** Pares que se anulam, esperando o usuário decidir. */
  revisao: number;
  /** O motor bateu regra (D1). */
  classificados: number;
  /** Nenhuma regra bateu: você escolhe a categoria. */
  pendentes: number;
  /** Classificados de valor alto, que ainda pedem confirmação (D1). */
  conferir: number;
};

export function ResumoDaImportacao({ dados }: { dados: DadosDoResumo }) {
  const total = dados.arquivos.reduce((s, a) => s + a.entraram, 0);
  const ignoradas = dados.arquivos.flatMap((a) =>
    a.ignoradas.map((i) => ({ ...i, arquivo: a.rotulo })),
  );

  const contagem: ContagemDaImportacao = {
    importados: total,
    classificados: dados.classificados,
    pendentes: dados.pendentes,
    pares: dados.revisao,
    conferir: dados.conferir,
    excluidos: dados.excluidos,
  };

  const decidir = paraDecidir(contagem);

  return (
    <section aria-labelledby="resumo-da-importacao">
      <SectionTitle>
        <span id="resumo-da-importacao">Resultado</span>
      </SectionTitle>

      <Card className="p-0">
        {/* Empilha no celular, vira colunas a partir de sm:. Três números
            lado a lado em 360px ficariam ilegíveis. */}
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Numero rotulo="Importados" valor={total} />
          <Numero rotulo="Classificados" valor={dados.classificados} />
          <Numero rotulo="Para decidir" valor={decidir} destaque />
        </div>
      </Card>

      {/*
        O número que pede ação é o destacado — não o total. E ele leva a algum
        lugar: "23 para decidir" sem caminho é só um número que gera culpa.

        Quando não sobra nada, **não** existe link. Mandar alguém para uma tela
        vazia depois de dizer "tudo pronto" é a definição de caminho inútil.
      */}
      {tudoResolvido(contagem) ? (
        total > 0 && (
          <Card className="mt-3 border-green/20 bg-green/8">
            <p className="text-xs font-bold text-green">Tudo classificado.</p>
            <p className="mt-1.5 text-xs leading-relaxed text-dim">
              As suas regras deram conta do mês inteiro. Não há nada esperando
              você em Revisar.
            </p>
          </Card>
        )
      ) : (
        <Link href="/revisao" className="mt-3 block">
          <Button className="w-full">
            Decidir agora
            <span aria-hidden="true">→</span>
          </Button>
        </Link>
      )}

      <div className="mt-3 space-y-2">
        {dados.arquivos.map((a) => (
          <div
            key={a.rotulo}
            className="flex items-center justify-between gap-3 rounded-pote border border-border bg-card px-4 py-3"
          >
            <span className="min-w-0 truncate text-xs font-bold">
              {a.rotulo}
            </span>
            <span className="shrink-0 font-mono text-2xs text-dim">
              {a.entraram} lançamentos
            </span>
          </div>
        ))}
      </div>

      {/*
        Um cartão por tipo de pendência. "23 para decidir" sem dizer de quê é
        um número que gera desconfiança, não ação — mesma régua das linhas
        ignoradas na spec 02.
      */}
      {dados.pendentes > 0 && (
        <Card className="mt-3 border-gold/20 bg-gold/8">
          <div className="flex items-start gap-3">
            <Badge variant="gold">Escolher</Badge>
            <p className="text-xs leading-relaxed text-dim">
              {dados.pendentes === 1
                ? "1 lançamento não bateu com nenhuma regra sua."
                : `${dados.pendentes} lançamentos não bateram com nenhuma regra sua.`}{" "}
              Você escolhe a categoria, e pode transformar a escolha em regra
              para o mês que vem.
            </p>
          </div>
        </Card>
      )}

      {dados.conferir > 0 && (
        <Card className="mt-3 border-gold/20 bg-gold/8">
          <div className="flex items-start gap-3">
            <Badge variant="gold">Conferir</Badge>
            <p className="text-xs leading-relaxed text-dim">
              {dados.conferir === 1
                ? "1 lançamento foi classificado por uma regra, mas passa de R$ 200"
                : `${dados.conferir} lançamentos foram classificados por regra, mas passam de R$ 200`}
              . Já estão no lugar — é só confirmar que a categoria está certa.
              Regra errada em valor alto é o erro mais caro, e o mais fácil de
              não notar.
            </p>
          </div>
        </Card>
      )}

      {dados.revisao > 0 && (
        <Card className="mt-3 border-gold/20 bg-gold/8">
          <div className="flex items-start gap-3">
            <Badge variant="gold">Anulam?</Badge>
            <p className="text-xs leading-relaxed text-dim">
              {dados.revisao} lançamentos parecem se anular entre si — mesmo
              valor, sentidos opostos, datas próximas. Nada foi apagado; você
              decide o que fazer com eles.
            </p>
          </div>
        </Card>
      )}

      {dados.excluidos > 0 && (
        <Card className="mt-3 border-blue/20 bg-blue/8">
          <div className="flex items-start gap-3">
            <Badge variant="blue">Fora do cálculo</Badge>
            <p className="text-xs leading-relaxed text-dim">
              {dados.excluidos} lançamentos são pagamento de fatura. Continuam
              guardados, mas não contam como gasto — senão o mesmo dinheiro
              sairia duas vezes.
            </p>
          </div>
        </Card>
      )}

      {ignoradas.length > 0 && (
        <>
          <SectionTitle>Linhas que ficaram de fora</SectionTitle>

          {/* O mesmo componente que o histórico usa: assim o que você vê agora
              é o que continuará vendo daqui a dois meses. */}
          <LinhasIgnoradas linhas={ignoradas} />
        </>
      )}
    </section>
  );
}

function Numero({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div className="px-5 py-4">
      <p className="font-mono text-4xs font-bold tracking-[1.5px] text-dim uppercase">
        {rotulo}
      </p>
      <p
        className={`mt-1 font-mono text-2xl font-medium ${
          destaque ? "text-green" : valor > 0 ? "text-text" : "text-dim2"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}
