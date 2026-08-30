# Plano — D1 e D2, a saída do mês na tela

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** D1 (a saída existe, e ainda não faz nada) e D2 (a confirmação)
**Spec:** `specs/14-remover-um-mes.md`

⚠ **É a primeira fase que pode apagar alguma coisa.** Tudo até aqui subiu sem
ser chamado por ninguém, justamente para que um erro não custasse dados. A partir
da D2 custa.

---

## A decisão que molda o plano: a tela pergunta quando o dedo toca

O `RemoverOMes` recebe **só o mês**. Não recebe o resumo, e a rota não o busca.

⚠ **Pendurar `enviosDoMes` na `/dashboard` faria todo mundo pagar pelo caso
raro.** A rota já faz seis consultas e tem um aviso escrito nela em letras
grandes contra acrescentar a sétima (_"não volte a chamar `historicoDosMeses`
aqui"_). Remover um mês acontece uma vez a cada muitos meses; o painel abre todo
dia.

Por isso a C2 fez do resumo uma action. O custo é uma espera de um instante
depois do toque — e essa espera é a razão da regra abaixo.

## A regra da espera: o botão vermelho **não existe** enquanto carrega

Não basta desabilitar. Um botão vermelho já desenhado, mesmo cinza, ensina o
polegar onde ele vai estar — e o polegar chega lá antes de os números
aparecerem. Duas etapas existem para que a segunda seja lida; um alvo que aparece
pronto convida a confirmar sem ler.

Então: enquanto o resumo não voltou, existe só a frase _"Vendo o que sairia…"_.
Nada clicável no lugar onde o botão vai nascer.

---

## Arquivos a criar

### `src/features/painel/remover-o-mes/RemoverOMes.tsx` `FRONT-VISUAL` → `FRONT-INTEGRADO`

`"use client"`. Recebe `{ mes }: { mes: string }`.

Estado — três coisas, e cada uma responde a uma pergunta diferente:

```ts
const [resumo, setResumo] = useState<OQueSaiDoMes | null>(null);
const [erro, setErro] = useState<string | null>(null);
const [pedindo, setPedindo] = useState(false); // o resumo está a caminho
const [resultado, agir, apagando] = useActionState(removerMes, null);
```

⚠ **`resumo !== null` é o que abre a confirmação**, e não um quarto booleano.
Um `confirmando: boolean` ao lado do resumo seria dois fatos sobre o mesmo
estado — e o dia em que divergissem seria uma confirmação desenhada sem números.

**D1 entrega o fechado:** a linha _"Este mês entrou errado?"_, o botão
`Remover este mês` e nada mais. Nenhuma chamada, nenhuma confirmação.

**D2 liga:** o toque chama `resumoDaRemocao(mes)`, guarda o resumo ou o erro.

### O que a confirmação mostra, em ordem

1. **O título com o número e o mês** — "Apagar 53 lançamentos de Julho / 2026?".
   Mesma forma do `LinhaDeEnvio`: um "tem certeza?" genérico pede certeza sem
   dar a informação que ela exige.
2. **Os envios**, por nome de arquivo e origem ("extrato.csv · conta").
3. ⚠ **O transbordo, quando houver**, uma linha por mês, do
   `fraseDoTransbordo`. É a única consequência que o Davi não consegue prever
   olhando a tela.
4. **As três coisas que ficam:** as regras aprendidas, a renda declarada do mês
   e os formatos ensinados.
5. **Cancelar** (secundário) e **Remover** (vermelho).

⚠ **O botão final diz "Remover", e o mês está no título acima dele.** O risco 2
da spec pedia o mês no botão; a 360px "Remover julho de 2026" quebra em duas
linhas dentro de um alvo de toque. O mês vai no título — que é o que se lê — e
no `aria-label`, que é o que o leitor de tela anuncia. É a forma que o
`LinhaDeEnvio` já usa.

### Depois do `ok: true`: sair do mês que não existe mais

```ts
router.replace("/dashboard");
```

⚠ **Sem `?mes=`, e é isso que faz funcionar.** A rota cai no padrão, que a fase
A ensinou a ser o mês mais recente com movimento. Navegar para o mês vizinho
"na mão" seria uma segunda regra de qual mês abrir, e ela divergiria da primeira
no dia em que o vizinho também não tivesse movimento.

O `revalidatePath` da C2 já rodou no servidor; a navegação é o que troca a tela.

---

## Arquivos a modificar

### `src/features/painel/painel-do-mes/TelaDoPainel.tsx` `FRONT-VISUAL`

Uma linha, no fim: `<RemoverOMes mes={mes} />` **depois** do parágrafo que leva
à `/categorias`.

⚠ **Depois, e não antes.** O caminho para arrumar categorias é rotineiro e
nasce de olhar os potes; a remoção é rara e destrutiva. O último item da tela é
o que se encontra procurando, não o que se esbarra rolando — e é a mesma razão
pela qual ele não fica junto das abas, onde o dedo passa todo dia.

Nenhuma prop nova na tela. Nenhuma consulta nova na rota.

---

## Caminho feliz, bordas e erros

**Feliz:** toca, lê os dois envios e os 53 lançamentos, confirma, cai no mês
vizinho. A `/upload` perdeu as duas linhas.

**Bordas:**

- **Transbordo** — uma linha a mais na confirmação, com mês e número. O caso
  aprovado na Pendência 1.
- **Mês já removido noutra aba** — a action recusa; a tela mostra a frase e
  **não** abre confirmação nenhuma (a C2 garante isso devolvendo `ok: false`).
- **Último mês da conta** — depois de remover, `dadosDoPainel` devolve `null` e
  a rota mostra o estado vazio que já existe ("Nenhum mês no banco ainda"). Nada
  a fazer, e conferido de propósito.
- **Duplo toque no vermelho** — `loading` desabilita, como no `LinhaDeEnvio`. Se
  ainda assim disparar, a segunda remoção não acha nada e devolve zero.
- **Cancelar** — limpa `resumo` e `erro`; o próximo toque busca de novo, porque
  o mês pode ter mudado nesse meio-tempo.

**Erros:** falha de rede ou de banco vira a frase única da C2. ⚠ Ela é exibida
**dentro** do bloco, sem fechar a confirmação — fechar apagaria a mensagem no
mesmo gesto que a criou.

---

## Verificação

1. `npx vitest run` — ⚠ **sem teste novo**, como na fase C: é componente de
   cliente com sessão, e este projeto não testa `.tsx`. O que valia teste virou
   a B1, que já está sob teste.
2. `npx tsc --noEmit`, `npx eslint .`, `npm run format:check`, `npx next build`.
3. `npx vercel deploy --prod --yes`, e conferir o alias.
4. ⚠ **A conferência do Davi**, e ela é o critério de aceitação da spec:
   **remover um mês e reenviar o arquivo corrigido.** Se o app recusar como
   repetido, a fase C está errada. Mais o pé do painel a 360px, que é a única
   parte que eu não consigo ver.
