/**
 * Quanto os potes somam, e a frase que diz isso (tarefa A2).
 *
 * ## Informa, e não impede
 *
 * A semente soma exatamente 100 (30/25/15/15/10/5), e é tentador virar isso
 * regra. Mas **nada no app soma potes** — `meta.ts` é explícito: _"não existe
 * '% do gasto' nesta tela. Cada pote se mede contra a própria meta"_. Os 100
 * são propriedade da semente, não invariante do sistema.
 *
 * Forçar 100 na edição transformaria "quero apertar o Transporte" numa conta de
 * fechar caixa que ninguém pediu para fazer. Somar 250% sem nunca saber também
 * não serve. A saída é a mesma da prévia do mapeamento na spec 11: **mostrar a
 * consequência em vez de impedir**.
 *
 * ⚠ **Por isso o tipo de retorno não tem variante de falha.** Não é descuido:
 * uma assinatura que não pode reprovar nada é a forma mais barata de garantir
 * que esta linha nunca vire trava. Quem quiser transformá-la em validação vai
 * ter de mudar o tipo primeiro — e aí a decisão fica visível no diff.
 */

export type SomaDasMetas = {
  /** Só os potes de gasto **com** percentual. */
  soma: number;
  potesComMeta: number;
  frase: string;
};

/**
 * Aceita a **forma** e não o tipo importado: assim serve à tela de arrumação e
 * ao teste sem arrastar `PoteNaGestao` para dentro deste módulo.
 */
type PoteQueConta = {
  tipo: "gasto" | "renda";
  percentual: number | null;
};

export function somaDasMetas(potes: PoteQueConta[]): SomaDasMetas {
  /*
   * ⚠ **Sem meta não entra como zero.** A soma sairia igual, mas a contagem
   * sairia errada — e é a contagem que decide entre "nenhum pote tem meta" e
   * "os potes somam 0%", que são frases diferentes para situações diferentes.
   *
   * O pote de renda fica de fora pelo motivo do schema: os potes de gasto
   * repartem o que sai; entrada não se reparte.
   */
  const comMeta = potes.filter(
    (p) => p.tipo === "gasto" && p.percentual !== null,
  );

  const soma = comMeta.reduce((total, p) => total + (p.percentual ?? 0), 0);

  return {
    soma,
    potesComMeta: comMeta.length,
    frase: frasear(soma, comMeta.length),
  };
}

function frasear(soma: number, potesComMeta: number): string {
  if (potesComMeta === 0) {
    return "Nenhum pote tem meta — o painel não vai julgar nada.";
  }

  if (soma < 100) {
    return `Seus potes somam ${soma}% da renda — sobram ${100 - soma}% sem destino.`;
  }

  if (soma > 100) {
    // Descreve o que acontece e para. Sem "erro", sem "inválido", sem "corrija":
    // a pessoa pode ter feito isso de propósito, e a conta é dela.
    return `Seus potes somam ${soma}% da renda — juntos, pedem mais do que entra.`;
  }

  return "Seus potes somam 100% da renda.";
}
