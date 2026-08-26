# Tarefas — Tamanho da letra

**Etapa:** 2 (Break) do workflow `dev-workflow-davi`
**Spec de origem:** `specs/10-tamanho-da-letra.md`
**Status:** a escrever

Legenda de camada: `INFRA` · `FRONT-VISUAL` · `FRONT-INTEGRADO` · `BACK` · `BANCO`

---

## A ordem é: primeiro o vocabulário, depois a escolha

Esta spec não se quebra por tela — ela tem uma tela só, e ela é pequena. Quebra-se
pelo que a descoberta 1 achou: **o app não tem vocabulário de tamanho**, e sem ele
não existe configuração para ligar.

Daí as duas metades:

1. **Fase A — o vocabulário.** Os 97 px cravados ganham nome, e a exceção do
   cabeçalho do pote ganha o dela. ⚠ **A fase A inteira sobe sem que exista
   configuração nenhuma**, e é isso que a torna conferível: se ela estiver certa,
   **o app fica idêntico ao pixel**. Qualquer coisa que se mexeu é erro de
   conversão, e se vê antes de haver um segundo tamanho para confundir a leitura.
2. **Fases B a D — a escolha.** A preferência como valor, o CSS que a aplica, e a
   tela. É a spec 08 outra vez, com outro atributo.

A fase E é a única que só existe porque a spec 10 é diferente da 08: aqui **o
layout muda de tamanho**, e alguma linha vai apertar.

## Nenhuma migration, nenhuma consulta, nenhuma linha de banco

A preferência é um cookie do aparelho, como o tema. Nada aqui toca Postgres,
nada aqui lê `user_id`, nada aqui passa por `garantirUsuario()`.

## Reuso antes de criação

| O que                          | Onde                       | Para quê aqui                                                    |
| ------------------------------ | -------------------------- | ---------------------------------------------------------------- |
| `tema.ts`                      | `aparencia/tema/`          | O molde de `letra.ts`, linha por linha — ver B1                  |
| `temaAtual.ts`                 | `aparencia/tema/`          | O molde de `letraAtual.ts`                                       |
| `SeletorDeTema.tsx`            | `aparencia/escolher-tema/` | O molde do seletor: `radiogroup`, bolinha, 44px, efeito          |
| `escolherTema.action.ts`       | `aparencia/escolher-tema/` | O molde da action, inclusive o "não passa por `garantirUsuario`" |
| Os blocos `:root[data-tema=…]` | `app/globals.css`          | O mecanismo já provado de redefinir token sob atributo           |
| `data-tema` no `<html>`        | `app/layout.tsx`           | O `data-letra` entra na mesma linha, pelo mesmo motivo           |
| `Card`, `SectionTitle`         | `components/ui/`           | A segunda seção da `/configuracoes`                              |

⚠ **Nenhuma rota nova**, então **nada a acrescentar em `src/proxy.ts`** — a
`/configuracoes` já está protegida desde a spec 08. É a primeira spec em quatro
que não precisa daquele lembrete.

---

## Fase A — o vocabulário (o app não muda de aparência)

### A1 · Os quatro tokens novos

**Camada:** INFRA
**Arquivos:** `src/app/globals.css`
**Pronto quando:** `text-4xs`, `text-3xs`, `text-2xs` e `text-fixo` existem como
utilitários, e **nenhum arquivo os usa ainda**.

Os quatro entram no bloco `@theme` que já tem as cores e os raios:

```css
--text-4xs: 9px;
--text-4xs--line-height: normal;
--text-3xs: 10px;
--text-3xs--line-height: normal;
--text-2xs: 11px;
--text-2xs--line-height: normal;
--text-fixo: 14px;
--text-fixo--line-height: calc(1.25 / 0.875);
```

⚠ **A entrelinha `normal` não é preguiça — é o que reproduz o hoje.** Descoberta
3: `text-[10px]` compila só com `font-size`, e a entrelinha daqueles elementos é
a herdada, que o preflight não declara. Qualquer razão que eu inventasse aqui
moveria 97 lugares de uma vez, e o diff da A2 deixaria de ser conferível.

⚠ **`--text-fixo` copia a razão do `--text-sm`** porque é dela que ele sai. Se
levasse `normal`, as duas letras do cabeçalho do pote mudariam de entrelinha na
A3 — que é justamente a tarefa que não pode mudar nada.

### A2 · Os 97 px cravados viram token

**Camada:** FRONT-VISUAL
**Arquivos:** os 39 `.tsx` que a descoberta 1 listou
**Pronto quando:** `grep -r 'text-\[9px\]\|text-\[10px\]\|text-\[11px\]' src`
não devolve nada, e **o app está idêntico**.

Três trocas literais, sem exceção e sem julgamento:

| De            | Para       | Usos |
| ------------- | ---------- | ---- |
| `text-[11px]` | `text-2xs` | 37   |
| `text-[10px]` | `text-3xs` | 33   |
| `text-[9px]`  | `text-4xs` | 27   |

⚠ **Esta é a tarefa arriscada da spec, e o risco não é de compilação.** Nem o
`tsc` nem o `next build` olham para classe de CSS: uma troca errada passa nos
dois e chega na tela. **Só a conferência visual pega.**

⚠ **Fica de fora `text-[7px]`** — o pontinho `●` do `Badge`, `aria-hidden`. Não é
letra. E ficam de fora `text-[22px]` e `text-[28px]`, que estão acima da régua.

**Critério de conferência:** abrir `/dashboard`, `/revisao`, `/upload`,
`/categorias`, `/regras`, `/comparativo`, `/passos` e `/configuracoes` no tamanho
Padrão e comparar com antes. Nada pode ter se mexido.

### A3 · A exceção do cabeçalho do pote

**Camada:** FRONT-VISUAL
**Arquivos:** `src/features/painel/painel-do-mes/CartaoDoPote.tsx`
**Pronto quando:** o nome e o valor do cabeçalho usam `text-fixo`, e o resto do
cartão continua nos tokens que escalam.

São duas linhas, e só duas — descoberta 4. A legenda, o "meta …", o insight, as
categorias e os lançamentos **continuam escalando**, e é isso que impede a
configuração de parecer quebrada no painel.

⚠ **Precisa de um comentário no arquivo dizendo por que aquelas duas são
diferentes.** Sem ele, a próxima pessoa "conserta" a inconsistência e a linha
volta a quebrar em "Maior".

### A4 · O teste que impede a configuração de vazar

**Camada:** BACK (teste puro)
**Arquivos:** `src/features/aparencia/letra/escalaDaLetra.test.ts`
**Pronto quando:** o teste varre `src/**/*.tsx`, falha se achar `text-[Npx]` com
N ≤ 14, e passa hoje.

Risco 2 da spec: daqui a três specs alguém escreve `text-[10px]` e aquela tela
para de obedecer à preferência **em silêncio**. É a mesma ideia do teste que
impede a `/passos` de prometer banco que o leitor não lê.

⚠ **A mensagem de falha tem de ensinar a saída**, não só apontar o erro: dizer
qual token usar no lugar. Um teste que só reprova manda a pessoa procurar a regra
num documento que ela não sabe que existe.

---

## Fase B — a preferência como valor

### B1 · `letra.ts` — e a decisão sobre o esqueleto repetido

**Camada:** BACK
**Arquivos:** `src/features/aparencia/letra/letra.ts` + `letra.test.ts`
**Pronto quando:** `TAMANHOS`, `TAMANHO_PADRAO`, `COOKIE_DA_LETRA`,
`letraEscolhida()` e `ROTULOS_DO_TAMANHO` existem e têm teste.

⚠ **Aqui se resolve a pendência 6 da spec.** `tema.ts` e `letra.ts` vão ter o
mesmo esqueleto: lista de valores, padrão, nome do cookie, validade, função que
limpa o que veio do cookie, rótulos. **A regra deste projeto é que o que se
escreve duas vezes ganha arquivo** — foi ela que criou `chaveDaRegra.ts`,
`lib/mes.ts`, `contraste.ts` e `mediaDoComparativo`.

Mas a regra tem um limite, e ele importa aqui: o que se repete é a **forma**, não
a **decisão**. Um `preferenciaDoAparelho({ cookie, valores, padrao })` genérico
economizaria umas quinze linhas e custaria a coisa que dá valor ao `tema.ts` — os
comentários que explicam _por que_ o padrão é escuro, _por que_ o cookie dura um
ano, _por que_ valor desconhecido não vira log. Num módulo genérico esses
parágrafos não têm onde morar.

**Decisão a tomar com os dois arquivos abertos lado a lado, na etapa Plan.** O
que já sei que quero compartilhar de qualquer jeito é `VALIDADE_DO_COOKIE_SEG`:
é literalmente o mesmo número **pelo mesmo motivo**, e isso é decisão repetida,
não forma repetida.

### B2 · `letraAtual.ts`

**Camada:** BACK
**Arquivos:** `src/features/aparencia/letra/letraAtual.ts`
**Pronto quando:** lê o cookie por `cookies()`, passa por `letraEscolhida` e tem
`import "server-only"`.

Dois lugares perguntam — a raiz, que carimba o atributo, e a `/configuracoes`,
que marca a opção. Exatamente o motivo pelo qual `temaAtual.ts` existe.

---

## Fase C — a escala liga

### C1 · Os dois blocos de tamanho no CSS

**Camada:** INFRA
**Arquivos:** `src/app/globals.css`
**Pronto quando:** `:root[data-letra="grande"]` e `:root[data-letra="maior"]`
redefinem os cinco tokens, e `data-letra="padrao"` não redefine nada.

⚠ **Sem `@media` nenhum, e sem terceiro bloco.** Diferente do tema, aqui não
existe "seguir o sistema": o navegador não expõe preferência de tamanho de fonte
por CSS de um jeito que dê para ler com `prefers-*`. O padrão é um dos três
degraus, não um adiamento.

⚠ **`--text-fixo` não aparece em nenhum dos dois blocos.** É a exceção inteira,
e ela funciona por omissão — o que é frágil o bastante para merecer comentário no
arquivo.

### C2 · O `<html>` carimba `data-letra`

**Camada:** FRONT-INTEGRADO
**Arquivos:** `src/app/layout.tsx`
**Pronto quando:** `data-letra` sai do servidor junto de `data-tema`, e recarregar
com o cookie gravado **não pisca**.

É a descoberta 5 da spec 08 pela segunda vez, e desta vez ela custa uma linha:
`temaAtual()` e `letraAtual()` no mesmo `await`.

⚠ **Nada a fazer em `generateMetadata` / `generateViewport`.** Tamanho de letra
não muda a moldura que o sistema desenha — foi cor que mudava.

---

## Fase D — a tela

### D1 · `escolherLetra.action.ts`

**Camada:** BACK
**Arquivos:** `src/features/aparencia/escolher-letra/escolherLetra.action.ts`
**Pronto quando:** grava o cookie, com um ano de validade, e **passa o argumento
por `letraEscolhida` mesmo ele sendo tipado**.

⚠ Esse último ponto é a armadilha que o `escolherTema` já documenta: **tipo é
garantia de compilação, e uma action é um endpoint HTTP**. Sem a limpeza,
`escolherLetra("<script>")` grava a string no cookie — e ela volta carimbada num
atributo do `<html>` na requisição seguinte.

### D2 · `SeletorDeLetra.tsx`

**Camada:** FRONT-INTEGRADO
**Arquivos:** `src/features/aparencia/escolher-letra/SeletorDeLetra.tsx`
**Pronto quando:** três opções em `radiogroup`, a atual marcada, e **a tela cresce
no toque** — antes da action, não depois.

A ordem importa pelo mesmo motivo do tema: esperar a ida ao servidor para mudar
de tamanho faria a tela demorar meio segundo para responder a um toque cujo
efeito é a tela inteira. É o tipo de atraso que faz a pessoa tocar de novo.

⚠ **A escrita no `document` vai num `useEffect` preso ao estado**, e não dentro
do `onClick`. O lint do React 19 recusa a segunda forma, com razão — foi assim
que o `SeletorDeTema` acabou.

⚠ **Sem mensagem de erro**, como no tema: a mudança já se vê, e um aviso vermelho
embaixo de uma tela que visivelmente funcionou confunde mais do que informa.

### D3 · A segunda seção da `/configuracoes`

**Camada:** FRONT-INTEGRADO
**Arquivos:** `src/features/aparencia/escolher-tema/TelaDeConfiguracoes.tsx`,
`src/app/(app)/configuracoes/page.tsx`
**Pronto quando:** a tela mostra Aparência e Tamanho da letra, cada uma com a
opção atual marcada.

⚠ **O comentário do topo do `TelaDeConfiguracoes` fica falso nesta tarefa.** Ele
diz _"Uma tela com uma seção, e ela é honesta"_ e explica que ela é tela, e não
menuzinho, porque é aqui que a próxima preferência vai cair. **A próxima
preferência caiu.** Reescrever o parágrafo faz parte da tarefa — comentário que
descreve um app que não existe mais é pior do que comentário nenhum.

⚠ **A tela fica em `escolher-tema/`, que passa a ser o nome errado da pasta.**
Decisão: **não renomear agora**. Mover a tela para uma pasta neutra
(`aparencia/configuracoes/`) é um diff de import em quatro arquivos que se
mistura ao diff que interessa. Fica anotado como pendência.

---

## Fase E — o que aperta em "Maior"

### E1 · Conferir as linhas de dois lados a 360px

**Camada:** FRONT-VISUAL
**Arquivos:** a decidir — depende do que apertar
**Pronto quando:** as sete telas foram abertas em "Maior" a 360px e nada está
ilegível, cortado ou sobreposto.

Risco 3 da spec, e é o único lugar onde não dá para prever pelo código:

- **`SecaoDoComparativo`** — rótulo `w-14`, barra flexível, valor `w-20` na mesma
  linha. Suspeito número um. A barra é a parte que deve ceder.
- **`CartaoDoPote`** — resolvido pela A3, mas confirmar.
- **`FaixaDoVeredito`, `ProgressoDaRevisao`, `LinhaDeEnvio`** — os outros lugares
  com largura fixa e texto ao lado.

⚠ **Esta tarefa pode não ter arquivo nenhum**, e isso é um resultado válido. Ela
existe para olhar, não para mexer: mexer sem apertar seria consertar o que não
quebrou.

---

## Pendências desta spec

1. **A pasta `escolher-tema/` vira o nome errado na D3.** Renomear para algo
   neutro quando houver outro motivo para tocar naqueles arquivos.
2. **Clerk não escala** (`/entrar`, `/cadastrar`). Fora de escopo declarado na
   spec; se incomodar, é `fontSize` no objeto de aparência e uma medição própria.
3. **A preferência é do aparelho, não da conta** — herdada da pendência 1 da spec
   08, e a ser revista junto com ela, não antes.
