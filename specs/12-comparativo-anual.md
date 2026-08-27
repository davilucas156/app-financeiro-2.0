# Spec — Comparativo anual

**Etapa:** 1 (Spec) do workflow `dev-workflow-davi`
**Depende de:** spec 06, que criou o comparativo; spec 09, que o tirou do
painel e lhe deu tela própria; spec 05, que fez potes e categorias serem
editáveis pelo usuário — a spec que impede metade do desenho óbvio daqui
**Pedido do Davi:** _"deve ter uma aba de comparativo anual assim como existe a
consulta por meses no topo da tela de painel"_, com o escopo confirmado por ele:
**aba + recorte por ano + os 6 cartões de topo**
**Status:** ⚠ **rascunho, não aprovado.** Pendências decididas por mim — ver o
fim do documento.

> ⚠ Nenhum dado real neste documento. Os valores citados do
> `planejamento_anual_davi.html` são **estrutura**, não dado: aparecem para
> mostrar o formato do cartão, e a spec não os reproduz em lugar nenhum.

## O que esta funcionalidade resolve

Três coisas, e as três estavam registradas como dívida:

1. **A `/comparativo` não é alcançável de cima.** Só pela chamada no fim do
   painel. Quem abre o app e quer o comparativo rola a tela inteira primeiro.
2. **A `/comparativo` cresce sem limite.** Ela desenha **todos** os meses da
   conta. Com 2 meses são 27 linhas de barra; em dezembro do segundo ano seriam
   mais de 200. É o mesmo defeito que a spec 09 consertou tirando-a do painel —
   e ele não foi consertado, foi **mudado de lugar**.
3. **Os 6 cartões de topo nunca chegaram.** Adiados na spec 06 (pendência 5) e
   de novo na spec 09 (pendência 3), com a justificativa de que _"seriam outra
   consulta"_. A Descoberta 3 mostra que hoje não são.

---

## O que eu medi antes de desenhar

### Descoberta 1 — o pedido está escrito no painel original, literalmente

A fileira de abas do `planejamento_anual_davi.html` é uma aba por período **e a
última é o comparativo** (linha 411):

```html
<button class="nav-tab" onclick="goTo('jul2026')">…Julho</button>
<button class="nav-tab tab-locked" onclick="showLocked()">…Ago–Dez</button>
<button class="nav-tab" onclick="goTo('comparativo')">
  📊 Comparativo Anual
</button>
```

O `SeletorDeMeses` de `TopoDoMes.tsx` **é** essa fileira. Falta a última aba.

Isso muda o desenho: não é "acrescentar um link no topo do painel", é **a
fileira ganhar o item que ela sempre teve no original**. E abas que só aparecem
numa das telas não são abas — são um link. Por isso a fileira passa a aparecer
**nas duas**, com o item certo marcado em cada uma.

### Descoberta 2 — recortar por ano é **filtrar um array**, não escrever SQL

`compararMeses(historico, mesAtual)` recebe o histórico já pronto e faz todo o
resto em memória. `mediaDoComparativo` filtra `m.mes < mesAtual` de dentro do
que recebeu.

Então **passar só os meses de um ano recorta a tela inteira**: as barras, a
média e a frase, todas de uma vez, sem tocar em nenhuma das duas funções.

E há um efeito colateral gratuito: `SecaoDoComparativo` só escreve o ano na
etiqueta quando a série atravessa a virada (`anos(linhas) > 1`). Dentro de um
ano isso é falso, e as etiquetas ficam `jan fev mar` em vez de `jan/26 fev/26` —
sem mudar uma linha.

### Descoberta 3 — os 6 cartões não precisam de consulta nenhuma

A spec 06 adiou os cartões dizendo que eram _"agregados por **categoria** e por
**ano**"_, e que _"o histórico da spec 06 é por pote"_. Fui conferir os seis:

| Cartão no painel original | O que ele é hoje no app                      |
| ------------------------- | -------------------------------------------- |
| 📈 Investido Acumulado    | pote **Liberdade Financeira** (📈)           |
| ★ Metas Giulia Acumulado  | pote **Metas / Sonhos** (★)                  |
| 🏠 Média Custos Fixos     | pote **Custos Fixos** (🏠)                   |
| 🎮 Média Lazer/Conforto   | pote **Conforto & Lazer** (🎮)               |
| 🔧 Total Manutenção       | pote **Manutenção** (🔧)                     |
| ⛽ Média Mensal Gasolina  | **categoria** Gasolina, dentro de Transporte |

**Cinco dos seis são potes**, e os emojis batem com `potes-padrao.ts` um a um —
📈, ★, 🏠, 🎮, 🔧. A premissa da spec 06 estava errada: eles são por pote e por
ano, e `historicoDosMeses` já devolve exatamente isso.

Total do ano = somar os meses daquele ano. Média mensal = dividir pelos meses
com dado. **Zero SQL novo, zero coluna nova, zero migração.** A consulta cara já
está na tela.

⚠ Só o ⛽ Gasolina é de categoria — e é justamente ele que não entra. Ver a
Descoberta 4 e a pendência 4.

### Descoberta 4 — "6 cartões" é uma lista escrita à mão, e o app tem `/categorias` desde a spec 05

Os seis do painel estático são os potes do Davi em 2026, curados por ele: não há
Conhecimento, não há Outros / Repasses, e há uma categoria avulsa. Copiar essa
lista para dentro do app seria escrever `"Gasolina"` e `"Metas / Sonhos"` em
código.

A spec 05 existe exatamente porque isso não se sustenta: **potes e categorias são
editáveis, renomeáveis e apagáveis pelo usuário.** Uma lista fixa some no dia em
que alguém renomeia "Manutenção" para "Carro" — e some em silêncio, mostrando um
cartão zerado em vez de um erro.

Por isso os cartões são **um por pote de gasto, derivados**. O Davi tem 8 potes
de gasto, então são 8 cartões, na ordem do painel. Ninguém precisa lembrar de
editar uma lista quando criar um pote novo — é a mesma lição da `/passos`, que a
spec 09 fez derivar de `FORMATOS`.

### Descoberta 5 — "acumulado" ou "média" é uma pergunta que não precisa de resposta

O painel original decidiu caso a caso: **acumulado** para Investido, Metas e
Manutenção; **média mensal** para Custos Fixos, Lazer e Gasolina.

Tentei achar a regra por trás e ela não fecha. O critério parece ser _"soma o que
vira patrimônio ou o que é esporádico; faz média do que é recorrente"_ — mas
Investimento e Metas são tão mensais quanto Custos Fixos, e cairiam do lado
errado de qualquer regra baseada em frequência. Um campo novo no pote
(`acumula`) resolveria, ao custo de uma migração e de mais uma pergunta na
`/categorias`.

**Não é preciso escolher: os dois números saem da mesma soma.** O cartão mostra o
total do ano e a média mensal, sempre. Nenhuma regra para errar, nenhuma
migração, e some a pergunta "por que este é média e aquele é total?".

---

## Página: `/dashboard` — a fileira ganha a última aba

**Propósito:** o mesmo. Muda a navegação.

### Componentes

| Componente                              | Estado inicial           | Variações                                              |
| --------------------------------------- | ------------------------ | ------------------------------------------------------ |
| Fileira de abas (hoje `SeletorDeMeses`) | uma aba por mês da conta | **nova:** a última aba é `📊 Comparativo`              |
| Aba do comparativo                      | presente                 | **ausente com um mês só** — ver o comportamento abaixo |
| `ChamadaDoComparativo` no fim do painel | inalterada               | inalterada                                             |

⚠ **A fileira sai do `TopoDoMes.tsx` para `painel/navegar-entre-meses/`.** Ela
deixa de ser "o topo do painel" e passa a ser navegação de duas telas; deixá-la
dentro do componente que também desenha entrou/saiu/diferença faria a
`/comparativo` importar o painel inteiro para desenhar uma linha de abas.

⚠ **A aba não aparece quando a conta tem um mês só.** É a mesma decisão da
`ChamadaDoComparativo`, e pelo mesmo motivo escrito lá: _"convidar para o
comparativo quem tem um mês só é convidar para uma tela que vai dizer 'ainda não
dá para comparar'"_. Com um mês, a fileira é o que é hoje.

### Comportamentos do usuário

| Ação do usuário          | Resposta do sistema                                          |
| ------------------------ | ------------------------------------------------------------ |
| Toca num mês             | Idêntico a hoje                                              |
| Toca em `📊 Comparativo` | Vai para a `/comparativo` **no ano do mês que estava vendo** |
| Está no painel           | O mês atual fica marcado; a aba do comparativo, não          |

### Dados envolvidos

- **Lê:** os mesmos meses de hoje
- **Escreve:** nada

---

## Página: `/comparativo` — vira anual

**Propósito:** "o que aconteceu com meus potes **neste ano**". Hoje ela responde
"desde sempre", que é uma pergunta que ninguém faz e uma tela que não para de
crescer.

### Componentes

| Componente      | Estado inicial                                  | Variações                                                                      |
| --------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| Fileira de abas | a mesma do painel, com `📊 Comparativo` marcado | —                                                                              |
| Seletor de ano  | o ano do mês de referência marcado              | **ausente quando a conta tem um ano só** — controle de uma opção é ruído       |
| Cartões do ano  | um por pote de gasto, na ordem do painel        | **pote zerado no ano:** aparece com R$ 0,00, não some (lição da B5 da spec 05) |
| Barras por pote | como hoje, recortadas ao ano                    | **ano sem mês suficiente:** a média se cala e a tela aponta o ano anterior     |
| Frase do topo   | como hoje                                       | as três variações de hoje, agora dentro do ano                                 |

### Os cartões, em detalhe

Cada cartão traz o **total do ano** como número grande e a **média mensal**
embaixo, mais a linha mês a mês que o painel original tinha no `cstat-sub`:

```
🔧 Manutenção
R$ 1.378,91  no ano
R$ 275,78/mês  ·  5 meses com dado
mar R$0 · abr R$541,87 · mai R$140 · jun R$352,04 ⚠ · jul R$0
```

⚠ **A média é sobre meses com dado, e a tela diz quantos são.** Dividir por 12
num ano com 5 meses importados daria um número que descreve nenhum mês real e
que **muda sozinho** conforme o ano avança. É a mesma disciplina da
`mediaDoComparativo`, que nunca omite sobre quantos meses está falando.

⚠ **Mês pouco classificado é marcado com ⚠ na linha do cartão**, como já
acontece nas barras. Um cartão que soma um mês metade classificado mente **para
baixo**, e mente com cara de total fechado. Ele continua na conta — some da
média quem não pode servir de régua, some da tela quem não existe — mas a marca
aparece.

### Comportamentos do usuário

| Ação do usuário                     | Resposta do sistema                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| Chega pela aba                      | Abre no ano do mês que estava vendo no painel                                                  |
| Chega pela chamada do fim do painel | Idêntico — o mesmo ano                                                                         |
| Troca de ano                        | Cartões, barras, média e frase, todos do ano escolhido. Uma navegação, `?ano=`                 |
| Está num ano com um mês só          | Os cartões aparecem (um mês é um total válido); a média se cala e a tela aponta o ano anterior |
| Está num ano sem mês nenhum         | Não acontece: o seletor só lista anos que têm mês                                              |
| Toca em `← Painel`                  | Volta ao painel, como hoje                                                                     |

### Dados envolvidos

- **Lê:** `historicoDosMeses` e `dadosDoPainel`, **as mesmas duas de hoje**
- **Escreve:** nada

---

## O ano recorta a média também, e isso é uma mudança de significado

Hoje a média é _"todos os meses anteriores ao de referência"_. Recortada ao ano,
passa a ser _"os meses daquele ano anteriores ao de referência"_.

**É o significado certo para uma tela que se chama anual** — e é o que o painel
original fazia, com o crachá "6 períodos com dados · 5 a preencher" contando
dentro de 2026. Mas é mudança de número, e ela precisa estar escrita.

⚠ **A `ChamadaDoComparativo` do painel recorta junto.** Elas compartilham
`mediaDoComparativo` desde a spec 09 exatamente para não poderem divergir:

> _"se a frase do painel e a da `/comparativo` fossem calculadas em lugares
> diferentes, um dia o painel diria 'média de 3 meses' e a tela ao lado diria
> 'comparado com maio' — e quem lesse não teria como saber qual das duas
> mentiu."_

Recortar num lugar só quebraria isso. As duas passam a receber o mesmo array já
filtrado pelo ano.

**O preço está em janeiro.** No primeiro mês de um ano novo não há mês anterior
_dentro do ano_, então a média se cala e a chamada do painel some — mesmo com um
ano inteiro de dado logo atrás. É real e está nos riscos.

---

## Riscos

**Janeiro perde a comparação que dezembro tinha.** É o preço do recorte por ano,
e ele bate exatamente em quem acabou de fechar um ano inteiro de dados. A
mitigação é a tela dizer, quando o ano tem menos de dois meses classificados,
**"2027 ainda tem 1 mês — veja 2026"**, com o link. Se incomodar mesmo assim, a
saída é uma opção "últimos 12 meses" ao lado do seletor de ano — está na
pendência 6, deliberadamente fora desta spec.

**Oito cartões antes das barras é muita tela antes do assunto.** O painel
original tinha seis, num monitor, em grade de três colunas. A 360px são oito
blocos empilhados entre o topo e a primeira barra. **Mitigação: grade de duas
colunas**, como o `grid-cols-3` do `TopoDoMes` já faz caber três números em
360px. Se ainda ficar longo, os cartões são o candidato natural a recolher — a
spec 09 já fez isso com as categorias.

**Um cartão soma mês mal classificado com cara de total fechado.** O ⚠ na linha
mês a mês é a defesa, e ela é mais fraca que a das barras: na barra o mês vem
apagado e a diferença salta aos olhos; num cartão é um símbolo pequeno perto de
um número grande.

**A fileira de abas mistura dois tipos de destino.** Onze meses e um comparativo
na mesma linha, com o mesmo formato. Se a aba do comparativo parecer só mais um
mês, ela vira o mês que ninguém acha. **Mitigação: ela é visualmente diferente** —
o emoji 📊, e separada dos meses.

**Dois caminhos para a mesma tela.** A aba no topo e a chamada no fim do painel.
Mantidos de propósito: a aba é navegação ("quero ir lá"), a chamada mostra um
pedaço do resultado ("olha o que tem lá") — foi assim que a spec 09 a desenhou,
e um link seco no lugar dela é _"um botão que ninguém aperta"_. Se um dos dois
ficar sobrando, o que sai é a chamada, não a aba.

---

## Pendências — decididas

⚠ **Decisões minhas, todas derrubáveis.**

**1. Os cartões são os 6 do painel original?** ➡️ **Não: um por pote de gasto,
derivados.** Descoberta 4 — lista escrita à mão morre no dia em que alguém
renomeia um pote, e a spec 05 fez renomear ser normal.

**2. Cartão mostra total ou média?** ➡️ **Os dois, sempre.** Descoberta 5. Saem
da mesma soma, e a regra que escolheria entre eles não existe.

**3. A média mensal divide por 12 ou pelos meses com dado?** ➡️ **Pelos meses com
dado, e a tela diz quantos são.**

**4. O cartão de Gasolina (categoria) entra?** ➡️ **Não.** É o único dos seis que
não é pote, e seria a única consulta nova da spec. Se ele fizer falta, o pedido
real é "fixar uma categoria como cartão" — que é uma funcionalidade, não um
cartão, e merece a própria spec.

**5. A `ChamadaDoComparativo` sai, agora que existe a aba?** ➡️ **Fica.** São
funções diferentes; ver os riscos.

**6. Entra "últimos 12 meses" junto com o ano?** ➡️ **Não.** Dois recortes ao
mesmo tempo é duas telas dentro de uma. Ano primeiro, porque foi o que o Davi
pediu e o que o painel original fazia.

**7. A fileira de abas aparece nas duas telas ou só no painel?** ➡️ **Nas duas.**
Aba que existe numa tela só é link, não aba.

**8. O seletor de ano aparece com um ano só?** ➡️ **Não.** Controle de uma opção
é ruído que promete escolha inexistente.

---

## O que fica de fora, e por quê

| Fora                                      | Por quê                                                                                                                                         |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| "Tendências & Alertas" do painel original | São os insights da spec 06, que já existem por pote no painel. Repeti-los por ano é outra função, não outra tela                                |
| A tabela de projeção "Abr → Dez"          | Projetar é inventar mês que não aconteceu. O app nunca fez isso, e a spec 04 recusou o snapshot pelo mesmo motivo                               |
| Comparar dois anos lado a lado            | O seletor mostra um ano por vez. Dois anos na mesma barra é outro desenho, e ninguém pediu                                                      |
| Potes de renda nos cartões                | Mesma decisão do `historicoDosMeses`: "Renda subiu 40%" ao lado de "Transporte subiu 40%" seriam a tela dizendo que são o mesmo tipo de notícia |
| Exportar o comparativo                    | Fase 2 do `readme.md`                                                                                                                           |

---

## Como saber que funcionou

1. **`comparativo.test.ts` passa sem uma linha alterada.** O recorte por ano é
   filtrar o array antes de chamar; se `compararMeses` precisar mudar, o desenho
   está errado. Foi assim que o `tema.test.ts` provou a spec 10.
2. **Uma conta com dois anos** mostra o seletor, e trocar de ano troca cartões,
   barras, média e frase de uma vez.
3. **Uma conta com um ano** não mostra seletor nenhum.
4. **A soma dos cartões bate com a soma das barras** do mesmo pote — os dois
   saem do mesmo array, e um teste que compare os dois pega qualquer divergência.
5. **A aba some** numa conta com um mês só.
