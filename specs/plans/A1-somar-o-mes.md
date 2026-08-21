# Plano — A1 · Somar um mês em potes e categorias

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** A1 de `specs/04-painel-do-mes.tarefas.md`
**Camada:** BACK
**Arquivos:** `features/painel/somar-o-mes/somarOMes.ts` (+ teste)

## O que é

A função pura que transforma os lançamentos classificados de um mês em números
por pote e por categoria. Nada de banco, nada de sessão, nada de tela.

## O sinal é o lugar onde o erro mora

Todo valor no banco é **positivo**; o sentido está em `direcao` (decisão da spec
02, porque os dois arquivos do Inter usam o sinal com significados opostos).
Então somar é sempre uma escolha, nunca uma soma.

E a escolha muda com o tipo do pote:

| | Entrada | Saída |
|---|---|---|
| Pote de **gasto** | abate | soma |
| Pote de **renda** | soma | abate |

Duas tabelas mentais numa função é convite para inverter uma delas seis meses
depois. Por isso a saída expõe `saidaCentavos` e `entradaCentavos` **crus**,
mais um `totalCentavos` **já orientado pelo tipo do pote**: num pote de gasto é
quanto saiu líquido; num de renda é quanto entrou líquido.

A tela lê `totalCentavos` e compara com a meta, sem saber de sinal. O sinal fica
resolvido num lugar só, testado.

## Saída em pote de renda não é escondida

É erro de classificação — "Salário" não tem saída. A conta podia ignorar, e
ignorar seria o começo de um painel que esconde o que não entende.

Ela abate a renda realizada, e o número fica estranho de propósito: número
estranho manda olhar, número escondido não manda nada.

## Excluído fica de fora **inteiro**

Inclusive do "o que entrou / o que saiu" do topo. Pagamento de fatura é
`excluido`, e contá-lo faria o gasto do cartão sair duas vezes — que é
exatamente o que a spec 02 resolveu.

## Categoria desconhecida vira cobertura, não exceção

Se um lançamento aponta para uma categoria que não veio na lista, a conta o
trata como **não classificado**.

`transactions.categoria_id` é `set null` ao apagar a categoria, então isso não
acontece com consulta correta — seria bug de quem chama. Estourar uma exceção
derrubaria o painel inteiro por causa de uma linha; ignorar em silêncio seria
pior. Tratado como não classificado, o defeito aparece **na cobertura em
dinheiro** da A2, que é justamente o número que a tela mostra no topo.

O alarme já existe; basta não desligá-lo.

## A entrada é estrutural, não importada

A função aceita qualquer objeto com `{ id, pote: { id, tipo } }` para categoria.
`CategoriaEscolhivel`, que já sai do banco em dois serviços, satisfaz isso sem
`import` nenhum.

Uma terceira forma de "categoria" no projeto seria uma terceira chance de elas
divergirem — e um import de `revisar-lancamento/` para dentro do painel
inventaria uma dependência entre telas que não existe.

## Pronto quando

- soma por pote e por categoria, com saída, entrada, total orientado e contagem;
- `entrouCentavos`, `saiuCentavos` e a diferença do mês, sem depender de
  classificação;
- excluído fora de tudo;
- pote de renda com o sinal invertido, com teste;
- entrada em pote de gasto abatendo, com teste (decisão 2 da spec);
- reembolso maior que o gasto deixando o pote negativo, com teste.
