import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { categoriaPorChave } from "./categorias";

/**
 * "Sempre classificar assim?" (tarefa B3).
 *
 * ## É o momento de maior risco da tela inteira
 *
 * Responder "sempre" cria uma regra, e regra errada classifica **em silêncio**
 * por meses — o erro mais caro deste projeto. Uma clínica veterinária que
 * virasse regra pelo nome da maquininha levaria junto todo comerciante que usa
 * a mesma maquininha, e você só descobriria olhando o painel em novembro.
 *
 * Por isso a pergunta mostra duas coisas antes de você confirmar:
 *
 * 1. **O texto exato** que a regra vai procurar, em mono, destacado. É o
 *    trecho estável da A2, e ele nem sempre é o que você imagina — a A2
 *    mantém a cidade de propósito, por exemplo.
 * 2. **Quantos outros pendentes do mês ela pega junto.** Ver "isto vai pegar
 *    mais 4" antes de confirmar é a diferença entre uma regra boa e uma
 *    surpresa.
 *
 * ## Sem trecho, sem pergunta
 *
 * Quando a descrição não produz trecho estável, a pergunta não aparece: não há
 * o que oferecer, e inventar um trecho aqui seria criar a regra ruim por conta
 * própria. A A6 mediu zero casos assim no primeiro mês, mas ele existe.
 */
export function PerguntaDeRegra({
  chaveEscolhida,
  trecho,
  pegaJunto,
}: {
  chaveEscolhida: string;
  trecho: string | null;
  pegaJunto: number;
}) {
  const categoria = categoriaPorChave(chaveEscolhida);

  return (
    <Card className="mt-4 border-gold/20 bg-gold/8">
      <p className="text-xs text-dim">
        Guardado em{" "}
        <strong className="font-bold text-text">
          {categoria ? `${categoria.emoji} ${categoria.nome}` : chaveEscolhida}
        </strong>
        .
      </p>

      {trecho === null ? (
        <p className="mt-3 text-xs leading-relaxed text-dim">
          Esta descrição não tem um pedaço estável que dê para transformar em
          regra — então nada foi aprendido, e no mês que vem ela pergunta de
          novo. É melhor assim do que inventar uma regra que pegue o que não
          deve.
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm font-bold text-text">
            Classificar sempre assim?
          </p>

          <p className="mt-2 text-xs text-dim">A regra vai procurar por:</p>

          <p className="mt-1.5 rounded-pote border border-gold/20 bg-bg px-3 py-2.5 font-mono text-[11px] break-words text-gold">
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
            <Button className="sm:flex-1">Sempre</Button>
            <Button variant="secondary" className="sm:flex-1">
              Só desta vez
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
