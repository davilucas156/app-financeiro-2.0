# Plano — D3 · A rota nova protegida, e os caminhos até ela

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D3 de `specs/05-categorias-do-usuario.tarefas.md`
**Camada:** INFRA + FRONT-INTEGRADO
**Arquivos:** `classificacao/revisar-lancamento/TelaDeRevisao.tsx`,
`painel/painel-do-mes/TelaDoPainel.tsx`

## A metade INFRA já está feita

`"/categorias(.*)"` entrou em `proxy.ts` na C1, e não na D3, porque publicar um
protótipo desprotegido para o Davi ver no celular seria publicar uma rota
aberta — e "é só um protótipo" não muda nada para quem chegar nela.

Verificado em produção: `/categorias` responde `307 → /entrar` sem sessão.
Falta a segunda metade: **ser alcançável**.

## Fora da barra de navegação, e por isso os caminhos importam mais

Decisão do Davi na pendência 3: são 4 itens desde a D9, e a 360px um quinto
deixaria 72px cada. Arrumar categorias é vontade que nasce olhando para uma
lista de categorias, não item de menu.

O custo dessa decisão é que a rota fica invisível se ninguém a apontar. Dois
links, e os dois **onde a vontade nasce**:

| Onde | Por que ali |
|---|---|
| Fim do painel, depois dos potes | É olhando os potes que se vê um nome errado ou uma categoria no pote errado |
| Fim da revisão, depois da lista de categorias | É passando pela lista inteira que se percebe que há duas dizendo a mesma coisa |

⚠ **Na revisão o link fica no rodapé da tela, e não no rodapé da lista.** O
rodapé da lista é do "+ Nova categoria", que resolve o lançamento aberto sem
sair do lugar. Um link para outra tela ao lado dele convidaria a abandonar a
revisão no meio — e as duas coisas se pareceriam, sendo opostas.

**E também no estado vazio**, pela mesma razão da cópia do "Voltar" que já mora
lá: quando o último pendente é classificado a tela vira aquela, e um caminho
que só existe na tela cheia some justo quando sobra tempo para arrumar.

## Nada de novo no servidor

Dois `Link`. A D3 é a menor tarefa da spec de propósito: o trabalho de tornar a
tela alcançável foi decidir onde ela **não** ficaria.
