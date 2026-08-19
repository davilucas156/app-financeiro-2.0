# Tarefas — Upload de extrato

**Etapa:** 2 (Break) do workflow `dev-workflow-davi`
**Spec de origem:** `specs/02-upload-de-extrato.md` (aprovada)
**Formatos medidos:** `references/formatos-de-extrato.md`
**Status:** aguardando aprovação do Davi

Legenda de camada: `INFRA` · `FRONT-VISUAL` · `FRONT-INTEGRADO` · `BACK` · `BANCO`

---

## Por que a ordem aqui é diferente da spec 01

Na spec 01 o protótipo visual veio primeiro. Aqui o **parser vem antes**, e é
uma inversão consciente:

1. O parser não tem tela. É função pura, testável contra os arquivos reais sem
   nenhuma interface — o tipo de coisa que dá para provar, não achar.
2. **A tela de resumo depende do que o parser sabe dizer.** "142 entraram, 3
   ignorados por data inválida, 1 pagamento de fatura excluído" só pode ser
   desenhado depois que existir quem produza esses números. Desenhar antes é
   inventar um relatório e depois torcer para o parser caber nele.
3. É a parte de maior risco. Se algum formato se revelar mais teimoso do que o
   medido, é melhor descobrir na primeira semana.

O portão de aprovação visual continua existindo — só mudou de lugar: fim da
fase B, antes de qualquer integração.

---

## Fase A — Ler o arquivo (sem tela, sem banco)

### A1 · Camada 1 — arquivo vira grade de células
**Camada:** BACK
**Pronto quando:** existe uma função que recebe os bytes de um CSV e devolve
uma matriz de strings, tratando: BOM, `;` sem aspas, `,` com aspas, campo
citado contendo vírgula, campo **não** citado contendo aspas, linha em branco e
quebra de linha `\r\n`. Não sabe nada de banco, data nem dinheiro.

**Amostras de teste** vivem como strings em TypeScript, não como `.csv` —
arquivo de extrato é `.gitignore` (dado real), e uma amostra em código fica
obviamente sintética e não some do repositório.

### A2 · Reconhecer o formato
**Camada:** BACK
**Pronto quando:** dada a grade, o sistema identifica se é **extrato do Inter**
ou **fatura do Inter** pelo cabeçalho — nunca pela extensão nem pelo nome do
arquivo. Cabeçalho desconhecido devolve erro dizendo qual coluna faltou. As
5 linhas de metadados do extrato são puladas.

### A3 · Camada 2 — grade vira lançamentos
**Camada:** BACK
**Pronto quando:** cada formato converte suas linhas em lançamentos com data,
descrição, valor **em centavos** e direção. Cobre `1.200,00`, `-60,00`,
`"R$ 15,00"`, `"-R$ 318,19"`. Linha inválida não derruba o arquivo: é contada
e reportada. Do cartão, guarda também `parcela` e `categoria_do_banco`.

### A4 · Impressão digital e pares que se anulam
**Camada:** BACK
**Pronto quando:** existe a chave que identifica um lançamento repetido
(data + valor + descrição + origem) e a detecção do **pagamento de fatura**
(pendência 4 da spec) e do par zero-a-zero. Nada é apagado — os dois lados são
marcados.

### A5 · Verificar contra os arquivos reais do Davi
**Camada:** BACK
**Pronto quando:** os dois arquivos de verdade passam pelo pipeline inteiro e
o resultado bate, linha a linha, com o que está no arquivo: contagem, soma dos
valores, e o par de R$ 318,19 marcado. **Roda fora do repositório**, contra os
arquivos que estão só na máquina do Davi.

---

## Fase B — Protótipo visual (sem lógica, sem banco)

### B1 · Tela de enviar — visual
**Spec:** Página `/upload`
**Camada:** FRONT-VISUAL
**Pronto quando:** `/upload` tem seletor de mês (futuro bloqueado), dois campos
de arquivo (conta obrigatório, cartão opcional) mostrando nome e tamanho, e o
botão "Importar" com os estados normal/desabilitado/enviando/erro. Alvos de
toque ≥44px, legível em 360px.

### B2 · Resumo da importação — visual
**Camada:** FRONT-VISUAL
**Pronto quando:** com dados falsos, o resumo mostra quantos entraram, quantos
foram ignorados **e por quê**, quantos caíram em revisão, e o aviso de arquivo
já importado. Os motivos são os que a fase A produz de verdade.

### B3 · Meses já importados e desfazer — visual
**Camada:** FRONT-VISUAL
**Pronto quando:** lista com mês, contagem e data do envio; ação de desfazer
com confirmação; estado vazio para quem nunca enviou nada.

> ⛔ **Portão de aprovação do Davi.** Não seguir para a fase C sem o "ok" visual.

---

## Fase C — Banco

### C1 · Tabela `transactions`
**Camada:** BANCO
**Pronto quando:** criada com `user_id`, `data`, `descricao_original`, `valor`
em centavos, `direcao`, `categoria_id` **nulo**, `status`, `mes_referencia`,
`origem`, `import_id`, `impressao`, `parcela`, `categoria_do_banco`. Índice por
`user_id` e por `mes_referencia`. Restrição de unicidade em
`(user_id, impressao)` — é ela que torna a importação idempotente, do mesmo
jeito que `(user_id, slug)` fez pelos potes na D7.

### C2 · Tabela `imports`
**Camada:** BANCO
**Pronto quando:** criada com `user_id`, `mes_referencia`, `origem`,
`nome_arquivo`, `hash`, `url_no_blob`, contagens e `criado_em`. Único em
`(user_id, hash)` — é o que responde "esse arquivo já foi enviado?".
`transactions.import_id` aponta para cá, e apagar um import leva os
lançamentos dele junto.

---

## Fase D — Integração

### D1 · Guardar o arquivo original no Blob
**Camada:** BACK + INFRA
**Pronto quando:** o arquivo enviado vai para o Vercel Blob **privado**,
`BLOB_READ_WRITE_TOKEN` configurado na Vercel, e a URL nunca é pública. Arquivo
grande demais ou de tipo errado é recusado antes de subir. **Desfazer um envio
apaga o arquivo junto** — veio da D5, porque gravar e apagar no Blob são a
mesma decisão e só dá para provar as duas juntas.

### D2 · Importar — a gravação
**Camada:** BACK
**Pronto quando:** uma server action recebe o arquivo, executa o pipeline da
fase A e grava, **numa única transação**, o `import` e os lançamentos. Falha no
meio não deixa nada pela metade. Reenviar o mesmo arquivo não duplica.
`user_id` sempre de `auth()`.

### D3 · Ligar a tela ao real
**Camada:** FRONT-INTEGRADO
**Pronto quando:** os campos da B1 chamam a D2 de verdade, o resumo da B2
mostra números reais, e duplo toque não importa duas vezes.

### D4 · Meses importados, de verdade
**Camada:** FRONT-INTEGRADO
**Pronto quando:** a lista da B3 lê do banco, filtrada por `user_id` da sessão.

### D5 · Desfazer uma importação
**Camada:** BACK + FRONT-INTEGRADO
**Pronto quando:** apagar um envio remove os lançamentos dele e mais nada;
exige confirmação; e o mesmo arquivo pode ser reenviado depois.

O arquivo no Blob **saiu daqui e foi para a D1**: enquanto a D1 não existe,
`url_no_blob` é nulo em toda linha, e escrever a remoção seria escrever um
caminho que nunca executa nem dá para verificar.

### D6 · Estado vazio do painel deixa de mentir
**Camada:** FRONT-INTEGRADO
**Pronto quando:** com lançamentos importados, `/dashboard` para de dizer "nada
por aqui ainda" e diz quantos há esperando classificação, apontando para a
próxima etapa. **Não é o dashboard** — é só não mentir.

---

## Fase E — Deploy

### E1 · Publicar e usar de verdade
**Camada:** INFRA
**Pronto quando:** deploy por `npx vercel --prod`, `BLOB_READ_WRITE_TOKEN` em
Production, e o Davi importa os extratos de junho **pelo celular**, na URL de
produção, conferindo o resumo contra o arquivo.

---

## Resumo

| Fase | Tarefas | Depende de |
|---|---|---|
| A — Ler o arquivo | A1–A5 | — |
| B — Protótipo visual | B1–B3 | A (o resumo depende do que o parser reporta) |
| C — Banco | C1, C2 | aprovação visual de B |
| D — Integração | D1–D6 | C |
| E — Deploy | E1 | D |

A Etapa 3 (Plan) é feita **tarefa por tarefa**, não tudo de uma vez.
