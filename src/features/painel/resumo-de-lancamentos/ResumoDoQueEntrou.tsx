import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { ResumoDeLancamentos } from "@/features/painel/resumo-de-lancamentos/resumoDeLancamentos.service";
import { rotuloDeMes } from "@/features/upload/enviar-extrato/SeletorDeMes";

/**
 * O que o painel mostra **enquanto o painel não existe** (tarefa D6).
 *
 * A régua aqui é uma só: não mentir. Não invento potes, não somo gastos, não
 * comparo com o mês passado — nada disso é possível antes da classificação.
 * Digo o que há no banco, de quem é, e qual é o passo que ainda falta.
 */
export function ResumoDoQueEntrou({ resumo }: { resumo: ResumoDeLancamentos }) {
  return (
    <>
      <Card className="p-0">
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Numero rotulo="Lançamentos" valor={resumo.total} destaque />
          <Numero rotulo="Sem categoria" valor={resumo.aguardandoClassificacao} />
          <Numero rotulo="Para revisar" valor={resumo.emRevisao} />
        </div>
      </Card>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[9px] font-bold tracking-[1.5px] text-dim uppercase">
          Meses no banco
        </span>
        {resumo.meses.map((mes) => (
          <Badge key={mes} variant="blue">
            {rotuloDeMes(mes)}
          </Badge>
        ))}
      </div>

      {/*
        A parte que importa: dizer que o painel ainda não existe, em vez de
        deixar você procurar os potes numa tela que nunca vai mostrá-los.
      */}
      <Card className="mt-3 border-gold/20 bg-gold/8">
        <p className="text-xs font-bold text-gold">
          Falta classificar para o painel existir.
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-dim">
          Seus lançamentos estão guardados, mas nenhum caiu num pote ainda —
          separar gasto fixo de lazer é a próxima funcionalidade a ser
          construída. Até lá, esta tela conta o que entrou e mais nada.
        </p>
      </Card>

      {resumo.foraDoCalculo > 0 && (
        <Card className="mt-3 border-blue/20 bg-blue/8">
          <p className="text-xs leading-relaxed text-dim">
            <span className="font-bold text-blue">
              {resumo.foraDoCalculo} fora do cálculo:
            </span>{" "}
            pagamento de fatura e afins. Continuam guardados, mas não contam
            como gasto — senão o mesmo dinheiro sairia duas vezes.
          </p>
        </Card>
      )}

      <div className="mt-6">
        <Link
          href="/upload"
          className="inline-flex min-h-11 items-center rounded-card border border-border2 bg-card px-5 text-sm font-bold transition-colors hover:bg-card2"
        >
          Enviar outro mês
        </Link>
      </div>
    </>
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
