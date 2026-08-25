# Tarefas — Tema claro e tela de configurações

**Etapa:** 2 (Break) do workflow `dev-workflow-davi`
**Spec de origem:** `specs/08-tema-claro.md` (pendências decididas)
**Status:** ✅ **concluída.** Todas as fases entregues; a B4 aprovada pelo Davi.

Legenda de camada: `INFRA` · `FRONT-VISUAL` · `FRONT-INTEGRADO` · `BACK` · `BANCO`

---

## O risco aqui não é errar conta — é a tela sumir em pedaços

Nas specs anteriores o erro se via: um número torto, uma frase estranha, um
lançamento no mês errado. Aqui o erro é **invisível para quem está no escuro**.

O tema escuro continua sendo o padrão. Uma cor esquecida no claro não quebra
nada, não aparece em teste, não aparece no painel do Davi — ela fica lá, um
texto verde-neon num fundo branco, esperando a segunda pessoa abrir o app.

Por isso a fase B termina com **uma varredura tela por tela**, e não com "abriu".

## Nenhuma migration, e quase nenhum servidor

A preferência é cookie (pendência 1) e a cor do pote é derivada (pendência 4).
O banco não é tocado. O servidor entra só por dois motivos, os dois medidos:

- **ler o cookie antes da primeira pintura** — descoberta 5;
- **escolher o objeto de aparência do Clerk** — descoberta 4, a única fronteira
  do projeto onde variável CSS não passa.

## Reuso antes de criação

Já existe e **não** deve ser reescrito:

| O que | Onde | Para quê aqui |
|---|---|---|
| Os doze tokens de base | `app/globals.css`, A2 da spec 01 | O tema claro é **redefinir** essas variáveis, não criar outras |
| `APARENCIA_CLERK` | `autenticacao/aparencia-clerk.ts` | Vira duas, com o mesmo comentário de por quê é hex literal |
| `ROTAS_INTERNAS` | `shell/rotas.ts` | ⚠ `/configuracoes` **não** entra ali — pendência 5 |
| O `← Painel` da `/categorias` | `categorias/gerir-categorias/TelaDeCategorias.tsx` | O mesmo padrão de volta, pela mesma razão (B2 da spec 07) |
| `Card`, `SectionTitle`, `Button` | `components/ui/` | A tela de configurações inteira |
| `CabecalhoApp` | `shell/CabecalhoApp.tsx` | Onde a engrenagem entra |

⚠ **`--color-pote-*` não some.** As nove variáveis de pote continuam em
`globals.css` como documentação da identidade; quem pinta a barra continua sendo
o hex do banco (descoberta 3). Confundir as duas coisas faria a tela e o banco
divergirem em silêncio.

---

## Fase A — As decisões puras (sem tela, sem cookie)

### A1 ✅ · A régua de contraste
**Camada:** BACK (puro)
**Arquivo:** `features/aparencia/tema/contraste.ts` + teste
**Pronto quando:** dadas duas cores em hex, devolve a razão de contraste.

É a fórmula do WCAG, e existe como arquivo por um motivo só: **a A3 precisa ser
verificada por algo que não seja o olho.** Sem régua, "escureci o verde o
bastante" é opinião.

⚠ **O teste fixa valores conhecidos** — preto contra branco dá 21, uma cor
contra ela mesma dá 1 — antes de qualquer coisa do projeto passar por ela. Uma
régua torta aprovaria a paleta errada com números convincentes.

### A2 ✅ · A preferência de tema, como valor
**Camada:** BACK (puro)
**Arquivo:** `features/aparencia/tema/tema.ts` + teste
**Pronto quando:** dado o conteúdo do cookie (ou a ausência dele), devolve
`"escuro"`, `"claro"` ou `"sistema"`.

Três leitores vão precisar da mesma resposta — a moldura que pinta o `<html>`, a
tela de configurações que marca a opção escolhida e a action que grava. **Escrita
três vezes, ela diverge**; é a mesma regra que criou `chaveDaRegra.ts` e
`lib/mes.ts`.

⚠ **Cookie é texto que o usuário controla.** `tema=roxo` tem de cair no padrão
sem exceção e sem log de erro — não é ataque nem defeito, é um valor velho de
uma versão anterior.

⚠ **O padrão é `"escuro"`** (pendência 3), e ele mora **aqui**, numa constante
nomeada — não repetido em cada `??` espalhado pela árvore.

### A3 ✅ · A cor do pote num fundo claro
**Camada:** BACK (puro)
**Arquivo:** `features/aparencia/tema/corNoTema.ts` + teste
**Pronto quando:** dado o hex do banco, devolve a cor a usar no tema claro —
mesmo tom, escura o bastante para a barra existir.

**Pronto quando, de verdade:** o teste roda as **nove cores de
`potes-padrao.ts`** pela função e afirma, com a régua da A1, que todas passam de
3 contra a superfície clara. Hoje `#00e5a0` dá **1.54** e a barra some.

⚠ **Preservar o tom é a metade difícil.** Escurecer até passar é fácil — um
cinza-escuro passa. O que não pode acontecer é o pote Transporte e o pote
Liberdade Financeira, que hoje são ciano e verde, chegarem no claro como duas
cores que ninguém distingue: a cor **é** a identidade do pote em três telas.

⚠ **No tema escuro a função devolve o hex intocado.** A cor do banco continua
sendo a verdade; o claro é a exceção.

✅ **Medido, os nove potes.** Quatro já passavam e voltaram intactos:

| Pote | Hoje | No claro | Contraste |
|---|---|---|---|
| 🏠 Custos Fixos | `#FF5000` | — | 3.28 |
| 📈 Liberdade Financeira | `#00e5a0` | `#00a876` | 1.65 → **3.06** |
| 🎮 Conforto & Lazer | `#3d8eff` | — | 3.23 |
| ★ Metas / Sonhos | `#ffc94d` | `#c28700` | 1.53 → **3.11** |
| 🚗 Transporte | `#00c8d4` | `#00a4ad` | 2.06 → **3.04** |
| 📚 Conhecimento | `#e040a0` | — | 3.88 |
| 🔧 Manutenção | `#26c9a0` | `#20a785` | 2.11 → **3.03** |
| · Outros / Repasses | `#5a5a70` | — | 6.71 |
| 💰 Renda | `#a78bfa` | `#9f80fa` | 2.72 → **3.02** |

Transporte e Liberdade Financeira, os dois mais próximos, continuam a 23° um do
outro depois de escurecidos — e há teste afirmando isso.

---

## Fase B — A tela, e todas as outras

### B1 ✅ · A paleta clara em CSS
**Camada:** FRONT-VISUAL
**Arquivo:** `app/globals.css`
**Pronto quando:** com `data-tema="claro"` no `<html>` a tela inteira muda, e
sem o atributo nada muda.

O mecanismo é redefinir as mesmas variáveis do `@theme` dentro de um seletor. Os
utilitários do Tailwind 4 compilam para `var(--color-*)`, então a cascata os
alcança.

✅ **Conferido no CSS gerado, antes de escrever a paleta inteira.**
`.bg-bg` compila para `background-color: var(--color-bg)`, e `bg-green/8` para
um `color-mix` sobre `var(--color-green)` — os dois seguem a cascata. **Os
utilitários de opacidade se curam sozinhos**, e a varredura da B4 é menor do que
esta spec temia: 8% de um verde escuro sobre branco é exatamente o lavado que um
tema claro quer.

⚠ **`light-dark()` foi medida e recusada**, e não por não funcionar — o motivo
está no comentário do `globals.css`. Em resumo: com ela um token de cor deixa de
valer uma cor.

⚠ **`@media (prefers-color-scheme: light)` só vale quando o atributo diz
`sistema`** — senão a escolha explícita de quem pediu escuro num celular claro
seria atropelada pelo próprio celular.

⚠ **As cores semânticas são reescolhidas, não invertidas** (descoberta 2), e
cada uma entra com o número da régua da A1 ao lado, em comentário. Um hex sem
justificativa neste arquivo é uma cor que ninguém vai saber ajustar depois.

### B2 ✅ · A tela `/configuracoes`
**Camada:** FRONT-VISUAL
**Arquivos:** `app/(app)/configuracoes/page.tsx`,
`features/aparencia/escolher-tema/TelaDeConfiguracoes.tsx`
**Pronto quando:** as três opções aparecem, a escolhida está marcada, e o
"← Painel" está no topo.

⚠ **Três opções visíveis, não um interruptor.** Um botão de dois estados não tem
onde pôr "seguir o sistema", e é a opção que a maioria quer.

⚠ **"Seguir o sistema" precisa dizer o que o sistema está pedindo agora**, senão
é uma opção que não dá retorno nenhum ao ser tocada — quem está num celular
escuro escolhe "sistema" e não vê nada acontecer.

### B3 ✅ · A engrenagem no cabeçalho
**Camada:** FRONT-VISUAL
**Arquivo:** `shell/CabecalhoApp.tsx`
**Pronto quando:** existe um caminho até `/configuracoes` em qualquer tela
interna, com alvo de toque de 44px, sem gastar item da barra de navegação.

### B4 ✅ · A varredura
**Camada:** FRONT-VISUAL
**Pronto quando:** as **oito telas** foram abertas no claro e conferidas:
`/entrar`, `/cadastrar`, `/bem-vindo`, `/dashboard`, `/upload`, `/revisao`,
`/regras`, `/categorias`.

É a tarefa que o "risco" no topo deste documento descreve. O alvo específico:

- os ~20 usos de `bg-verde/8`, `bg-gold/8`, `border-red/20` e afins — **cor
  translúcida sobre preto é tinta; sobre branco é quase nada**;
- `bg-bg/40` e `bg-bg/60`, que são véus escuros usados para afundar um bloco;
- o `bg-bg/92` com `backdrop-blur` do cabeçalho;
- a barra de rolagem fina de `globals.css`, que é desenhada em `--color-border2`.

✅ **A metade que dá para fazer sem olhos já foi.** Varrido o `src` inteiro:
nenhuma sombra, nenhum gradiente, nenhum `mix-blend`, nenhuma cor da paleta do
Tailwind, nenhum `white`/`black` literal. As três opacidades fixas que existem
(`opacity-40` do botão desabilitado, `opacity-60` do campo de arquivo, o 0.3 do
mês mal classificado) não dependem do fundo.

✅ **A outra metade era dele, e ele aprovou.** Nenhuma análise estática diria
se a tela está boa — só o olho de quem vai ler o painel todo mês.

> ⛔ **Portão de aprovação do Davi.** Não seguir para a fase C sem o "ok" visual.
> Esta spec inteira é gosto: se a paleta não agradar, o resto não importa.

---

## Fase C — O servidor

### C1 ✅ · O cookie: ler antes de pintar, gravar ao escolher
**Camada:** BACK
**Arquivos:** `features/aparencia/escolher-tema/escolherTema.action.ts`,
`app/layout.tsx`
**Pronto quando:** a escolha sobrevive a recarregar a página **sem piscar**.

⚠ **Ler o cookie na raiz e não na moldura de `(app)`.** `/entrar`, `/cadastrar`
e `/bem-vindo` estão fora de `(app)` e precisam do tema igual — é justamente a
primeira tela que alguém vê.

⚠ **O cookie não é sessão.** Sem `httpOnly` (nada secreto nele), com validade
longa, e `SameSite=Lax`. Um tema que expira junto com o login é um tema que se
perde toda vez.

---

## Fase D — Integração

### D1 ✅ · O Clerk nos dois temas
**Camada:** FRONT-INTEGRADO
**Arquivo:** `features/autenticacao/aparencia-clerk.ts`
**Pronto quando:** o `<UserButton />` e as telas de acesso acompanham o tema.

⚠ **Continua hex literal, e o comentário de por quê continua lá.** É a
descoberta 4, e ela não mudou: o Clerk faz cálculo de cor e `var(...)` sai
transparente. O que muda é que agora são dois objetos, e o motivo da duplicação
precisa ficar ainda mais explícito — porque agora ela dobrou.

### D2 ✅ · A cor do pote ligada
**Camada:** FRONT-INTEGRADO
**Arquivos:** `painel/painel-do-mes/CartaoDoPote.tsx`,
`painel/comparar-meses/SecaoDoComparativo.tsx`
**Pronto quando:** as barras dos potes aparecem no claro.

A A3 já decide; aqui é só entregar o tema até o ponto onde o `style` é montado.

### D3 ✅ · A moldura do sistema
**Camada:** FRONT-INTEGRADO
**Arquivo:** `app/layout.tsx`
**Pronto quando:** instalado no celular, a barra de status combina com o tema.

⚠ **`statusBarStyle: "black-translucent"` fica errada no claro.** Ela desenha o
relógio em **branco** — invisível sobre uma tela clara. É o mesmo raciocínio da
spec 07 ao contrário, e o valor tem de sair do cookie junto com o resto.

⚠ **`themeColor` também.** Hoje é `#060608` fixo; no claro emoldura o app com uma
faixa preta.

---

## Fase E — Deploy

### E1 ✅ · Publicar e olhar no claro, no celular
**Camada:** INFRA
**Pronto quando:** deploy por `npx vercel deploy --prod --yes`, e o Davi abre no
claro e diz se presta.

✅ **Publicado.** Conferido em produção, antes de avisar: o `data-tema` sai do
servidor certo nos quatro casos (sem cookie, `claro`, `sistema` e um valor
inválido), e o `theme-color` e o estilo da barra de status acompanham.

⚠ **É revisão de gosto, como o ícone da spec 07.** Não há o que conferir contra
o extrato: ou a tela agrada ou não agrada, e só ele decide.

---

## Resumo

| Fase | Tarefas | Depende de |
|---|---|---|
| A — As decisões puras ✅ | A1–A3 | nada |
| B — A tela e a varredura ✅ | B1–B4 | A1 (a régua julga a paleta) |
| C — O servidor ✅ | C1 | — |
| D — Integração ✅ | D1–D3 | C |
| E — Deploy ✅ | E1 | D |

⚠ **A C1 passou na frente da B4, e o motivo é o mesmo da fase B da spec 06.**
O portão desta spec é o Davi olhando a paleta — e um seletor de tema de mentira
não dá para julgar. Ele precisava tocar e ver a tela virar. Um protótipo aqui
seria pior do que a coisa real, e a coisa real custou trinta linhas.

A Etapa 3 (Plan) é feita **tarefa por tarefa**, não tudo de uma vez.
