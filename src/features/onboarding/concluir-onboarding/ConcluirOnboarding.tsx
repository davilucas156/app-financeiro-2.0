import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  POTES_PADRAO,
  rotuloMeta,
} from "@/features/onboarding/potes-padrao";

/**
 * Tela de boas-vindas do primeiro acesso — **protótipo visual** (tarefa B3).
 *
 * Não grava nada: o botão é estático. A gravação dos potes numa única
 * transação, idempotente, é da tarefa D7.
 */
export type EstadoOnboarding = "pronto" | "enviando" | "erro";

export function ConcluirOnboarding({
  nome,
  estado = "pronto",
}: {
  nome?: string;
  estado?: EstadoOnboarding;
}) {
  const primeiroNome = nome?.trim().split(/\s+/)[0];

  return (
    <div className="mx-auto w-full max-w-md px-5 py-12">
      <header>
        <p className="font-mono text-[9px] font-bold tracking-[3px] text-primary uppercase">
          Primeiro acesso
        </p>
        <h1 className="mt-2 text-[28px] leading-tight font-extrabold tracking-tight break-words">
          {primeiroNome ? `Olá, ${primeiroNome}!` : "Olá!"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-dim">
          Seu dinheiro vai ser dividido em potes. Cada gasto cai num deles, e
          cada pote tem uma fatia da sua renda como meta. Assim dá para ver, no
          fim do mês, onde o dinheiro realmente foi — sem planilha.
        </p>
      </header>

      <SectionTitle>Seus potes</SectionTitle>

      <div className="space-y-2">
        {POTES_PADRAO.map((pote) => (
          <div
            key={pote.slug}
            className="flex items-center gap-3 overflow-hidden rounded-pote border border-border bg-card"
          >
            <span className={`${pote.classeCor} h-11 w-1 shrink-0`} />
            <span className="text-base">{pote.emoji}</span>
            <span className="flex-1 text-sm font-bold break-words">
              {pote.nome}
            </span>
            <span className="pr-4 font-mono text-[11px] text-dim">
              {rotuloMeta(pote)}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 font-mono text-[10px] leading-relaxed text-dim2">
        Os dois últimos ficam fora do rateio: manutenção é custo flutuante e
        repasses não são gasto seu. Dá para ajustar os percentuais depois.
      </p>

      {estado === "erro" && (
        <Card
          role="alert"
          className="mt-6 border-red/20 bg-red/8 p-4"
        >
          <p className="text-xs font-bold text-red">
            Não conseguimos preparar sua conta.
          </p>
          <p className="mt-1.5 text-xs text-dim">
            Nada foi gravado pela metade. Tente de novo.
          </p>
        </Card>
      )}

      <Button
        loading={estado === "enviando"}
        className="mt-6 w-full"
      >
        {estado === "enviando"
          ? "Preparando sua conta…"
          : estado === "erro"
            ? "Tentar de novo"
            : "Começar"}
      </Button>

      <p className="mt-3 text-center font-mono text-[10px] text-dim2">
        Protótipo visual · a gravação entra na tarefa D7
      </p>
    </div>
  );
}
