# Spec — Tema claro e tela de configurações

**Etapa:** 1 (Spec) do workflow `dev-workflow-davi`
**Depende de:** nada em execução. Herda a A2 da spec 01 (os design tokens), e é
ela que torna esta spec possível
**Pedido do Davi:** *"uma versão do front end de visão clara caso o usuário não
goste de dark mode, deve ter essa opção num menu de configurações"*
**Status:** pendências decididas por mim — ver o fim do documento

> ⚠ Nenhum dado real neste documento.

## O que esta funcionalidade resolve

O app é escuro porque `planejamento_anual_davi.html` era escuro, e ninguém
nunca perguntou. Era uma tela só, de uma pessoa só.

Hoje não é: o acesso é por convite e a segunda pessoa já bateu na porta. Tema é
a única decisão de produto que **não tem resposta certa** — não dá para medir,
não dá para deduzir do extrato, e quem lê é quem sabe. Um app financeiro aberto
no ônibus às sete da manhã e um aberto na cama à meia-noite não querem a mesma
tela.

**O que esta spec entrega não é uma paleta. É a escolha.**

## O que eu medi antes de desenhar

### Descoberta 1 — a tela inteira já fala por token, e isso muda o tamanho da spec

Contado no código, hoje:

| Token | Usos |
|---|---|
| `text-dim` | 96 |
| `text-text` | 55 |
| `border-border2` | 31 |
| `bg-card` | 28 |
| `text-dim2` | 27 |
| `bg-card2` | 18 |
| `border-border` | 18 |
| `bg-bg` | 15 |
| `text-primary` | 7 |
| `bg-surface` | 1 |

**296 usos em 51 componentes, e zero cor literal dentro de componente.** A A2 da
spec 01 escreveu a regra *"não introduzir cor fora desta lista"* e ela foi
obedecida por sete specs seguidas.

Isso quer dizer que o tema claro é **redefinir doze variáveis**, não editar 51
arquivos. A parte cara desta spec não é pintar a tela.

### Descoberta 2 — a parte cara: as cores foram escolhidas para brilhar no preto

É o achado que dá trabalho à spec. Contraste de cada cor semântica contra o
fundo de hoje e contra um fundo claro:

| Token | Hex | Sobre `#060608` | Sobre branco |
|---|---|---|---|
| `--color-gold` | `#ffc94d` | **13.22** | **1.53** |
| `--color-green` | `#00e5a0` | **12.26** | **1.65** |
| `--color-cyan` | `#00c8d4` | 9.85 | 2.06 |
| `--color-orange` | `#ff9a3c` | 9.58 | 2.11 |
| `--color-purple` | `#a78bfa` | 7.44 | 2.72 |
| `--color-blue` | `#3d8eff` | 6.28 | 3.23 |
| `--color-red` | `#ff4f4f` | 6.25 | 3.24 |
| `--color-primary` | `#ff5000` | 6.17 | 3.28 |

O mínimo legível para texto é **4.5**. Nenhuma passa no claro, e as duas piores
são justamente as que carregam significado:

- o **verde** é "entrou", "dentro da meta", "sobrou";
- o **dourado** é "meta" e é o aviso de cobertura baixa — a frase do degrau 1 do
  veredito, a mais importante da tela.

Um tema claro que apenas inverta fundo e texto produz um app onde **o sinal
some e o ruído fica**. Por isso o claro não é a mesma paleta ao contrário: as
cores semânticas são **escolhidas de novo**, no mesmo tom, escuras o bastante.

Os cinzas, ao contrário, espelham bem: `--color-dim` (`#5a5a70`) dá 3.02 no
escuro e **6.71** no claro. Cinza é cinza.

### Descoberta 3 — a cor do pote não está no CSS, está no banco

`buckets.cor` é `text` na tabela, gravada uma vez pelo seed do onboarding, e
**nunca atualizada**: não existe um `update(buckets)` em lugar nenhum do
projeto. Ela chega até a tela como `style={{ backgroundColor: cor }}` — a barra
do `CartaoDoPote`, a barra do `SecaoDoComparativo`, a faixa do topo do cartão.

**CSS não alcança isso.** Uma variável redefinida em `:root` não muda um valor
que veio do Postgres.

E o problema é o mesmo da descoberta 2 com uma régua diferente: uma barra
preenchida não precisa de 4.5, precisa de **3** contra o que está em volta —
mas `#00e5a0` contra uma superfície clara dá **1.54**. A barra do pote
Liberdade Financeira simplesmente desapareceria.

Há dois caminhos, e eu escolhi o segundo:

| | Custo |
|---|---|
| Migration com uma segunda coluna de cor | Migration, seed novo, e uma coluna que precisa ser preenchida à mão para todo pote que existir depois |
| **Uma função pura que deriva a cor clara do hex** | Um arquivo, um teste, e funciona para uma cor que ainda não existe |

⚠ **A segunda também é a única que continua certa se a cor do pote virar
editável.** A primeira ficaria pedindo duas cores ao usuário.

### Descoberta 4 — existe exatamente uma fronteira onde variável CSS não passa

`aparencia-clerk.ts` já registra, medido em navegador de verdade e não suposto:
o Clerk **faz cálculo de cor** em cima dos valores que recebe, e com
`var(--color-card)` o cálculo não resolve — as cores saem transparentes e o
widget perde a identidade inteira. Por isso aquele arquivo é hex literal, e é a
única duplicação de token que o projeto aceita.

Consequência direta para esta spec: **o tema não pode ser só um atributo no
`<html>`.** O `<UserButton />` do cabeçalho e as telas de `/entrar` e
`/cadastrar` precisam de um *objeto* escolhido em JavaScript no momento de
renderizar. O tema tem de existir como **valor**, e não só como CSS.

É a razão de esta spec ter servidor. Sem o Clerk, ela seria CSS e um botão.

### Descoberta 5 — o tema tem de ser conhecido antes da primeira pintura

Ler a preferência no cliente, depois de montar, custa uma **piscada escura em
toda abertura** para quem escolheu claro. Num app que se abre uma vez por mês,
essa piscada é a primeira coisa que a pessoa vê — e é pior que não ter tema
claro, porque parece defeito.

O jeito de não piscar é o servidor já mandar o HTML com o tema decidido. E isso
aqui é **de graça**: a moldura de `(app)` já é `force-dynamic` desde a spec 01,
por causa do mês no cabeçalho. Um cookie lido ali não custa render nenhum.

---

## O desenho

### Três estados, e o terceiro não gasta JavaScript

| Escolha | O que faz |
|---|---|
| **Escuro** | o app de hoje |
| **Claro** | a paleta nova |
| **Seguir o sistema** | o que o celular já decidiu |

O terceiro é resolvido em CSS puro, por `@media (prefers-color-scheme: light)`.
Sem script, sem hidratação, sem piscada — o navegador já sabe a resposta antes
de baixar qualquer JavaScript.

### A preferência é do aparelho, e vai num cookie

Não numa coluna de `users`. Um tema é propriedade **de onde se lê**, não de quem
lê: a mesma pessoa quer escuro no celular à noite e claro no monitor ao meio-dia,
e uma coluna no banco a obrigaria a escolher um dos dois para sempre.

De quebra: nenhuma migration, e `/entrar` — onde ainda não existe usuário para
ter coluna — funciona igual.

### O padrão continua escuro, e isso é decisão

O natural pareceria ser "seguir o sistema". Mas hoje **todo mundo está no
escuro**, e a maioria dos celulares está configurada em claro: subir com
`sistema` como padrão viraria o app do Davi para branco no primeiro deploy, sem
ele ter pedido nada.

**Mudança de aparência que ninguém pediu se lê como defeito.** Quem quiser o
sistema escolhe o sistema.

### A paleta clara não é a escura invertida

Duas regras, e as duas são medíveis:

- **fundo e cinzas espelham** — o claro é uma superfície quase branca com
  hierarquia por cinza, do mesmo jeito que o escuro é quase preto com hierarquia
  por cinza;
- **cor semântica é reescolhida no mesmo tom**, e só entra se passar de 4.5
  contra a superfície clara (texto) ou de 3 (preenchimento).

⚠ **O laranja da marca é o caso limite**: `#ff5000` dá 3.28 no claro. Ele
continua servindo de **fundo** de botão e de faixa, e ganha um tom mais escuro
para quando for **texto** — que é o rótulo "6 POTES" do cabeçalho e pouca coisa
mais.

### A cor do pote é derivada, não cadastrada

Uma função pura recebe o hex do banco e devolve a versão para fundo claro:
mesmo tom, escura o bastante para a barra aparecer. A régua é a mesma fórmula
de contraste da descoberta 2, escrita como código e testada — não um olhômetro.

### A tela de configurações

Rota nova `/configuracoes`, **fora da barra de navegação**. São 4 itens desde a
D9 da spec 03 e a 360px isso já é 90px por item; um quinto derruba o alvo de
toque abaixo dos 44px, e a decisão do Davi na spec 05 (pendência 3) continua
valendo.

Chega-se a ela pelo cabeçalho — a engrenagem ao lado do avatar — e ela tem um
**"← Painel" visível no topo**, que é a lição da B2 da spec 07: instalado no
celular não existe botão de voltar, e o gesto de borda funciona sem aparecer.

Hoje ela tem uma seção. É a tela que passa a receber a próxima preferência que
existir, e é por isso que ela é uma tela e não um menuzinho suspenso.

## O que fica de fora, e por quê

| Fora | Por quê |
|---|---|
| **Escolher a cor de cada pote** | É outra funcionalidade, com outra tela e uma migration. Esta spec deriva a cor clara justamente para não abrir esse assunto agora. |
| **Trocar sozinho por horário** | "Seguir o sistema" já faz isso, melhor: o celular sabe o pôr do sol e sabe se a pessoa desligou o automático. |
| **Guardar a preferência na conta** | Decisão acima. Um cookie por aparelho é mais certo, não só mais barato. |
| **Tema de alto contraste / daltonismo** | Merece medição própria — o app inteiro codifica estado por cor, e resolver isso é rever significado, não paleta. Fica registrado como assunto. |
| **Transição animada na troca** | Trezentos elementos mudando de cor com `transition` é meio segundo de tela suja. A troca é instantânea de propósito. |

## Riscos

**O julgamento é estético e é dele.** Nenhuma parte disto "funciona ou não
funciona". A fase visual existe inteira por causa desse risco, e o portão de
aprovação é onde ele se resolve.

**Uma cor esquecida só aparece no claro.** O tema escuro continua sendo o
padrão, então uma regressão no claro pode passar despercebida por semanas. É por
isso que a verificação da fase B é **as telas todas no claro**, uma por uma, e
não "o painel abriu".

**O Clerk é a fronteira frágil.** Ele já obrigou a duplicar treze cores uma vez;
agora são treze vezes dois. Se o Core 3 mudar nome de variável de novo, quebra
nos dois temas ao mesmo tempo.

**O cookie some.** Navegador anônimo, dados limpos, aparelho novo — a
preferência volta para escuro sem aviso. É aceitável: o custo é reescolher, e a
alternativa era uma migration.

## Pendências — decididas

⚠ **O Davi disse "comece a desenvolver", não respondeu a nenhuma pergunta.** As
decisões abaixo são minhas e qualquer uma pode ser derrubada no portão visual.

**1. Onde mora a preferência?** ➡️ **Cookie, por aparelho.** Sem migration, sem
piscada, e é o comportamento certo para tema.

**2. Duas opções ou três?** ➡️ **Três**, com "seguir o sistema". Ela sai de graça
em CSS e é a que a maioria das pessoas espera.

**3. Qual o padrão?** ➡️ **Escuro.** Trocar a aparência de quem já usa, sem
pedir, se lê como defeito.

**4. A cor do pote, migration ou função?** ➡️ **Função pura**, descoberta 3.

**5. `/configuracoes` entra na barra de navegação?** ➡️ **Não.** Um quinto item
a 360px derruba o alvo de toque. Entra pelo cabeçalho, e ganha o "← Painel".

**6. O que mais vai na tela de configurações?** ➡️ **Só a aparência, agora.** Uma
tela de configurações com uma seção é honesta; inventar seções para preenchê-la
é como o painel dizer "0%" num pote sem meta.
