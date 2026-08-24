/**
 * De onde vem o slug de uma categoria nova (tarefa A1).
 *
 * ⚠ **O slug é identidade de dados e não muda no renomear** (descoberta 3 da
 * spec 05). A semente da A5 aponta para `pote/categoria` por slug, e o
 * `onConflictDoNothing` do onboarding é idempotente **pelo slug**: se renomear
 * mudasse o slug, o reseed recriaria a categoria original ao lado da
 * renomeada, e metade do histórico ficaria em cada.
 *
 * Aqui é o único lugar onde ele nasce.
 */

/**
 * Nome → slug, no mesmo formato dos slugs do seed.
 *
 * `reserva-de-emergencia`, e não `reserva-de-emergência`: eles convivem na
 * mesma coluna e no mesmo único, então o formato tem de ser um só.
 *
 * Devolve `""` para um nome sem letra nem dígito. Quem impede isso de chegar
 * ao banco é a A2 — ver `slugUnico`.
 */
export function slugificar(nome: string): string {
  return (
    nome
      .normalize("NFD")
      /*
       * `\p{M}` — as marcas combinantes que a NFD acabou de separar das
       * letras.
       *
       * A propriedade Unicode, e não a faixa `̀-ͯ` que o resto da
       * base usa: aqui o texto vem do teclado do Davi e não de um extrato, e a
       * faixa curta cobre só o latim. `\p{M}` não deixa um acento de fora nem
       * precisa de caractere literal no arquivo-fonte.
       */
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

/**
 * O nome de reserva, para o caso que a A2 torna inalcançável pela tela.
 *
 * Não é redundância decorativa. Um chamador futuro que esqueça de validar
 * produz aqui um slug feio — e não um slug **vazio, que colidiria com todo
 * outro nome não validado**. O primeiro se conserta; o segundo vira suporte.
 */
const SEM_LETRAS = "categoria";

/**
 * O slug que não colide dentro do pote.
 *
 * ## Por que o sufixo, e não a recusa
 *
 * `(bucket_id, slug)` é único, e **nomes diferentes geram o mesmo slug**:
 * "Café" e "Cafe" caem os dois em `cafe`. Recusar seria incompreensível na
 * tela — os nomes são diferentes e a pessoa está olhando para os dois.
 *
 * O que autoriza o `-2` é que **ninguém vê o slug**. Um dado invisível pode
 * ganhar um sufixo sem dever satisfação a quem está na tela; o nome, que é
 * visível, continua sendo recusado quando repete
 * (`categories_bucket_id_nome_unq`).
 */
export function slugUnico(nome: string, jaUsados: Iterable<string>): string {
  const base = slugificar(nome) || SEM_LETRAS;
  const usados = new Set(jaUsados);

  if (!usados.has(base)) return base;

  // Começa no 2 porque o primeiro já é o `base` sem sufixo: "cafe" e "cafe-2"
  // lidos em sequência dizem qual veio antes.
  for (let n = 2; ; n++) {
    const tentativa = `${base}-${n}`;
    if (!usados.has(tentativa)) return tentativa;
  }
}
