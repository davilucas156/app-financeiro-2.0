# Spec — Telas longas e o primeiro passo

**Etapa:** 1 (Spec) do workflow `dev-workflow-davi`
**Depende de:** nada em execução
**Status:** pendências decididas por mim — ver o fim do documento

> ⚠ Nenhum dado real neste documento.

## O que o Davi pediu, e o que sobrou para esta spec

Ele pediu quatro coisas. **A primeira era defeito, não funcionalidade**, e já
saiu daqui: o seletor de meses do painel era `<span>` e não levava a lugar
nenhum. Está corrigido e no ar (commit `3d609f3`) — o diagnóstico está no
comentário do `TopoDoMes.tsx`, e a lição é o assunto do fim deste documento.

Restam três, e duas delas são a mesma queixa dita de dois jeitos:

| Pedido | O que é de verdade |
|---|---|
| "o comparativo anual seja uma tela separada" | a tela do painel ficou longa demais |
| "as categorias possíveis de minimizar por agrupamento" | a tela de categorias ficou longa demais |
| "uma ajuda no primeiro acesso, um passo a passo objetivo" | o app nunca ensinou ninguém a usá-lo |

## O que eu medi antes de desenhar

### Descoberta 1 — o painel tem dezoito cartões, e nove são de outro assunto

Contado na `TelaDoPainel.tsx`, com a conta dele hoje:

| Bloco | Cartões |
|---|---|
| Topo (meses, entrou/saiu, cobertura) | 2 |
| Veredito + campo de renda | 2 |
| Os potes de gasto | 8 |
| O pote de renda | 1 |
| **O comparativo** | **9** |

Metade da tela responde "como foi este mês"; a outra metade responde "como este
mês se compara com os outros". São duas perguntas, e quem abre o painel no dia
5 quase sempre veio fazer a primeira.

⚠ **E o comparativo cresce sozinho.** Cada cartão dele tem uma barra por mês da
conta. Com dois meses são 3 linhas por cartão; em dezembro serão 13. O painel de
um ano teria **117 linhas de barra** embaixo dos potes. Não é uma tela que ficou
comprida — é uma tela que fica **mais** comprida todo mês.

### Descoberta 2 — a tela de categorias já nasce com 44 blocos

O seed cria **26 categorias em 9 potes**. Somando os cabeçalhos de pote e os
"+ Nova categoria" de cada um, são ~44 blocos empilhados numa tela de 360px —
e isso **antes** de o usuário criar a primeira categoria dele.

⚠ **A tela existe para achar uma categoria, e é o que ela faz pior.** Quem entra
ali quer renomear uma ou mover outra. Hoje só há um jeito de achar: rolar.

⚠ **A B5 da spec 05 continua valendo, e limita a solução.** Os nove potes
aparecem sempre, inclusive os vazios — se a tela derivasse os potes das
categorias, o pote sem categoria nenhuma sumiria justamente da única tela onde
daria para criar uma dentro dele. **Recolher não pode virar esconder.**

### Descoberta 3 — o app só entende os arquivos de um banco

É o achado que decide a terceira parte, e é desconfortável.

`FORMATOS` em `ler-arquivo/formatos.ts` tem exatamente **duas** entradas:
`inter-extrato` e `inter-fatura`. `references/formatos-de-extrato.md` diz por
quê — cada formato foi **medido em arquivo real**, e só existem arquivos reais
do Inter.

Então um passo a passo que diga *"abra o app do seu banco e baixe o extrato em
CSV"* está **errado para todo mundo que não é do Inter**. A pessoa faria os seis
passos direitinho, subiria o arquivo e levaria uma recusa — depois do trabalho
todo, e sem entender que o problema não foi ela.

> **A régua:** o passo a passo tem de dizer de qual banco ele fala **antes** do
> primeiro passo, e não depois do último.

### Descoberta 4 — a tela de boas-vindas explica o método e não ensina o gesto

`ConcluirOnboarding.tsx` faz um bom trabalho no que se propõe: apresenta os
potes, mostra os percentuais, explica que manutenção e repasses ficam fora do
rateio. Depois disso, "Começar" leva para o painel — que está **vazio**, com um
botão "Enviar extrato".

Ou seja: o app explica o **conceito** e depois entrega uma tela em branco. O
passo que falta é justamente o único que a pessoa não consegue adivinhar,
porque acontece **fora do app** — no aplicativo do banco.

⚠ **E não é uma tela para ver uma vez.** O gesto se repete uma vez por mês, e
onze meses depois ninguém lembra em que menu do banco ficava aquilo. Um tutorial
que só existe no primeiro acesso é um tutorial que não está lá quando se precisa
dele.

---

## O desenho

### Parte 1 — o comparativo vira `/comparativo`

Sai do fim do painel e ganha rota própria.

**Fora da barra de navegação**, como `/categorias` e `/configuracoes`: são 4
itens desde a D9 da spec 03, e a 360px um quinto derruba o alvo de toque abaixo
dos 44px. A decisão do Davi na pendência 3 da spec 05 continua valendo.

**O caminho até ele fica exatamente onde ele estava.** No lugar que o
comparativo ocupava, um bloco curto com a frase que já existe ("comparado com
maio", "a média de 3 meses") e um "Ver comparativo →". Quem já se acostumou a
rolar até ali continua achando — só que agora o painel acaba antes.

⚠ **A tela nova não tem seletor de mês, e é a diferença entre as duas.** O
painel é sobre **um** mês; o comparativo é sobre **todos**. Levar o seletor
junto criaria a pergunta "de que mês é este comparativo?", que não tem resposta.

### Parte 2 — cada pote de `/categorias` se recolhe

O cabeçalho do pote vira um botão que abre e fecha, com o número de categorias
ao lado. **Recolhido é o padrão**: a tela abre como uma lista de nove linhas,
que é a única forma de ela caber numa tela e responder "onde está X" sem rolar.

⚠ **O pote vazio continua aparecendo, e recolhido ele fica mais visível ainda**
— uma linha dizendo "nenhuma categoria" no meio de nove. É a descoberta 2, e o
recolher a serve em vez de atrapalhá-la.

⚠ **O estado não é lembrado entre visitas.** Guardar exigiria cookie ou
`localStorage` para uma tela que se visita raramente, e o preço de errar é abrir
a tela com um pote aberto que não é o que a pessoa veio ver.

### Parte 3 — "Como pegar o extrato", em três lugares

Uma tela, alcançável de três pontos, porque o momento de precisar dela é
diferente do momento de vê-la pela primeira vez:

1. **no primeiro acesso**, como o passo seguinte ao "Começar";
2. **no painel vazio**, ao lado do "Enviar extrato";
3. **na `/upload`**, para sempre — é onde a pessoa está no dia 5 do mês que vem.

O conteúdo é o gesto, não o conceito: onde tocar no app do banco, o que baixar,
que os **dois** arquivos importam (o extrato da conta **e** a fatura do cartão)
e por quê — sem os dois, o pagamento da fatura vira um buraco de mil reais no
lugar dos gastos que ele representa.

⚠ **Começa dizendo "Banco Inter".** Descoberta 3. E diz, na mesma frase, o que
fazer se o banco for outro — que hoje é: mande o arquivo para o Davi, porque
formato novo se **mede** antes de virar parser.

## O que fica de fora, e por quê

| Fora | Por quê |
|---|---|
| **Os 6 cartões de topo do Comparativo Anual** | Eles finalmente têm onde morar, e continuam fora: são agregados por **categoria** e por **ano**, e o histórico de hoje é por **pote**. É outra consulta e outra spec. Registrado na spec 06, pendência 5. |
| **Busca na tela de categorias** | O recolher já resolve o "onde está X" para 9 potes. Busca é a resposta para 60 categorias, e a tela existe justamente para isso não acontecer. |
| **Lembrar quais potes ficaram abertos** | Decisão acima. |
| **Passo a passo de outros bancos** | Descoberta 3: formato se mede em arquivo real. Escrever o passo a passo de um banco cujo CSV o app recusa seria ensinar a pessoa a falhar. |
| **Vídeo ou captura de tela do app do banco** | O app do banco muda de layout sozinho, e uma captura desatualizada é pior que texto — ela parece atual. |

## Riscos

**Tirar o comparativo do painel é tirar o que ele acabou de ganhar.** Ele entrou
na spec 06 há dois dias. Se a tela nova ficar longe demais, o Davi vai parar de
olhar — e o comparativo é a única parte do app que responde "estou melhorando?".
É a razão de o caminho ficar **no lugar exato** de onde ele saiu, e não numa
engrenagem.

**Recolhido por padrão é uma aposta.** Para quem quer achar uma categoria é
melhor; para quem entra sabendo o que vai mexer, é um toque a mais toda vez. Se
incomodar, a inversão é uma linha.

**O passo a passo envelhece sem avisar.** Ele descreve menus de um app que não é
nosso. Nada no projeto quebra quando o Inter mudar o layout — e ninguém fica
sabendo, exceto pela pessoa que não conseguiu.

## Pendências — decididas

⚠ **O Davi pediu as três coisas sem responder pergunta nenhuma.** As decisões
abaixo são minhas e qualquer uma pode ser derrubada.

**1. `/comparativo` entra na barra de navegação?** ➡️ **Não.** Um quinto item a
360px derruba o alvo de toque. Entra pelo fim do painel, onde ele já estava.

**2. O comparativo leva o seletor de mês junto?** ➡️ **Não.** Ele é sobre todos
os meses; um seletor criaria uma pergunta sem resposta.

**3. Os 6 cartões do Comparativo Anual entram agora?** ➡️ **Não.** Outra
consulta, por categoria e por ano. A tela primeiro; os cartões quando ele pedir.

**4. Categorias recolhidas ou abertas por padrão?** ➡️ **Recolhidas.** É a única
forma de a tela responder "onde está X" sem rolar 44 blocos.

**5. Onde vive o passo a passo?** ➡️ **Tela própria, alcançável de três
lugares.** O momento de precisar não é o momento de conhecer.

**6. O passo a passo fala de qual banco?** ➡️ **Inter, dito antes do passo 1** —
e com uma saída explícita para quem tem outro. Descoberta 3.
