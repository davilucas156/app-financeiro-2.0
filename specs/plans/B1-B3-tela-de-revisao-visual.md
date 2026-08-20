# Plano — B1, B2 e B3 · A tela de revisão (visual)

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** B1, B2 e B3 de `specs/03-motor-de-classificacao.tarefas.md`
**Camada:** FRONT-VISUAL
**Termina no ⛔ portão de aprovação do Davi**

## Três tarefas, um plano

São a mesma tela. O cartão do lançamento, a escolha da categoria e a pergunta
"sempre classificar assim?" convivem em `/revisao`, e o julgamento visual é do
conjunto — mostrar o cartão sem ter como escolher categoria não é uma tela que
dê para aprovar.

Mesmo precedente de `B1-B3-tela-de-upload-visual.md` na spec 02 e de
`B4-B5-shell-e-destinos-vazios.md` na spec 01.

## O protótipo fica atrás de `?estado=`, e isso não é preguiça

A D6 da spec 02 acabou de fazer `/revisao` **parar de mentir**: hoje ela diz a
verdade sobre os pares que se anulam. Substituí-la por uma tela de mentira,
mesmo que bonita, desfaria isso.

Então o `/revisao` sem parâmetro continua exatamente como está. O protótipo
mora em `/revisao?estado=…` e some na D3, junto com o andaime.

## O que a fase A já decidiu por esta tela

A ordem invertida existia para isto:

| Vem de | O que a tela mostra |
|---|---|
| `Sugestao` (A4) | os até 3 botões, **com a procedência de cada um** |
| `trechoEstavel` (A2) | o texto exato que a regra vai procurar, na B3 |
| `pessoaDe` (A3) | a contraparte, quando é Pix |
| `POTES_PADRAO` | a lista completa, agrupada, com a cor de cada pote |
| A6 | **qual estado é o comum** — ver abaixo |

O tipo `Sugestao` é o da A4, importado, não recriado. A tela fala a língua do
motor.

## O estado padrão é o **sem sugestão**, porque é o que você vai ver

A A6 mediu: **2 dos 17** pendentes recebem sugestão no primeiro mês. Os outros
15 vão direto para a lista completa.

Então `/revisao?estado=padrao` abre no caso sem sugestão. Abrir no caso bonito
— três sugestões coloridas, um toque e pronto — te faria aprovar uma tela que
você quase nunca vê.

**Consequência de desenho:** a lista completa não é um `<details>` no rodapé.
Ela é o corpo da tela, aberta, com busca e alvos de 44px.

## A descrição aparece com os espaços originais

`ACME  CLOUD SUB   SAN FRANCISCO CA` tem colunas alinhadas por espaço. HTML
colapsa isso por padrão e vira `ACME CLOUD SUB SAN FRANCISCO CA` — a estrutura
que separa comerciante, cidade e país desaparece.

Uso `whitespace-pre-wrap` em fonte mono. É o que você lê para decidir, e você
lê melhor com as colunas de pé.

## A B3 mostra o trecho, e é o momento de maior risco da tela

Responder "sempre" cria uma regra. Regra errada classifica em silêncio por
meses — o erro mais caro deste projeto.

Por isso a pergunta mostra **o texto exato** que a regra vai procurar, em mono,
destacado, e **quantos outros pendentes do mês ela pega junto**. Ver "isto vai
pegar mais 4" antes de confirmar é a diferença entre uma regra boa e uma
surpresa em novembro.

Quando não há trecho estável, a pergunta **não aparece** — a A6 mediu zero
casos assim no primeiro mês, mas o estado existe.

## Estados do andaime

| `?estado=` | O que mostra |
|---|---|
| `padrao` | Um comerciante do cartão, **sem sugestão** — 15 de 17 |
| `sugestoes` | Com 2 sugestões e a procedência de cada — 2 de 17 |
| `pix` | Um Pix, com a contraparte em destaque |
| `regra` | A pergunta "sempre classificar assim?" |
| `sem-trecho` | Escolheu, mas não há trecho: a pergunta não aparece |
| `fim` | Nada pendente |

Uma barra no rodapé troca de estado com o polegar, para você revisar no celular
sem digitar URL. Ela é o andaime e sai na D3.

## Componentes

`src/features/classificacao/revisar-lancamento/`

| Arquivo | Papel |
|---|---|
| `TelaDeRevisao.tsx` | compõe a tela |
| `ProgressoDaRevisao.tsx` | "3 de 17" e a barra — B1 |
| `CartaoDoLancamento.tsx` | descrição, valor, data, origem — B1 |
| `Sugestoes.tsx` | até 3, com procedência — B2 |
| `ListaDeCategorias.tsx` | agrupada por pote, com busca — B2 |
| `PerguntaDeRegra.tsx` | "sempre classificar assim?" — B3 |
| `dadosFalsos.ts` | os estados, com nomes **inventados** |
| `Andaime.tsx` | a barra de estados, temporária |

Mais `src/lib/dinheiro.ts`: não existe formatador de dinheiro no projeto ainda,
e o painel vai precisar do mesmo.

## Sem lógica de negócio

Nada de banco, nada de server action, nada de motor rodando. A busca da lista
filtra no cliente porque **filtro que não filtra não dá para julgar** — é
interação de tela, não regra de negócio.

## Edge cases

| Situação | Tratamento |
|---|---|
| Descrição longa | Quebra, nunca trunca |
| 360px | Uma coluna, alvos ≥44px, nada lado a lado |
| Categoria sem sugestão | Vai direto para a lista, que já está aberta |
| Busca sem resultado | Diz que não achou e mantém o "Fora do cálculo" acessível |
| Sem trecho estável | A pergunta de regra não aparece |
| Zero pendentes | Estado final com o número do que foi feito e link para o painel |
| `?estado=` inválido | Cai no `padrao` |
| `/revisao` sem parâmetro | Continua a tela verdadeira da D6 |

## Fora do escopo

- Ler pendentes do banco → D3
- Gravar a decisão → D4
- Criar a regra de verdade → D5
- O "Voltar" desfazer de verdade → D6

## Critério de pronto

- [ ] Um lançamento por vez, descrição sem truncar, valor, data, origem
- [ ] Contador e barra de progresso
- [ ] Até 3 sugestões, cada uma dizendo de onde veio
- [ ] Lista completa agrupada por pote, mais "Fora do cálculo"
- [ ] Pergunta de regra mostrando o trecho e quantos pega
- [ ] "Voltar" e estado final
- [ ] Legível em 360px, alvos ≥44px
- [ ] ⛔ **Portão: aprovação visual do Davi antes da fase C**
