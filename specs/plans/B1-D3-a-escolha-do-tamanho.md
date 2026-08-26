# Plano — B1 a D3: a escolha do tamanho

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** B1, B2, C1, C2, D1, D2 e D3 de
`specs/10-tamanho-da-letra.tarefas.md`
**Depende de:** a fase A inteira. Sem os tokens, não há o que redefinir.

---

## A pendência 6 está resolvida: o que se compartilha é o mecanismo, não a decisão

Abertos `tema.ts` e o `letra.ts` que ele viraria, lado a lado, o que se repete é:

| Repetido                                      | É forma ou decisão?                                            | Vai para onde       |
| --------------------------------------------- | -------------------------------------------------------------- | ------------------- |
| `VALIDADE_DO_COOKIE_SEG = 60*60*24*365`       | **Decisão** — mesmo número, mesmo motivo escrito               | Compartilhado       |
| `valor.trim().toLowerCase()` + lista + padrão | **Decisão** — perdoar caixa e cair no padrão sem log           | Compartilhado       |
| As cinco opções do `cookieStore.set`          | **Decisão** — `httpOnly:false` tem um porquê que vale nos dois | Compartilhado       |
| A lista de valores, o padrão, os rótulos      | **Decisão de cada preferência**, com o porquê próprio          | Fica em cada módulo |

⚠ **Um `preferenciaDoAparelho({ cookie, valores, padrao })` genérico que
engolisse tudo seria o erro.** Ele economizaria umas quinze linhas e custaria a
coisa que dá valor ao `tema.ts`: os parágrafos que explicam _por que_ o padrão é
escuro e _por que_ valor desconhecido não vira log. Num módulo genérico esses
parágrafos não têm onde morar — e é para eles que este projeto escreve
comentário.

**O corte é: o mecanismo do cookie é um só; a lista e o padrão são de cada um.**

⚠ **`tema.ts` e `escolherTema.action.ts` são refatorados junto**, senão o módulo
compartilhado nasce com um usuário e a duplicação continua de pé. É seguro:
`tema.test.ts` já cobre `temaEscolhido` em seis casos, inclusive `"  SISTEMA  "`
e `"<script>"`.

---

## Arquivos a criar

### `src/features/aparencia/preferencia/preferenciaDoAparelho.ts`

O mecanismo, e só ele:

```ts
export const VALIDADE_DO_COOKIE_SEG = 60 * 60 * 24 * 365;

/** O que veio no cookie → um dos valores da lista, ou o padrão. */
export function escolhaValida<T extends string>(
  valores: readonly T[],
  padrao: T,
  valor: string | undefined | null,
): T;

/** Grava uma preferência do aparelho. Não é sessão, não é segredo. */
export async function gravarPreferencia(
  cookie: string,
  valor: string,
): Promise<void>;
```

⚠ **`gravarPreferencia` não valida nada** — quem chama já passou por
`escolhaValida`. Validar aqui dentro exigiria a lista, e aí o módulo saberia
sobre tema e letra, que é exatamente o acoplamento que ele existe para não ter.

### `src/features/aparencia/preferencia/preferenciaDoAparelho.test.ts`

Os casos de `escolhaValida` que hoje moram em `tema.test.ts`, genéricos: lista
vazia de entrada (`undefined`, `null`, `""`), caixa e espaço, valor fora da
lista, valor com `;`.

### `src/features/aparencia/letra/letra.ts`

```ts
export const TAMANHOS = ["padrao", "grande", "maior"] as const;
export type Tamanho = (typeof TAMANHOS)[number];
export const TAMANHO_PADRAO: Tamanho = "padrao";
export const COOKIE_DA_LETRA = "letra";
export function letraEscolhida(valor: string | undefined | null): Tamanho;
export const ROTULOS_DO_TAMANHO: Record<
  Tamanho,
  { titulo: string; nota: string }
>;
```

Rótulos:

| Valor    | Título   | Nota                                  |
| -------- | -------- | ------------------------------------- |
| `padrao` | "Padrão" | "Como o app foi desenhado."           |
| `grande` | "Grande" | "Um pouco maior, sem mudar o layout." |
| `maior`  | "Maior"  | "Para ler sem apertar os olhos."      |

⚠ **`"padrao"` sem acento**, porque vira valor de atributo HTML e valor de
cookie. Acento nos dois funciona e não vale o risco de codificação.

⚠ **O padrão é `padrao`, e é decisão de não-mudança**: ninguém pediu um app
maior, e mudar o tamanho de todo mundo no deploy se lê como defeito. Mesma
lógica do `TEMA_PADRAO` escuro.

### `src/features/aparencia/letra/letra.test.ts`

Molde do `tema.test.ts`: os três valores passam, sem cookie é o padrão, valor
desconhecido cai no padrão, perdoa caixa e espaço, o padrão está na lista, e
**todo valor de `TAMANHOS` tem rótulo** — senão uma opção nova aparece na tela
sem texto.

### `src/features/aparencia/letra/letraAtual.ts`

`import "server-only"`, lê `cookies()`, passa por `letraEscolhida`. Cópia
estrutural de `temaAtual.ts`, pelo mesmo motivo declarado lá: dois lugares
perguntam, e escrito duas vezes um deles esqueceria a limpeza e passaria texto
cru do cookie para um atributo do `<html>`.

### `src/features/aparencia/escolher-letra/escolherLetra.action.ts`

```ts
"use server";
export async function escolherLetra(tamanho: Tamanho): Promise<void> {
  const seguro = letraEscolhida(tamanho); // ⚠ sim, mesmo tipado
  await gravarPreferencia(COOKIE_DA_LETRA, seguro);
}
```

⚠ **A limpeza acontece mesmo o argumento sendo `Tamanho`.** Tipo é garantia de
compilação; **action é endpoint HTTP** e recebe o que mandarem. Sem ela,
`escolherLetra("<script>")` grava a string e ela volta carimbada em `data-letra`
no `<html>` da requisição seguinte. É a armadilha que `escolherTema` já
documenta.

⚠ **Não passa por `garantirUsuario()`**, e não é esquecimento: não há `user_id`
envolvido, e ela precisa funcionar em `/entrar`, onde ainda não há sessão.

### `src/features/aparencia/escolher-letra/SeletorDeLetra.tsx`

`"use client"`. O `SeletorDeTema` com outra lista e sem o trecho do
`useSistemaClaro` — aqui não existe "seguir o sistema".

## Arquivos a modificar

### `src/features/aparencia/tema/tema.ts`

`VALIDADE_DO_COOKIE_SEG` passa a **reexportar** do módulo compartilhado (para
`escolherTema.action.ts` não mudar de import), e `temaEscolhido` passa a delegar
a `escolhaValida(TEMAS, TEMA_PADRAO, valor)`. Os comentários de decisão **ficam
onde estão** — é o ponto do corte.

### `src/features/aparencia/escolher-tema/escolherTema.action.ts`

O corpo do `cookieStore.set` vira `gravarPreferencia(COOKIE_DO_TEMA, seguro)`. O
comentário sobre `httpOnly:false` **muda de arquivo**, não desaparece.

### `src/app/globals.css` — tarefa C1

Depois dos blocos de tema claro, no mesmo `@layer base`:

```css
:root[data-letra="grande"] {
  --text-4xs: 11px;
  --text-3xs: 12px;
  --text-2xs: 13px;
  --text-xs: 0.875rem; /* 14px */
  --text-sm: 1rem; /* 16px */
}
:root[data-letra="maior"] {
  --text-4xs: 13px;
  --text-3xs: 14px;
  --text-2xs: 15px;
  --text-xs: 1.0625rem; /* 17px */
  --text-sm: 1.1875rem; /* 19px */
}
```

⚠ **`--text-fixo` não aparece em nenhum dos dois, e é a exceção inteira.** Ela
funciona **por omissão**, que é frágil o bastante para o comentário do arquivo
dizer isso em voz alta.

⚠ **Cada token mantém a unidade que tem no padrão — e isso não é capricho.**
Os três de baixo ficam em `px` porque é o que eles são hoje: `text-[9px]` é um 9
absoluto, e passá-los para `rem` mudaria o tamanho de quem tem a fonte do
navegador ajustada — quebrando a regra da fase A de que **nada pode se mexer**.
Os dois de cima ficam em `rem` porque é assim que o Tailwind os entrega, e
trocá-los para `px` tiraria dessa pessoa o ajuste que ela já tinha.

A mistura de unidades é, portanto, **herdada e preservada**, não introduzida
aqui. Escrever um degrau na unidade errada mudaria silenciosamente o
comportamento de quem mais precisa desta funcionalidade.

As entrelinhas acompanham nos dois casos: são razões sem unidade
(`calc(1 / .75)`) ou `normal`.

⚠ **Sem `@media`, sem terceiro bloco.** Não existe "seguir o sistema" aqui: o
navegador não expõe preferência de tamanho por `prefers-*`.

### `src/app/layout.tsx` — tarefa C2

```tsx
const [tema, letra] = await Promise.all([temaAtual(), letraAtual()]);
…
<html lang="pt-br" data-tema={tema} data-letra={letra} …>
```

⚠ **Decidido no servidor, e é o que impede a piscada** — descoberta 5 da spec 08
pela segunda vez.

⚠ **`generateMetadata` e `generateViewport` não mudam.** Tamanho de letra não
muda a moldura que o sistema desenha; era cor que mudava.

### `src/features/aparencia/escolher-tema/TelaDeConfiguracoes.tsx` — tarefa D3

- Assinatura passa a `{ tema, letra }`.
- Segunda seção, com o mesmo rótulo mono + `Card` da primeira.
- ⚠ **O docblock do topo fica falso e tem de ser reescrito.** Ele diz _"Uma tela
  com uma seção, e ela é honesta"_ e explica que ela é tela porque é aqui que a
  próxima preferência vai cair. **Caiu.** Comentário que descreve um app que não
  existe mais é pior do que comentário nenhum.
- ⚠ A frase _"A escolha vale neste aparelho"_ passa a valer para as duas seções
  — sobe para antes delas, ou se repete? **Sobe.** Repetida, ela seria a mesma
  decisão escrita duas vezes na mesma tela.

### `src/app/(app)/configuracoes/page.tsx`

`<TelaDeConfiguracoes tema={…} letra={…} />`, com os dois `await` num
`Promise.all`.

## Reuso identificado

| O que                          | Onde                       | Como é usado                                                                                                                |
| ------------------------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `SeletorDeTema.tsx`            | `aparencia/escolher-tema/` | Molde do `SeletorDeLetra`: `radiogroup`, bolinha `size-4`, `min-h-11`, `rounded-pote`, estados `border-primary/50 bg-card2` |
| `temaAtual.ts`                 | `aparencia/tema/`          | Molde de `letraAtual.ts`                                                                                                    |
| `escolherTema.action.ts`       | `aparencia/escolher-tema/` | Molde da action — e passa a **dividir** o mecanismo                                                                         |
| `tema.test.ts`                 | `aparencia/tema/`          | Molde do `letra.test.ts`; seus casos genéricos migram para o teste do mecanismo                                             |
| `Card`, `SectionTitle`         | `components/ui/`           | A segunda seção                                                                                                             |
| Os blocos `:root[data-tema=…]` | `app/globals.css`          | O mecanismo de redefinir token sob atributo, já provado em produção                                                         |

## Caminho feliz

1. B1/B2 sobem com teste. `npx vitest run` verde — inclusive `tema.test.ts`, que
   é o que prova que o refactor não mudou comportamento.
2. C1 sobe. Nada muda ainda: ninguém carimba `data-letra`.
3. C2 sobe. Com cookie ausente, `data-letra="padrao"`, que não redefine nada — o
   app continua idêntico.
4. D1/D2/D3 sobem. Em `/configuracoes` aparece a segunda seção.
5. Tocar em "Grande": **a tela cresce no ato**, antes de a action responder.
6. Voltar ao painel: já está grande. Fechar e reabrir: **abre grande, sem
   piscar**.
7. `tsc`, `eslint`, `vitest`, `next build` limpos.
8. Conferir no CSS servido que os dois blocos `[data-letra]` chegaram, como fiz
   com `--claro-*` na spec 08.

## Edge cases

- **Cookie `letra=gigante`** (versão futura do app revertida): cai em `padrao`,
  em silêncio, sem log. Coberto por teste.
- **Cookie `letra` com `;` ou aspas:** `escolhaValida` devolve o padrão; nunca
  chega a `data-letra` — este é o caminho que levaria texto do usuário para um
  atributo do HTML, e é por isso que a limpeza é dupla (na leitura e na action).
- **Tocar na opção já marcada:** a action é chamada e regrava o mesmo valor.
  Nada pisca porque o `useEffect` está preso ao estado, que não mudou.
- **JavaScript desligado / action falha:** o cookie não grava, mas **a tela já
  cresceu** — e volta ao anterior na próxima abertura. Sem mensagem de erro, pelo
  mesmo motivo do tema: um aviso vermelho embaixo de uma tela que visivelmente
  funcionou confunde mais do que informa.
- **Tema e tamanho ao mesmo tempo** (`[data-tema="claro"][data-letra="maior"]`):
  os blocos são independentes e ambos em `@layer base` com a mesma
  especificidade (um atributo). Não competem — mexem em variáveis diferentes.
- **`/entrar` e `/cadastrar`:** herdam `data-letra` (o layout é a raiz), mas o
  Clerk desenha o próprio DOM e não escala. Declarado fora de escopo na spec.

## Erros

- **`react-hooks/set-state-in-effect` / `immutability`:** os dois já morderam no
  `SeletorDeTema`. A escrita em `document.documentElement.dataset.letra` vai num
  `useEffect` preso ao estado, nunca dentro do `onClick`.
- **Especificidade insuficiente:** `@theme` emite em `:root`; `:root[data-letra]`
  tem especificidade maior e ganha. Já provado pelos blocos de tema. Se por
  algum motivo não ganhar, **conferir no CSS servido antes de mexer em
  `!important`** — a spec 08 mostrou que o problema real costuma ser outro.
- **`letraAtual()` tornando rota dinâmica:** já é o caso do `temaAtual()`, e a
  moldura de `(app)` é `force-dynamic` desde a spec 01. Custo zero.

## Banco de dados

Nenhum. Nenhuma tabela, nenhuma coluna, nenhuma migration. A preferência é do
aparelho — pendência 1 da spec 08, herdada de propósito.
