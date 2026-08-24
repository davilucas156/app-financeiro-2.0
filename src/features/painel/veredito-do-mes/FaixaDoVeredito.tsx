import { Card } from "@/components/ui/Card";
import type { GrauDoVeredito, Veredito } from "./veredito";

/**
 * A frase do mês, no topo do painel (tarefa B1).
 *
 * ## Uma frase, e ela não compete com nada
 *
 * Decisão registrada na spec: uma frase é uma decisão de leitura — você lê.
 * Quatro viram relatório, e relatório se ignora. Por isso esta faixa é um bloco
 * só, sem lista, sem ícone de expandir e sem segunda linha.
 *
 * ## A cor vem do `grau`, nunca de ler a frase
 *
 * Mesma régua do `CartaoDoPote`: o estado tem de chegar antes do texto ser
 * processado. Uma tela que decidisse a cor procurando palavra dentro da frase
 * quebraria no dia em que a frase mudasse — e frase muda, é o que esta spec
 * inteira faz.
 *
 * ## `null` é silêncio, e silêncio é um resultado
 *
 * Sem renda declarada, ou num mês em que nada saiu, `vereditoDoMes` devolve
 * `null` e aqui não sobra nem a moldura. O `CampoDeRenda` logo abaixo já cobra
 * a renda; duas cobranças pela mesma coisa fazem ignorar as duas.
 */
export function FaixaDoVeredito({ veredito }: { veredito: Veredito | null }) {
  if (veredito === null) return null;

  const cor = CORES[veredito.grau];

  return (
    <Card className={`mt-4 border-l-4 ${cor.borda}`}>
      <p className="font-mono text-[9px] font-bold tracking-[1.5px] text-dim uppercase">
        O mês em uma frase
      </p>
      <p className={`mt-2 text-sm leading-relaxed ${cor.texto}`}>
        {veredito.frase}
      </p>
    </Card>
  );
}

/**
 * ⚠ **Quatro graus, quatro sentidos diferentes** — e nenhum deles é "erro".
 *
 * `revisar` é dourado porque pede trabalho, não porque algo está quebrado.
 * `renda` é azul porque é **pergunta**: pintá-la de vermelho seria o app
 * afirmando com cor o que a frase se esforça para não afirmar. `pote` é o único
 * vermelho, porque é o único que aponta o dedo. `dentro` é verde porque boa
 * notícia sem cor não é lida.
 */
const CORES: Record<GrauDoVeredito, { borda: string; texto: string }> = {
  revisar: { borda: "border-l-gold", texto: "text-gold" },
  renda: { borda: "border-l-blue", texto: "text-blue" },
  pote: { borda: "border-l-red", texto: "text-red" },
  dentro: { borda: "border-l-green", texto: "text-green" },
};
