# Plano — B1, B2 e B3 · A tela de enviar extrato (visual)

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** B1, B2 e B3 de `specs/02-upload-de-extrato.tarefas.md`
**Camada:** FRONT-VISUAL
**Spec:** `specs/02-upload-de-extrato.md`, página `/upload`
**Depende de:** fase A (`652dbb3`)

## Três tarefas, um plano

São a mesma tela: o formulário, o resultado do envio e o histórico convivem em
`/upload`. Mostrar meia página para o Davi aprovar e depois a outra metade
desperdiçaria a revisão dele — o julgamento visual é do conjunto.

Mesmo precedente de `B4-B5-shell-e-destinos-vazios.md` na spec 01.

## O que a fase A já decidiu por esta tela

A ordem invertida (parser antes do visual) existia para isto: o resumo mostra
o que o leitor de fato sabe dizer, não um relatório inventado.

| Vem de | O que a tela mostra |
|---|---|
| `Leitura.lancamentos` | quantos entraram |
| `Leitura.ignoradas` | quantas linhas caíram, **com linha, motivo e conteúdo** |
| `marcacao: "excluido"` | pagamento de fatura, fora do cálculo |
| `marcacao: "revisao"` | pares que se anulam |
| `Reconhecimento` (erro) | "parece o extrato do Inter, mas faltou a coluna Valor" |

Os motivos exibidos são **os literais** que a A3 produz. Se um dia mudarem lá,
a tela muda junto — é de propósito: mensagem de erro duplicada em dois lugares
sempre diverge.

## Sem lógica nenhuma

Nada de leitura de arquivo, nada de banco, nada de server action. Os estados
vêm por prop, e a página os escolhe por query string — o mesmo andaime que a
B3 da spec 01 usou e que a D3 vai remover.

`/upload?estado=erro` e afins. Some na integração.

## Componentes

`src/features/upload/enviar-extrato/`

| Componente | Papel |
|---|---|
| `EnviarExtrato.tsx` | compõe a tela inteira |
| `SeletorDeMes.tsx` | mês de referência |
| `CampoDeArquivo.tsx` | um por arquivo: vazio, escolhido, enviando, erro |
| `ResumoDaImportacao.tsx` | o que entrou e o que não entrou (B2) |
| `MesesImportados.tsx` | histórico e desfazer (B3) |

Reusa `Card`, `Badge`, `SectionTitle`, `Button`, `EstadoVazio` e `cn` — nada
novo em `components/ui`, porque nada aqui serve a outra tela ainda.

## Decisões de tela

**O campo do cartão é opcional e diz isso.** A spec permite subir só a conta.
Um campo que parece obrigatório e não é trava o usuário.

**O resumo não é um número só.** "142 importados" esconde o que interessa. A
hierarquia é: quantos entraram, quantos precisam de atenção, quantos ficaram de
fora — e **por quê**, item a item, com o número da linha. "3 ignoradas" sem
dizer quais só gera desconfiança.

**Linha ignorada mostra o conteúdo original.** É o que permite abrir o CSV e
conferir sem adivinhar.

**Desfazer pede confirmação e diz o que vai apagar.** "Apagar 21 lançamentos de
junho/2026 enviados em 18/08" — não "tem certeza?".

**Meses futuros ficam de fora do seletor.** Extrato de mês que não aconteceu não
existe.

## Mobile primeiro

- Alvos de toque ≥ 44px (o `Button` já garante `min-h-11`)
- Legível em 360px: nome de arquivo trunca no meio, não estoura a linha
- O resumo empilha no celular e vira colunas a partir de `sm:`
- Nada de tabela larga: cada linha ignorada é um bloco, não uma célula

## Acessibilidade

- Cada campo de arquivo é um `<label>` de verdade, com `<input type="file">`
  dentro — clicar no bloco inteiro abre o seletor, no celular isso importa
- Bloco de erro com `role="alert"`
- O `aria-busy` do `Button` já vem do componente
- Emoji decorativo com `aria-hidden`

## Estados que a tela precisa renderizar

| Estado | O que aparece |
|---|---|
| `vazio` | Formulário limpo, histórico com `EstadoVazio` |
| `escolhido` | Os dois arquivos com nome e tamanho |
| `enviando` | Botão em carregando, campos travados |
| `erro-de-arquivo` | Erro no campo, com a mensagem da A2 |
| `sucesso` | Resumo completo, com ignoradas, excluídos e revisão |
| `ja-importado` | Aviso de arquivo repetido, sem resumo |
| `com-historico` | Meses importados, com desfazer |

Os números falsos do resumo são **os medidos** nos arquivos reais do Davi (21 e
33 lançamentos, 3 pagamentos de fatura, 2 pares) — assim a revisão visual
acontece na densidade de informação verdadeira, e não numa maquete otimista de
duas linhas.

## Fora do escopo

- Enviar de verdade → **D1/D3**
- Ler o arquivo no cliente → nunca; o parsing é do servidor
- Banco → **C1/C2**

## Critério de pronto (da Etapa 2)

- [ ] Seletor de mês com futuro bloqueado
- [ ] Dois campos, cartão opcional, com nome e tamanho
- [ ] Botão com normal/desabilitado/enviando/erro
- [ ] Resumo com entraram, ignoradas **e por quê**, revisão, arquivo repetido
- [ ] Histórico com mês, contagem, data e desfazer com confirmação
- [ ] Estado vazio para quem nunca enviou
- [ ] Alvos ≥44px, legível em 360px
