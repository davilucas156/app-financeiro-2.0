# Spec — Tamanho da letra

**Etapa:** 1 (Spec) do workflow `dev-workflow-davi`
**Depende de:** spec 08, que criou a `/configuracoes`, o cookie de preferência
do aparelho e o `data-*` carimbado no `<html>` pelo servidor. Esta spec é a
segunda preferência caindo naquela tela — o motivo pelo qual ela virou tela e
não menuzinho suspenso
**Pedido do Davi:** _"quero que no menu tenha uma configuração também para
selecionar o tamanho das letras do aplicativo como um todo, com exceção das
letras dos cards de pote que já são grandes"_
**Status:** pendências decididas por mim — ver o fim do documento

> ⚠ Nenhum dado real neste documento.

## O que esta funcionalidade resolve

O app foi desenhado num tamanho só, e esse tamanho veio do
`planejamento_anual_davi.html` — uma tela feita por uma pessoa, para a vista
dela, num monitor. Hoje ela é lida no celular, por mais de uma pessoa, e o
menor texto do app tem **9px**.

Não há como medir quem consegue ler 9px. Como o tema, é uma decisão que **não
tem resposta certa** e que só quem lê pode tomar.

## O que eu medi antes de desenhar

### Descoberta 1 — metade do texto do app não obedeceria a configuração nenhuma

Todo tamanho de letra usado hoje, contado no código:

| Escala do Tailwind | Usos |     | px cravado    | Usos |
| ------------------ | ---- | --- | ------------- | ---- |
| `text-xs` (12px)   | 87   |     | `text-[11px]` | 37   |
| `text-sm` (14px)   | 42   |     | `text-[10px]` | 33   |
| `text-lg` (18px)   | 3    |     | `text-[9px]`  | 27   |
| `text-base` (16px) | 3    |     | `text-[28px]` | 2    |
| `text-xl` (20px)   | 1    |     | `text-[22px]` | 1    |
| `text-2xl` (24px)  | 1    |     | `text-[7px]`  | 1    |
| `text-3xl` (30px)  | 1    |     |               |      |
| **Total**          | 138  |     | **Total**     | 101  |

**101 usos em px cravado, espalhados por 39 arquivos** — e 97 deles são
justamente 9, 10 e 11px, o texto miúdo que a configuração existe para resolver.

Isso mata a solução óbvia antes de ela ser escrita. `text-[10px]` compila para
`font-size:10px`, um número absoluto: nenhuma variável de CSS, nenhum `rem`,
nada por onde uma preferência entre. Uma configuração de tamanho ligada hoje
aumentaria os títulos e **deixaria a letra pequena exatamente do tamanho que
está**.

É o inverso da descoberta 1 da spec 08. Lá, sete specs de disciplina com cor
fizeram o tema claro custar doze variáveis. Aqui, a mesma disciplina nunca
existiu para tamanho — e a parte cara desta spec é criar o vocabulário que
deveria estar lá desde o começo.

### Descoberta 2 — o `html { font-size }` escalaria o app inteiro, não as letras

O jeito clássico de escalar tipografia é mexer no tamanho da raiz e deixar o
`rem` propagar. Conferido no CSS gerado, ele propagaria longe demais:

```css
--spacing: 0.25rem;
.p-4 {
  padding: calc(var(--spacing) * 4);
}
.gap-3 {
  gap: calc(var(--spacing) * 3);
}
.min-h-11 {
  min-height: calc(var(--spacing) * 11);
}
```

**Todo espaçamento do Tailwind 4 é `rem`.** Mexer na raiz mexeria em cada
`padding`, `gap` e altura mínima do app junto — a 360px, o miolo do cartão
encolhe enquanto a margem cresce. Isso é **zoom**, e zoom o celular já faz
melhor do que nós. O Davi pediu tamanho de letra.

### Descoberta 3 — o Tailwind 4 já lê o tamanho de uma variável, e a entrelinha vem de graça

O que o `text-xs` vira, no CSS gerado:

```css
.text-xs {
  font-size: var(--text-xs);
  line-height: var(--tw-leading, var(--text-xs--line-height));
}
--text-xs: 0.75rem;
--text-xs--line-height: calc(1 / 0.75); /* 1.333 — razão, sem unidade */
```

Duas coisas boas de uma vez:

1. **O tamanho já é uma variável**, então redefini-la sob um seletor troca o
   tamanho sem tocar em componente — o mesmo mecanismo que a spec 08 provou
   para cor.
2. **A entrelinha é uma razão sem unidade**, então ela acompanha sozinha. Não
   existe uma segunda tabela para manter em dia.

E o `text-[10px]` de hoje compila para `font-size:10px` **e nada de
entrelinha** — ela é herdada, e o preflight do Tailwind não declara nenhuma, ou
seja, é o `normal` do navegador. Isso importa na hora de converter: dar aos
tokens novos a entrelinha `normal` reproduz o comportamento de hoje ao pixel, e
`normal` é proporcional à fonte — cresce junto, de graça.

### Descoberta 4 — a régua que o Davi deu já estava no código

_"com exceção das letras dos cards de pote que já são grandes"_. Olhado o
`CartaoDoPote`, ele tem cinco tamanhos dentro:

| Onde                                     | Hoje                  |
| ---------------------------------------- | --------------------- |
| Nome do pote (`📈 Liberdade Financeira`) | `text-sm` — 14px      |
| Valor do pote (`R$ 0.000,00`)            | `text-sm` mono — 14px |
| Legenda e "meta …"                       | 10px                  |
| Insight, categorias                      | 12px                  |
| Descrição e data do lançamento           | 11px e 10px           |

**"As letras que já são grandes" são duas, e são a linha do cabeçalho.** O resto
do cartão é miúdo como o resto do app.

E aquela linha é a única do painel com orçamento apertado: a 360px ela põe nome
e valor lado a lado, na mesma linha de base, com o valor à direita. É o lugar
onde crescer 40% empurra o nome para a segunda linha.

Ou seja: a exceção do Davi é **uma linha**, não um cartão — e é a linha certa.

## O desenho

### A régua: escala o que é pequeno, fica parado o que já é grande

Uma frase, e ela resolve o escopo inteiro:

> **Letra de até 14px escala. Acima de 14px, não.**

Consequências, todas verificáveis contando o que já existe:

- **Escalam** 9, 10, 11, 12 e 14px — **226 dos 239 usos (95%)**.
- **Não escalam** 16, 18, 20, 24, 30, 22 e 28px — 12 usos, todos título ou
  valor de destaque, **e nenhum arquivo precisa ser tocado por causa deles**.
- O `text-[7px]` que sobra é o pontinho `●` do `Badge`, `aria-hidden`. Não é
  letra; fica onde está.

A régua é a do Davi, escrita em número em vez de em intenção — e por ser um
número ela vale para a tela de amanhã, que ninguém vai lembrar de consultar.

### Os cinco tokens que passam a existir

Os três de baixo não existem hoje; são os 97 px cravados ganhando nome.

| Token        | Utilitário | Padrão | Grande | Maior | O que é hoje                     |
| ------------ | ---------- | ------ | ------ | ----- | -------------------------------- |
| `--text-4xs` | `text-4xs` | 9px    | 11px   | 13px  | rótulo mono maiúsculo de seção   |
| `--text-3xs` | `text-3xs` | 10px   | 12px   | 14px  | legenda, meta, data, procedência |
| `--text-2xs` | `text-2xs` | 11px   | 13px   | 15px  | descrição de lançamento          |
| `--text-xs`  | `text-xs`  | 12px   | 14px   | 17px  | corpo do app (87 usos)           |
| `--text-sm`  | `text-sm`  | 14px   | 16px   | 19px  | nome e valor (42 usos)           |

**Nomes numéricos, e não de papel.** `--text-rotulo` seria mais bonito e estaria
errado no primeiro uso fora de rótulo — o 10px já é legenda, meta, data e
procedência ao mesmo tempo. Numérico, o token continua sendo o que é: um degrau
de uma escada, que ordena junto dos degraus que o Tailwind já tem.

**+22% e +44% no degrau de baixo**, e a escada não achata: hoje ela vai de 9 a 14
(1,56×); em "Maior" vai de 13 a 19 (1,46×). A hierarquia visual do painel
sobrevive aos dois passos.

### A exceção, com nome

```css
--text-fixo: 14px; /* não muda em nenhum dos três tamanhos */
```

As duas letras do cabeçalho do pote passam de `text-sm` para `text-fixo`. O nome
diz o que ele é — _esta letra é fixa_ — e não onde ele mora, para a próxima linha
apertada poder usá-lo sem virar `text-pote` numa tela que não tem pote.

⚠ **A exceção é das duas, não do cartão.** Legenda, meta, insight, categorias e
lançamentos crescem junto com o resto do app. É o que o pedido diz — _"que já são
grandes"_ é oração restritiva — e é o que salva a configuração de parecer
quebrada justamente no painel, que é a tela pela qual a pessoa abriu o app.

### Como a escolha chega até o pixel

Igual ao tema, e de propósito igual:

```
cookie `letra` → servidor lê → <html data-letra="grande"> → :root[data-letra="grande"] redefine os 5 tokens
```

⚠ **Decidido no servidor, e é o que impede a piscada** — descoberta 5 da spec 08,
agora pela segunda vez. Lido no cliente depois de montar, o app abriria no
tamanho padrão e saltaria; num app que se abre uma vez por mês, esse salto é a
primeira coisa que a pessoa vê.

`data-letra` e não um valor a mais em `data-tema`: são preferências
independentes, e juntas num atributo só multiplicariam os blocos de CSS por
nove.

## Página: `/configuracoes`

**Propósito:** o que já era — as preferências deste aparelho —, com uma segunda
seção. A tela foi feita tela, e não menu suspenso, exatamente para esta hora.

### Componentes

| Componente                      | Estado inicial                       | Variações                          |
| ------------------------------- | ------------------------------------ | ---------------------------------- |
| Seção "Aparência"               | como está hoje                       | —                                  |
| Seção "Tamanho da letra" (nova) | rótulo mono + `Card`, como a de cima | —                                  |
| `SeletorDeLetra` (novo)         | `radiogroup` de 3, a atual marcada   | sem estado de erro, sem carregando |

O `SeletorDeLetra` é o `SeletorDeTema` com outra lista: mesmo `radiogroup`, mesma
bolinha, mesma altura de toque de 44px, mesmo comportamento de aplicar antes de
gravar. **Nenhum componente novo de UI** — é reuso de forma, não de código,
porque as duas listas têm rótulos e efeitos diferentes.

⚠ **A amostra é a própria tela.** O seletor não precisa de um "Aa" de exemplo: o
app inteiro troca de tamanho no toque, e a frase acima do seletor está no tamanho
que ele controla. Um exemplo isolado seria um segundo lugar para a verdade morar.

### Comportamentos do usuário

| Ação do usuário                                     | Resposta do sistema                                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Abre `/configuracoes`                               | Vê Aparência e Tamanho da letra, cada uma com a opção atual marcada                                                      |
| Toca em "Grande"                                    | **A tela cresce no ato** — o cliente escreve `data-letra` no `<html>`; a gravação do cookie vem depois, em segundo plano |
| Toca na opção já marcada                            | Nada muda; a action é chamada e regrava o mesmo valor                                                                    |
| Volta ao painel                                     | O painel já está no tamanho novo — é o mesmo `<html>`                                                                    |
| Fecha e reabre o app                                | Abre direto no tamanho escolhido, **sem piscar** no padrão                                                               |
| Abre no computador com o mesmo login                | Tamanho padrão: a preferência é **do aparelho**, como o tema                                                             |
| Chega com `letra=gigante` no cookie (versão antiga) | Cai no padrão, em silêncio, sem log                                                                                      |

### Dados envolvidos

- **Lê:** o cookie `letra` do próprio navegador. Nada do banco, nada da conta.
- **Escreve:** o cookie `letra`, um ano de validade, `path=/`.
- **Não escreve nada no banco.** ⚠ Como a `escolherTema`, esta action **não passa
  por `garantirUsuario()`**, e é a mesma razão: não há `user_id` envolvido, e ela
  precisa funcionar em `/entrar`, onde ainda não há sessão.

## O que fica de fora, e por quê

- **Preferência por conta, sincronizada entre aparelhos.** É a pendência 1 da
  spec 08 outra vez: quem lê no celular na rua e no computador em casa
  provavelmente quer tamanhos diferentes. Cookie é a resposta certa, não a
  barata.
- **Escala contínua (um `slider`).** Três degraus escolhidos e conferidos valem
  mais do que um controle capaz de produzir 13,7px em qualquer lugar.
- **Tamanho menor que o padrão.** O padrão já começa em 9px; um degrau abaixo
  seria o app oferecendo ilegibilidade como opção.
- **As telas do Clerk (`/entrar`, `/cadastrar`).** Elas desenham o próprio DOM e
  não leem nossos tokens — a spec 08 já tinha descoberto isso com cor. Dá para
  passar `fontSize` no objeto de aparência, mas isso é medição própria e não é
  onde o texto miúdo incomoda.
- **`text-lg` para cima.** É a régua acima. Se um dia incomodar, o remédio é
  acrescentar tokens, não mudar o desenho.

## Riscos

1. **Conversão em massa: 97 substituições em 39 arquivos.** É o risco real desta
   spec. Mitigação: as três trocas são literais e sem ambiguidade
   (`text-[11px]`→`text-2xs`, `text-[10px]`→`text-3xs`, `text-[9px]`→`text-4xs`),
   os tokens novos nascem com entrelinha `normal` — que é exatamente o que
   aqueles elementos têm hoje —, e o `next build` e o `tsc` **não pegam erro de
   classe de CSS**. A conferência é visual, tela por tela, no tamanho padrão: se
   algo se mexeu, a conversão errou.

2. **A configuração sumir na próxima tela.** Daqui a três specs, alguém escreve
   `text-[10px]` de novo e aquela tela deixa de obedecer à preferência, em
   silêncio. Mitigação: **um teste que varre os `.tsx` e falha se aparecer
   `text-[Npx]` com N ≤ 14.** Mesma ideia do teste que impede a `/passos` de
   prometer banco que o leitor não lê.

3. **Linha apertada em "Maior" fora do cartão de pote.** O cabeçalho do pote está
   resolvido pela exceção, mas há outras linhas de dois lados a 360px — a
   `SecaoDoComparativo` tem rótulo, barra e valor na mesma linha, com larguras
   fixas (`w-14`, `w-20`). Mitigação: essas larguras precisam ser conferidas em
   "Maior" na execução; a barra é a parte flexível e é ela que deve ceder.

4. **A escada achatar.** Em "Maior", o rótulo de seção (13px) chega perto do
   valor do pote padrão (14px). Medido acima: a razão do topo ao pé cai de 1,56×
   para 1,46×, o que mantém a hierarquia. É o teto — um quarto degrau acabaria
   com ela.

## Pendências — decididas

1. **Três degraus, chamados Padrão, Grande e Maior.** Espelham as três opções de
   tema logo acima na mesma tela, e três é o que cabe num `radiogroup` vertical
   sem rolagem.
2. **A exceção vale para as duas letras do cabeçalho do pote, não para o cartão
   inteiro.** Fundamentado na descoberta 4. É a leitura literal do pedido e é a
   que impede a configuração de parecer quebrada no painel.
3. **A régua é 14px.** Escolhida porque cai exatamente entre o corpo do app
   (12–14) e o primeiro tamanho de destaque (16), e porque assim cobre 95% dos
   usos sem julgar caso a caso.
4. **Sem degrau menor que o padrão.**
5. **Cookie por aparelho, não coluna no banco.** Mesma decisão da spec 08, pelo
   mesmo motivo, e ainda revisível junto com ela.
6. **A ser resolvida na etapa Plan:** `tema.ts` e `letra.ts` vão ter o mesmo
   esqueleto (lista de valores, padrão, nome do cookie, validade, função que
   limpa o que veio, rótulos). Se o esqueleto for idêntico, ele vira um módulo só
   de "preferência do aparelho" — a regra deste projeto é que o que se escreve
   duas vezes ganha arquivo. Só dá para decidir com os dois abertos lado a lado.
