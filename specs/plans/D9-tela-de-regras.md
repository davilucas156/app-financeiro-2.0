# Plano — D9 · Ver, mexer e apagar as regras salvas

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D9 de `specs/03-motor-de-classificacao.tarefas.md`
**Camada:** FRONT-INTEGRADO + BACK
**Arquivos:** `app/(app)/regras/page.tsx`, `features/classificacao/gerir-regras/`,
`proxy.ts`, `shell/rotas.ts`, `NavegacaoPrincipal.tsx`

## O que é

`/regras` lista as 27 regras da conta com **o texto que cada uma procura** e
**quantos lançamentos ela já classificou**. Dá para trocar o destino, corrigir o
texto e apagar.

Pedido do Davi no portão visual da fase B, e a razão dele continua sendo a boa:
motor que aprende sozinho e nunca desaprende é motor em que se para de confiar
no dia em que ele erra.

## Mexer não reescreve o passado

Editar ou apagar muda o que vale **daqui para frente**. O que a regra já
classificou fica como está.

É a mesma régua da D6: desfazer uma classificação não desfaz o aprendizado, e
desfazer o aprendizado não desfaz as classificações.

Apagar a regra deixa `transactions.regra_id` nulo pelo `set null` — e a
`regra_chave` **congelada** continua lá, respondendo "esta caiu em Transporte
porque uma regra procurava por PETROBRAS". Foi exatamente para este dia que a C3
guardou as duas colunas em vez de uma.

## O número ao lado de cada regra é a parte que dá confiança

"Já classificou 8" transforma uma lista de textos numa lista de consequências.
Regra com zero é suspeita — ou o texto está errado, ou ela nunca foi usada, e as
duas merecem um olhar. Regra com 8 é onde pensar duas vezes antes de mexer.

Sem esse número a tela seria um formulário; com ele é um raio-X do motor.

## Corrigir o texto é a operação perigosa

Trocar `PETROBRAS` por `PETRO` parece inofensivo e passa a pegar `PETROLINA`.
Não dá para prever isso sem os lançamentos na mão — e a B3 já mostra "isto pega
mais 4" no momento em que a regra nasce, que é onde a informação existe.

Aqui a defesa é outra e mais simples: **o texto novo aparece do jeito que vai
ser gravado**, e o campo mostra o que a regra procura hoje. Nada é normalizado
por baixo do pano.

### Colisão de texto tem de doer, e a tela traduz

Editar até bater num texto que já existe estoura o `(user_id, chave)` único da
C1. O schema já previu este dia e escreveu a mensagem:

> a tela deve traduzir para "já existe uma regra procurando por esse texto".

É o comportamento certo, e não um erro a contornar: dois critérios iguais com
destinos diferentes seriam um empate impossível de explicar.

### `valor_direcao` não tem texto para corrigir

Os três tipos do MVP não são simétricos: `descricao_contem` tem termo, `pessoa`
tem nome, e `valor_direcao` tem uma faixa. `textoDoCriterio` devolve a direção
para o terceiro, que não é editável como texto.

Nenhuma regra desse tipo existe hoje — o seed não cria e a D5 não cria. Então a
tela oferece edição de texto só onde ela significa alguma coisa, em vez de
inventar um campo que gravaria lixo.

## Editar torna a regra sua

`origem` passa a `correcao`, como na D5 e pelo mesmo motivo: a coluna responde
"de onde saiu essa regra?", e depois que você mexeu a resposta deixou de ser
"veio pronta". De quebra, o reseed da D7 (`do nothing`) nunca a desfaz.

**A prioridade não muda.** Ela é outro eixo — desempate entre regras que casam
ao mesmo tempo — e mexer nela em silêncio mudaria qual regra vence em casos que
não têm nada a ver com a edição.

## Apagar pede confirmação, e a confirmação diz o tamanho do estrago

Dois toques, e o segundo mostra quantos lançamentos vieram dela e o que acontece
com eles (nada). Apagar 27 regras por engano num toque seria a pior sessão
possível nesta tela.

## O que fica de fora, e por quê

**Cadastrar regra do zero.** É a descoberta 3 da spec: regra escrita de memória
erra. Eu mesmo escrevi `apple.com` para uma descrição que é `APPLE COM BILL`.
Regra nasce de correção sobre descrição real, onde o texto está na tela.

⚠ **Reclassificar o que a regra já pegou.** A tarefa levanta isso como "segunda
ação explícita, **se ele quiser**", e o "Pronto quando" não pede. Fica de fora
desta tarefa — mas é um buraco real e vou dizer isso em voz alta: hoje **não
existe caminho nenhum** para trocar a categoria de um lançamento já
classificado, porque `/revisao` só mostra a fila. É item da spec 04.

## Rota nova é rota desprotegida até alguém lembrar

O `proxy.ts` avisa em letras garrafais: *"Rota interna nova não é protegida
automaticamente. Ao criar uma, acrescente aqui."* `/regras(.*)` entra lá **e**
em `rotas.ts`, que é de onde a navegação lê.

A barra ganha um quarto item. A 360px são 90px por item — o rótulo cabe, e o
alvo continua acima de 44px.

## Pronto quando

- `/regras` lista as regras com o texto, o destino e quantos cada uma classificou;
- dá para trocar o destino, corrigir o texto e apagar, do celular;
- texto repetido vira frase, não erro de banco;
- apagar não mexe em lançamento nenhum, e a explicação congelada sobrevive;
- a rota está protegida;
- verificado contra o Neon real.
