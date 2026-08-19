import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { LinhasIgnoradas } from "@/features/upload/enviar-extrato/LinhasIgnoradas";
import type { LinhaIgnorada } from "@/features/upload/ler-arquivo/lancamentos";

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
};

export function ResumoDaImportacao({ dados }: { dados: DadosDoResumo }) {
  const total = dados.arquivos.reduce((s, a) => s + a.entraram, 0);
  const ignoradas = dados.arquivos.flatMap((a) =>
    a.ignoradas.map((i) => ({ ...i, arquivo: a.rotulo })),
  );

  return (
    <section aria-labelledby="resumo-da-importacao">
      <SectionTitle>
        <span id="resumo-da-importacao">Resultado</span>
      </SectionTitle>

      <Card className="p-0">
        {/* Empilha no celular, vira colunas a partir de sm:. Três números
            lado a lado em 360px ficariam ilegíveis. */}
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Numero rotulo="Importados" valor={total} destaque />
          <Numero rotulo="Para revisar" valor={dados.revisao} />
          <Numero rotulo="Fora do cálculo" valor={dados.excluidos} />
        </div>
      </Card>

      <div className="mt-3 space-y-2">
        {dados.arquivos.map((a) => (
          <div
            key={a.rotulo}
            className="flex items-center justify-between gap-3 rounded-pote border border-border bg-card px-4 py-3"
          >
            <span className="min-w-0 truncate text-xs font-bold">{a.rotulo}</span>
            <span className="shrink-0 font-mono text-[11px] text-dim">
              {a.entraram} lançamentos
            </span>
          </div>
        ))}
      </div>

      {dados.revisao > 0 && (
        <Card className="mt-3 border-gold/20 bg-gold/8">
          <div className="flex items-start gap-3">
            <Badge variant="gold">Revisar</Badge>
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
      <p className="font-mono text-[9px] font-bold tracking-[1.5px] text-dim uppercase">
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
