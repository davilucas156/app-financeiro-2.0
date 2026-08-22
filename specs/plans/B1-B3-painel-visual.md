# Plano — B1, B2 e B3 · Protótipo visual do painel

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** B1, B2 e B3 de `specs/04-painel-do-mes.tarefas.md`
**Camada:** FRONT-VISUAL
**Arquivos:** `app/(app)/painel/page.tsx` (temporária), `proxy.ts`,
`features/painel/painel-do-mes/`

## O que é

O painel inteiro com **dados falsos**, para o Davi aprovar antes de eu encostar
no banco. Fim da fase B é o portão.

## A tela fica numa rota própria, e não no `/dashboard`

Na spec 03 o protótipo morou na própria `/revisao`, porque a rota não tinha nada
de verdade para mostrar. Aqui é diferente: o `/dashboard` mostra números reais
do Davi desde a D6 da spec 02.

Pôr dados falsos lá dentro faria exatamente o que o comentário da rota de
revisão avisa: *"deixar os dois convivendo garantiria que um dia alguém veria o
falso achando que era o real"*. Com dinheiro na tela, esse dia custa caro.

Então `/painel`, temporária, com uma **tarja de andaime no topo**. A D5 move a
tela para o `/dashboard` e apaga os dados falsos junto.

⚠ Rota nova é rota desprotegida: `/painel(.*)` entra no `proxy.ts`. **Não** entra
em `rotas.ts` — andaime não vai para a barra de navegação.

## Um mês inventado que mostra os quatro estados de uma vez

A A3 produz quatro estados de pote que a tela precisa distinguir **sem ler o
número**: sem meta, vazio, negativo, estourado.

Podia ser `?estado=` como a fase B da spec 03 fez. Não vai ser: um mês montado
para conter os quatro ao mesmo tempo mostra o que interessa de verdade — se eles
se distinguem **um do lado do outro**. Variante por URL testa cada um sozinho,
que é o teste fácil.

A única variante que precisa de URL é a cobertura, porque "incompleta" e
"completa" não coexistem: `?cobertura=completa`.

## A ordem da tela é a ordem da confiança

1. **Mês.** Todo o resto é sobre ele.
2. **Entrou / saiu / diferença.** Não depende de classificação nenhuma — só de
   `direcao`. É o número mais sólido da tela.
3. **A cobertura.** Antes dos potes, porque é ela que diz se dá para acreditar
   neles. Rodapé cinza aqui seria a defesa não funcionando.
4. **A renda declarada.** A régua das metas, visível — não escondida numa tela
   de configuração, senão as metas parecem lei da natureza.
5. **Os potes.**

## O negativo e o vazio precisam parecer diferentes de zero

Os três mostrariam "R$ 0,00" numa tela descuidada, e significam coisas
diferentes:

| | O que aconteceu | Como aparece |
|---|---|---|
| **Vazio** | Nada caiu aqui | `—`, e a meta continua visível |
| **Zero** | Entrou e saiu o mesmo | `R$ 0,00` com os dois lançamentos na lista |
| **Negativo** | Reembolso maior que o gasto | `−R$ 20,00`, barra vazia |

## O "trocar categoria" aparece apagado

A D4 é quem o liga. Mesma decisão do "Voltar" na D4 da spec 03: fingir que
funciona seria pior do que ele estar apagado — e no portão o Davi precisa ver
**onde** ele vai ficar para dizer se está no lugar certo.

## Pronto quando

- `/painel` mostra mês, entrou/saiu/diferença, cobertura, renda e os nove potes;
- os quatro estados de pote se distinguem sem ler o número, lado a lado;
- tocar num pote abre categorias e lançamentos;
- legível em 360px, alvos ≥44px;
- nenhum número real do Davi na tela, e a tarja dizendo isso.
