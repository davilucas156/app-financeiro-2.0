import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { ResumoDeLancamentos } from "@/features/painel/resumo-de-lancamentos/resumoDeLancamentos.service";
import { avisoDoPainel, type AvisoDoPainel } from "./avisoDoPainel";
import { rotuloDeMes } from "@/features/upload/enviar-extrato/SeletorDeMes";

/**
 * O que o painel mostra **enquanto o painel não existe** (tarefas D6 e D8).
 *
 * A régua aqui é uma só: não mentir. Não invento potes, não somo gastos, não
 * comparo com o mês passado — nada disso é possível antes da classificação.
 * Digo o que há no banco, de quem é, e qual é o passo que ainda falta.
 *
 * ⚠ **A spec 03 tornou falsas três frases desta tela**, e a D8 as corrigiu.
 * Ela dizia "nenhum caiu num pote ainda" (a D1 classifica na importação),
 * "a próxima funcionalidade a ser construída" (foi construída) e pedia
 * classificação mesmo sem nada pendente. Código que descreve o produto envelhece
 * junto com o produto; esta tela é a que envelhece mais rápido.
 */
export function ResumoDoQueEntrou({ resumo }: { resumo: ResumoDeLancamentos }) {
  return (
    <>
      <Card className="p-0">
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {/*
            "Sem categoria" e "Para revisar" eram dois terços da mesma fila, e
            nenhum dos dois era o tamanho dela. Agora o segundo número é o que
            já está resolvido e o terceiro é **exatamente** o que `/revisao`
            abre — mesma definição, mesmo arquivo.
          */}
          <Numero rotulo="Lançamentos" valor={resumo.total} destaque />
          <Numero rotulo="Classificados" valor={resumo.classificados} />
          <Numero rotulo="Para decidir" valor={resumo.paraDecidir} />
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
        ⚠ **Sem pendência, o app não pede nada.**

        Este cartão era fixo e dizia "falta classificar" mesmo depois de você
        classificar tudo — porque misturava a pendência (que acaba) com a
        limitação do produto (que continua). São dois estados agora, e a
        decisão de qual mostrar mora em `avisoDoPainel.ts`, testada.
      */}
      <Aviso aviso={avisoDoPainel(resumo.paraDecidir)} />

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

/**
 * Os dois estados do aviso, com a mesma forma e cores diferentes.
 *
 * Dourado pede atenção; verde registra. Um componente só para os dois porque a
 * diferença entre eles é de conteúdo e de tom, não de estrutura — e dois
 * componentes iguais divergiriam de espaçamento no primeiro ajuste.
 */
function Aviso({ aviso }: { aviso: AvisoDoPainel }) {
  const pedindo = aviso.tom === "pedir";

  return (
    <Card
      className={`mt-3 ${
        pedindo ? "border-gold/20 bg-gold/8" : "border-green/20 bg-green/8"
      }`}
    >
      <p
        className={`text-xs font-bold ${pedindo ? "text-gold" : "text-green"}`}
      >
        {aviso.titulo}
      </p>

      <p className="mt-1.5 text-xs leading-relaxed text-dim">{aviso.texto}</p>

      {aviso.acao && (
        <Link
          href={aviso.acao.href}
          className="mt-4 inline-flex min-h-11 items-center rounded-card bg-primary px-5 text-sm font-bold text-bg transition-colors hover:bg-orange"
        >
          {aviso.acao.rotulo}
        </Link>
      )}
    </Card>
  );
}
