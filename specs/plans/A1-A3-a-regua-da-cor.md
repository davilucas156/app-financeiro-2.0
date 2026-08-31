# Plano — Fase A · A régua da cor

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** A1, A2 e A3 de
[15-comparativo-legivel.tarefas.md](../15-comparativo-legivel.tarefas.md)
**Status:** ⚠ **rascunho, não aprovado.**

> ⚠ Nenhum dado real neste documento.

---

## O que já existe, e por isso não vou criar de novo

| Já existe | Onde | O que faço com ele |
|---|---|---|
| `contraste`, `luminancia`, `emRgb`, `BRANCO` | `tema/contraste.ts` | **uso** — a régua do WCAG já está medida e testada contra valores conhecidos |
| `emHsl` / `emRgbDeHsl` / `emHex` | `tema/corNoTema.ts`, privados | **uso** — é por isso que a função nova mora **neste arquivo** e não num novo |
| `corParaFundoClaro` | `tema/corNoTema.ts` | **não toco** — ela mira 3, serve preenchimento, e continua certa nisso |
| `matizEmGraus` | `tema/corNoTema.ts` | **uso nos testes** — é como se afirma que o pote não trocou de cor |
| `estiloDoPote` | `tema/estiloDoPote.ts` | **molde** — o `light-dark()` e o porquê dele já estão resolvidos ali |

⚠ **A função nova vai para `corNoTema.ts`, e não para um arquivo próprio.** Ela
precisa de `emHsl` e `emRgbDeHsl`, que são privados de lá. Um arquivo novo os
obrigaria a virar `export` — API pública nascendo por acidente de organização,
que é exatamente o que a limpeza de 30/08 tirou do schema.

---

## A1 · `--color-dim` passa a `#7d7d96`

### Arquivo

`src/app/globals.css`, bloco `@theme`, linha 26.

### O que muda

```diff
-  --color-dim: #5a5a70;
+  --color-dim: #7d7d96; /* 4.70 sobre --card · era #5a5a70 (2.81) */
```

E, acima do par `dim`/`dim2`, um comentário com a regra que hoje só existe do
lado claro:

- `dim` **carrega texto** e por isso passa de 4,5;
- `dim2` é **desabilitado** e reprova de propósito — nos dois temas;
- o valor novo é o **mesmo matiz** do antigo, clareado até passar, que é a
  técnica já usada nas cores semânticas claras.

### Os números que vão no comentário

Medidos com a `contraste` do projeto:

| Fundo | antes | depois |
|---|---|---|
| `--bg` `#060608` | 3,02 | **5,06** |
| `--card` `#111116` | 2,81 | **4,70** |
| `--card2` `#16161c` | 2,69 | **4,50** |

⚠ **A referência é `--card2`, a superfície mais clara do tema escuro.** É o caso
mais difícil para letra clara — o oposto do branco no tema claro, e pelo mesmo
raciocínio do docblock de `corParaFundoClaro`.

### Caminho feliz, borda e erro

- **Feliz:** todo texto secundário do app fica legível, sem nenhuma outra mudança.
- **Borda:** `--claro-dim` **não muda** — ele já está em 5,19.
- **Borda:** a cor do pote *Outros / Repasses* continua `#5a5a70` no banco. Ela
  **era** o valor de `--color-dim`, e deixa de ser. O comentário do teste
  `corNoTema.test.ts` que diz *"O pote Outros é `--color-dim`"* fica falso e
  **é corrigido nesta tarefa** — comentário errado é pior que comentário ausente.
- **Erro:** nenhum. É um valor de token; não há caminho de falha.

---

## A2 · `corParaTexto`

### Arquivo

`src/features/aparencia/tema/corNoTema.ts` (acrescenta) e
`src/features/aparencia/tema/corNoTema.test.ts` (acrescenta um `describe`).

### A assinatura, e por que ela recebe o fundo

```ts
export const CONTRASTE_MINIMO_DE_TEXTO = 4.5;
export const FUNDO_ESCURO: Rgb = /* --card2 #16161c */;

export function corParaTexto(hex: string, fundo: Rgb): string;
```

⚠ **Recebe o fundo, enquanto `corParaFundoClaro` o assume.** A irmã pode assumir
branco porque só existe um extremo: branco é o fundo mais claro possível, logo o
pior caso para letra escura. **No escuro não há extremo equivalente** — preto é
o caso mais *fácil* para letra clara, não o mais difícil. O pior caso é a
superfície escura **mais clara** que o app tem, e isso é um valor de token, não
um absoluto. Fingir que existe um extremo aqui seria a função mentindo sobre a
própria régua.

### O que ela faz

1. Lê o hex. Ilegível volta intacto — mesma decisão de `corParaFundoClaro`, e
   pelo mesmo motivo: `buckets.cor` é `text` no Postgres, e uma exceção aqui
   derrubaria a página por causa de um número colorido.
2. Já passa de 4,5 contra o fundo? Devolve como veio.
3. Senão, **anda no brilho no mesmo matiz** até passar — **para cima** se o
   fundo for escuro, **para baixo** se for claro. A direção sai da luminância
   do fundo, e não de um parâmetro: quem chama não deveria poder errar isso.
4. Passo de 1%, busca linear, o **primeiro** brilho que serve — igual à irmã, e
   pelo mesmo motivo escrito lá: uma busca binária pararia em outro ponto por
   arredondamento, e a cor do pote mudaria de tom entre dois deploys.
5. O laço termina sempre: no limite, branco dá 21 contra qualquer fundo escuro e
   preto dá 21 contra qualquer fundo claro.

### Testes

1. **As nove cores passam de 4,5 contra `FUNDO_ESCURO`.** É a tarefa inteira.
2. **As nove passam de 4,5 contra `BRANCO`** — o outro tema, mesma função.
3. **O matiz fica**, nos dois sentidos. Molde: o teste que já existe.
4. **Transporte e Liberdade Financeira continuam a mais de 20° de distância**,
   clareados — o par mais próximo, o mesmo do teste da spec 08.
5. ⚠ **O pote Outros (`#5a5a70`, 2,81 no escuro) clareia; os outros oito não
   mudam.** É o caso que prova que a função faz alguma coisa, e o único que
   reprova como texto no escuro.
6. **Clareia o mínimo** — margem de 0,6 acima da régua, como a irmã. Sem isto,
   uma função que devolvesse `#ffffff` para tudo passaria nos testes 1 a 5 e
   apagaria a identidade dos nove potes.
7. **Hex ilegível volta como veio.**

⚠ **O teste 6 é o que impede a solução preguiçosa**, e é a lição já registrada
na spec 08 — lá, para o preto.

---

## A3 · `estiloDoTextoDoPote`

### Arquivo

`src/features/aparencia/tema/estiloDoPote.ts` (acrescenta) e
`estiloDoPote.test.ts` (acrescenta um `describe`).

### O que faz

```ts
export function estiloDoTextoDoPote(cor: string): CSSProperties {
  return {
    "--pote-texto-escuro": corParaTexto(cor, FUNDO_ESCURO),
    "--pote-texto-claro": corParaTexto(cor, BRANCO),
    color: "light-dark(var(--pote-texto-claro), var(--pote-texto-escuro))",
  } as CSSProperties;
}
```

⚠ **Nomes de variável próprios, e não reaproveitar `--pote-claro`/`--pote-escuro`.**
Um cartão vai ter os dois estilos por perto — a cor de preenchimento e a de
texto — e as duas versões da mesma cor **não são o mesmo valor**: uma passa em 3,
a outra em 4,5. Reusar o nome faria a última declaração vencer, calada.

⚠ **`light-dark()` de novo, e a recusa da spec 08 continua não valendo aqui**,
pelos mesmos três motivos escritos em `estiloDoPote`: a cor do pote não é token
do Tailwind, ninguém a mistura em `color-mix`, e o valor vai no atributo
`style`, onde o Lightning CSS nem o vê.

### Testes

Mesmo molde do arquivo, com a licença de `Record<string, string>` que já existe
ali (`CSSProperties` do React não indexa custom property):

1. As duas cores existem no elemento.
2. `color` cita **as duas variáveis que o próprio estilo declara** — é o teste
   que teria pego o defeito de seis dias do `--cor-do-pote`.
3. ⚠ **As duas versões de texto são diferentes das duas de preenchimento**, para
   o mesmo pote. Se um dia alguém "simplificar" apontando uma para a outra, este
   teste cai.

---

## O que **não** faço nesta fase

- **Nenhum componente muda.** `estiloDoTextoDoPote` nasce sem chamador; quem o
  usa é a B1. Uma fase que já mexesse na tela misturaria "a régua está certa?"
  com "o cartão ficou bom?", e são duas perguntas para dois olhares.
- **`corParaFundoClaro` fica como está.** 3 continua certo para preenchimento.
- **`--color-dim2` fica como está**, nos dois temas.

---

## Como confiro antes de te entregar

- `npm test` — os testes novos e os 696 que já existem.
- `npx tsc --noEmit`, `npm run lint`, `npm run format:check`, `npm run build`.
- ⚠ **A conferência de tela continua sendo sua.** CSS não roda no Vitest: o que
  o teste segura é o contrato, não o que o navegador desenha.
