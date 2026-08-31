import { BRANCO, contraste, emRgb, luminancia, type Rgb } from "./contraste";

/**
 * A cor do pote num fundo claro (tarefa A3 da spec 08).
 *
 * ## O problema, em uma frase
 *
 * A cor do pote **não está no CSS, está no banco**. `buckets.cor` é gravada uma
 * vez pelo seed do onboarding e nunca atualizada, e chega até a tela como
 * `style={{ backgroundColor: cor }}` — a barra do `CartaoDoPote`, a barra do
 * `SecaoDoComparativo`, a faixa do topo do cartão. Uma variável redefinida em
 * `:root` não muda um valor que veio do Postgres.
 *
 * E as cores foram escolhidas para brilhar no preto: `#00e5a0`, do pote
 * Liberdade Financeira, dá **1.54** contra uma superfície clara. A barra não
 * fica feia — ela **desaparece**.
 *
 * ## Por que derivar e não cadastrar
 *
 * A alternativa era uma migration com uma segunda coluna de cor. Ela custaria
 * seed novo e um valor a preencher à mão para todo pote que existir depois — e
 * quebraria de novo no dia em que a cor do pote virar editável, porque passaria
 * a pedir **duas** cores ao usuário. A função continua certa nos dois casos.
 *
 * ## A régua é branco puro, e é de propósito
 *
 * Não a superfície clara real do app, que ainda vai ser escolhida na B1: branco
 * é o fundo mais claro possível, logo o caso mais difícil. Uma cor que passa
 * contra branco passa contra qualquer superfície que a paleta venha a ter, e a
 * função não fica presa a um hex que mora em outro arquivo.
 */

/**
 * ⚠ **3, e não 4.5.** A cor do pote nunca é texto — é sempre preenchimento: uma
 * barra, uma faixa de 2px. A régua do WCAG para uma forma ser percebida como
 * elemento é 3; 4.5 é para ler letra. Exigir 4.5 escureceria os nove potes muito
 * além do necessário e apagaria a diferença entre eles.
 */
export const CONTRASTE_MINIMO_DE_PREENCHIMENTO = 3;

/**
 * A cor a usar quando o fundo é claro. Devolve o próprio hex quando ele já
 * passa — o pote Outros (`#5a5a70`) é o caso, com 6.71.
 *
 * ⚠ **Só o brilho muda; o tom fica.** Escurecer até passar seria trivial se a
 * resposta pudesse ser cinza. Não pode: a cor **é** a identidade do pote em três
 * telas, e Transporte e Liberdade Financeira precisam continuar sendo duas
 * coisas diferentes depois de escurecidos. Mexer no matiz para "melhorar" o
 * resultado trocaria o pote de cor, que é o único jeito de errar feio aqui.
 *
 * ⚠ **Hex que não dá para ler volta intacto.** `buckets.cor` é `text` no
 * Postgres; devolver o que veio deixa a barra errada, e lançar deixaria a
 * página inteira em branco.
 */
export function corParaFundoClaro(hex: string): string {
  const rgb = emRgb(hex);
  if (rgb === null) return hex;

  if (contraste(rgb, BRANCO) >= CONTRASTE_MINIMO_DE_PREENCHIMENTO) return hex;

  const { matiz, saturacao, brilho } = emHsl(rgb);

  /*
   * Passo de 1%, do brilho atual para baixo. O laço termina sempre: no limite,
   * brilho zero é preto, que dá 21 contra branco.
   *
   * Busca linear e não binária de propósito — são no máximo cem voltas de
   * aritmética, e o resultado é **o primeiro brilho que passa**, ou seja, a cor
   * mais próxima da original que serve. Uma busca binária chegaria em outro
   * ponto por um detalhe de arredondamento, e a cor do pote mudaria de tom
   * entre dois deploys sem ninguém ter mexido em nada.
   */
  for (let b = Math.round(brilho * 100); b >= 0; b--) {
    const candidata = emRgbDeHsl(matiz, saturacao, b / 100);

    if (contraste(candidata, BRANCO) >= CONTRASTE_MINIMO_DE_PREENCHIMENTO) {
      return emHex(candidata);
    }
  }

  return "#000000";
}

/**
 * ⚠ **4.5, e não 3.** A régua do WCAG para **ler letra**. A constante acima
 * existe porque a cor do pote nunca era texto; a spec 15 fez o número do cartão
 * do ano receber a cor do pote, e a partir daí ela é.
 */
export const CONTRASTE_MINIMO_DE_TEXTO = 4.5;

/**
 * A superfície escura **mais clara** do app — `--color-card2` do `globals.css`.
 *
 * ⚠ **É um token, e não um absoluto, e a assimetria é real.** `BRANCO` serve de
 * régua do lado claro porque existe um extremo: nada é mais claro que branco,
 * logo é o pior caso para letra escura. Do lado escuro **não há extremo
 * equivalente** — preto é o caso mais *fácil* para letra clara, não o mais
 * difícil. O pior caso é a superfície escura mais clara que o app tem, e essa é
 * uma escolha de paleta.
 *
 * Se o `globals.css` ganhar uma superfície escura mais clara que esta, este
 * valor sobe junto.
 */
export const FUNDO_ESCURO: Rgb = [0x16, 0x16, 0x1c];

/**
 * A cor do pote quando ela vira **texto** (tarefa A2 da spec 15).
 *
 * ## Por que não dá para usar a `corParaFundoClaro`
 *
 * Duas diferenças, e nenhuma é de gosto:
 *
 * 1. **A régua é 4.5 e não 3.** Preenchimento precisa ser percebido; letra
 *    precisa ser lida.
 * 2. **Ela só sabe escurecer.** No tema escuro a cor precisa **clarear** — e
 *    das nove do seed, uma reprova ali: `#5a5a70`, do pote Outros / Repasses,
 *    que dá 2.81 sobre o cartão. Era o valor de `--color-dim` até a spec 15
 *    clareá-lo pelo mesmo motivo.
 *
 * ## O fundo entra por parâmetro; a direção, não
 *
 * ⚠ **Quem chama diz contra o que vai medir, e não para que lado andar.** A
 * direção sai da luminância do fundo, aqui dentro. Um parâmetro `clarear:
 * boolean` deixaria a chamada errada ser escrita — e ela passaria, devolvendo
 * uma cor que some no tema em que o outro estilo a mostra.
 *
 * ⚠ **O matiz fica**, pela mesma razão da irmã: a cor **é** a identidade do
 * pote. Mexer no tom para "melhorar o número" trocaria o pote de cor, que é o
 * único jeito de errar feio aqui.
 *
 * ⚠ **Hex ilegível volta intacto.** `buckets.cor` é `text` no Postgres.
 */
export function corParaTexto(hex: string, fundo: Rgb): string {
  const rgb = emRgb(hex);
  if (rgb === null) return hex;

  if (contraste(rgb, fundo) >= CONTRASTE_MINIMO_DE_TEXTO) return hex;

  const { matiz, saturacao, brilho } = emHsl(rgb);

  /*
   * Fundo escuro pede letra mais clara; fundo claro pede mais escura. O ponto
   * de virada é a luminância que divide os dois casos do próprio WCAG.
   */
  const clareando = luminancia(fundo) < LUMINANCIA_DO_MEIO;
  const passo = clareando ? 1 : -1;

  /*
   * Passo de 1%, busca linear, do brilho atual para o extremo. Termina sempre:
   * branco dá 21 contra qualquer fundo escuro, e preto dá 21 contra qualquer
   * fundo claro.
   *
   * ⚠ **Linear e não binária, igual à irmã, e pelo mesmo motivo:** o resultado
   * é o **primeiro** brilho que passa. Uma busca binária pararia em outro ponto
   * por um detalhe de arredondamento, e a cor do pote mudaria de tom entre dois
   * deploys sem ninguém ter mexido em nada.
   */
  for (let b = Math.round(brilho * 100); b >= 0 && b <= 100; b += passo) {
    const candidata = emRgbDeHsl(matiz, saturacao, b / 100);

    if (contraste(candidata, fundo) >= CONTRASTE_MINIMO_DE_TEXTO) {
      return emHex(candidata);
    }
  }

  return clareando ? "#ffffff" : "#000000";
}

/**
 * A luminância que separa "fundo escuro" de "fundo claro".
 *
 * Não é 0.5: luminância relativa não é linear no olho. `0.179` é o ponto em que
 * branco e preto empatam em contraste sobre o mesmo fundo — a divisa que o
 * próprio WCAG produz, e não um palpite.
 */
const LUMINANCIA_DO_MEIO = 0.179;

/**
 * O matiz de uma cor, em graus (0 a 360) — ou `null` se o hex não der para ler.
 *
 * Existe porque **preservar o matiz é a promessa** de `corParaFundoClaro`, e uma
 * promessa que ninguém consegue medir não é promessa. É por aqui que o teste
 * afirma que o pote Transporte continua ciano depois de escurecido.
 */
export function matizEmGraus(hex: string): number | null {
  const rgb = emRgb(hex);
  if (rgb === null) return null;

  return emHsl(rgb).matiz * 360;
}

// ── HSL, só o suficiente para mexer no brilho ─────────────────────────────
//
// Não é uma biblioteca de cor: é a conversão de ida e volta, e o único ponto
// desta spec que precisa dela. `matiz` em voltas (0 a 1), como o resto.

type Hsl = { matiz: number; saturacao: number; brilho: number };

function emHsl([r, g, b]: Rgb): Hsl {
  const vr = r / 255;
  const vg = g / 255;
  const vb = b / 255;

  const maior = Math.max(vr, vg, vb);
  const menor = Math.min(vr, vg, vb);
  const amplitude = maior - menor;

  const brilho = (maior + menor) / 2;

  if (amplitude === 0) return { matiz: 0, saturacao: 0, brilho };

  const saturacao = amplitude / (1 - Math.abs(2 * brilho - 1));

  let matiz: number;
  if (maior === vr) matiz = ((vg - vb) / amplitude) % 6;
  else if (maior === vg) matiz = (vb - vr) / amplitude + 2;
  else matiz = (vr - vg) / amplitude + 4;

  matiz /= 6;
  if (matiz < 0) matiz += 1;

  return { matiz, saturacao, brilho };
}

function emRgbDeHsl(matiz: number, saturacao: number, brilho: number): Rgb {
  const c = (1 - Math.abs(2 * brilho - 1)) * saturacao;
  const setor = matiz * 6;
  const x = c * (1 - Math.abs((setor % 2) - 1));
  const m = brilho - c / 2;

  const [r, g, b] =
    setor < 1
      ? [c, x, 0]
      : setor < 2
        ? [x, c, 0]
        : setor < 3
          ? [0, c, x]
          : setor < 4
            ? [0, x, c]
            : setor < 5
              ? [x, 0, c]
              : [c, 0, x];

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function emHex([r, g, b]: Rgb): string {
  const canal = (v: number) => v.toString(16).padStart(2, "0");
  return `#${canal(r)}${canal(g)}${canal(b)}`;
}
