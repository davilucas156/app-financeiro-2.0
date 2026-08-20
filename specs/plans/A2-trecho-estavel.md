# Plano — A2 · Extrair o trecho estável de uma descrição

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** A2 de `specs/03-motor-de-classificacao.tarefas.md`
**Camada:** BACK (pura)
**Arquivos:** `src/features/classificacao/motor/trecho.ts` e `trecho.test.ts`

## A assimetria que decide tudo

Quando você corrige uma classificação e responde "sempre classificar assim", é
o trecho que sai daqui que a regra passa a procurar. Errar tem dois lados, e
eles não custam a mesma coisa:

| Erro | Como aparece |
|---|---|
| Trecho **curto demais** | Casa com o que não devia. **Silencioso** — você só descobre olhando o painel meses depois |
| Trecho **longo demais** | Deixa de casar no mês seguinte. Chato, mas **visível**: o lançamento reaparece na revisão |

Errar para o lado barulhento é melhor. Então removo **só o que é
comprovadamente volátil** e mantenho todo o resto, mesmo que o trecho fique
mais específico do que o necessário.

## E por que não precisa ser perfeito

Uma maquininha de cartão aparece na frente de comerciantes que não têm nada a
ver entre si; num outro caso o nome útil é a primeira palavra e o resto é o
endereço da loja. Nenhuma heurística acerta os dois.

Por isso a tela **mostra o trecho** antes de criar a regra, junto de quantos
outros pendentes ela pegaria (B3). O que sai daqui é uma **proposta**, não um
veredito. Isso muda o alvo: não preciso de uma extração infalível, preciso de
uma que quase sempre proponha algo bom e que nunca proponha algo perigoso em
silêncio.

## Duas formas, dois tratamentos

**Fatura:** colunas alinhadas por espaço — comerciante, cidade, país. Corto do
fim o que for local.

**Extrato:** `Tipo do evento: "conteúdo"`. Fico com o conteúdo; `Pix enviado`
sozinho classificaria todo Pix igual. E quando o conteúdo é uma transferência
entre contas, devolvo **nada** — ali o trecho útil é o nome do outro lado, e a
regra certa é a do tipo `pessoa` (A3). Devolver `CP :00000000-FULANA` como
texto amarraria a regra ao número da conta.

## O que a medição mudou

Rodei contra as 37 descrições distintas dos arquivos reais e conferi uma a uma,
como o critério exige. **Duas coisas estavam erradas.**

### 1. Eu destruía a estrutura antes de usá-la

Passei a descrição por `normalizarDescricao` antes de separar as colunas — e
essa função **colapsa espaços repetidos**, que são exatamente o que separa as
colunas da fatura. Resultado: a cidade sobrevivia nas 23 linhas do cartão.

O cartão passou a receber o texto **cru**, e a normalização acontece campo a
campo, depois do corte.

### 2. Derrubar dois campos comia pedaço do nome

Um comerciante terminado em palavra curta e maiúscula (`… CLOUD SUB`) tem a
mesma cara que um código de país (`BRA`). Nenhuma expressão distingue os dois —
o que distingue é a **posição**, e local só existe no fim.

Passou a derrubar **um campo só**. Com isso, as 23 linhas saem certas.

## Resultado medido

| | |
|---|---|
| Descrições distintas | 37 |
| Da fatura, com trecho conferido a olho | 23 de 23 |
| Do extrato, com trecho | 2 |
| Do extrato, sem trecho (vão para regra de `pessoa`) | 12 |

Os 12 sem trecho não são falha: são transferências, e o motor tem um tipo de
regra próprio para elas — o mesmo tipo que existe porque nenhum LLM sabe quem é
quem na sua vida.

## Edge cases

| Situação | Tratamento |
|---|---|
| Descrição sem local nenhum | Passa inteira |
| Cidade e país no mesmo campo | Saem juntos |
| Cidade em campo próprio, país em outro | Sai só o país; a cidade fica. **Errar para o lado longo** |
| Um campo só | Nada é cortado |
| Trecho com menos de 4 caracteres | Devolve nada — casaria com meio extrato |
| Só dígitos | Devolve nada — é número de documento |
| Vazio ou só espaço | Devolve nada |
| Acento e caixa | Normalizados, para casar com o que a A1 compara |

## Fora do escopo

- Extrair o nome da pessoa → **A3**
- Escolher entre regra de texto e regra de pessoa → **D5**, na hora de criar
- Deixar você editar o trecho proposto → fase 2

## Critério de pronto (da Etapa 2)

- [ ] Devolve o pedaço que faz sentido virar regra, sem cidade, país, número
      nem data
- [ ] Roda contra as descrições reais e o resultado é conferido uma a uma
- [ ] Nenhum dado real entra no repositório
