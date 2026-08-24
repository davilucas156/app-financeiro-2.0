# Plano — A1, A2 e A3 · As decisões puras de categoria

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** A1, A2 e A3 de `specs/05-categorias-do-usuario.tarefas.md`
**Camada:** BACK (puro — sem banco, sem sessão, sem tela)
**Arquivos:** `features/categorias/nomear-categoria/{slug,validar}.ts`,
`features/categorias/apagar-categoria/aviso.ts`, mais os testes

## Por que as três juntas

A1 e A2 são **uma regra só vista de dois lados**: o nome exige um caractere
alfanumérico *porque* o slug sai dele e não pode nascer vazio. Planejar em
separado convidaria a implementar a validação sem saber por que ela existe.

A3 é irmã delas no formato — pura, testada, num `.ts` — e é a única das três que
não tem nada a ver com as outras. Vai junto porque é pequena e porque as três
formam o portão da fase B: com elas prontas, o servidor não precisa inventar
texto nenhum.

## A1 — o slug

`slugificar(nome)` normaliza NFD, tira acento, baixa a caixa, troca o que não é
`[a-z0-9]` por hífen, colapsa repetidos e apara as pontas. É o mesmo formato dos
slugs do seed (`reserva-de-emergencia`), e tem de ser: eles convivem na mesma
coluna e no mesmo único.

`slugUnico(nome, jaUsados)` é a função que justifica o arquivo. `(bucket_id,
slug)` é único, e **nomes diferentes geram o mesmo slug**: "Café" e "Cafe" caem
os dois em `cafe`.

Recusar seria incompreensível — os nomes são diferentes e a pessoa está olhando
para os dois. O sufixo numérico resolve sem explicação nenhuma, porque **ninguém
vê o slug**. Essa é a propriedade que autoriza a solução: um dado invisível pode
ganhar um `-2` sem dever satisfação a quem está na tela.

### Nome vazio de letras não passa daqui

`slugificar("###")` devolve `""`, e vazio colide com todo outro vazio. A A2
impede que isso chegue — mas `slugUnico` ainda assim cai para `categoria` em vez
de devolver string vazia.

Não é redundância decorativa: é a diferença entre um chamador futuro que esqueceu
de validar produzir um slug feio e produzir um slug **que colide com todos os
outros nomes não validados**. O primeiro se conserta; o segundo vira suporte.

## A2 — nome e emoji

`validarCategoria({ nome, emoji })` devolve os valores **limpos** ou o campo e a
mensagem do erro. Uma chamada, dois lados: o formulário mostra a mensagem, o
serviço da B1 recusa antes de tocar no banco.

Devolver limpo importa tanto quanto recusar. `"Gasolina  "` gravado com o espaço
não colidiria com `"Gasolina"` no único de nome, e o Davi ficaria com duas
categorias que a tela mostra idênticas.

**Nome:** 1 a 40 caracteres depois de aparar, e pelo menos um alfanumérico. 40
porque o maior do seed tem 21 ("Reserva de emergência") e a linha do painel
mostra nome e valor lado a lado em 360px.

**Emoji:** exatamente um grafema, e não uma letra nem um dígito.

`Intl.Segmenter` e não `.length`, porque `.length` conta unidades de código:
👨‍👩‍👧 tem 8 e é um símbolo só. Um teste de comprimento recusaria emojis
legítimos e aceitaria `"ab"` disfarçado — erraria nos dois sentidos.

## A3 — o aviso de apagar

É a dívida que o `schema.ts` nomeou na C1 — *"quem deve o aviso é a tela"* —
virando código.

`avisoDeApagar({ lancamentos, regras }, destino)` devolve **duas partes**:

```ts
{ frase: string; alerta: string | null }
```

Separadas porque a tela as trata diferente: a frase é o que vai acontecer, o
alerta é o que pode surpreender. Concatenar as duas num texto só faria o alerta
herdar a cor da frase e desaparecer dentro dela — e um alerta que não se destaca
não é um alerta, é comprimento.

### As situações, e o que cada uma precisa dizer

| Situação | Frase |
|---|---|
| Nada dentro | "Nada está usando esta categoria." Sem números zerados: um "0 lançamentos e 0 regras" numa frase de susto gasta a atenção que o aviso de verdade vai precisar |
| Mover | Os N vão para lá — **e as R regras vão junto**, passando a mandar para o destino |
| Devolver à revisão | Os N voltam para a fila sem categoria — **e as R regras são apagadas**, porque regra sem destino não tem para onde apontar |

E o alerta, só quando existe:

**Destino em outro pote.** É a descoberta 4 entrando por outra porta. A spec
proíbe mover a *categoria* com lançamentos dentro; mandar os lançamentos para
uma categoria de outro pote faz o mesmo estrago — muda o rateio de **todos os
meses**, não só do atual. Não é proibido, é escolha legítima. Mas é dito.

⚠ **O alerta só aparece se houver lançamento para mover.** Mandar zero
lançamentos para outro pote não move dinheiro nenhum, e avisar sobre um estrago
que não vai acontecer ensina a ignorar o aviso.

### Singular e plural

"1 lançamentos" é o tipo de detalhe que faz uma tela parecer descuidada
justamente no momento em que ela precisa ser levada a sério. Está no teste.

## O que fica de fora

**Contar do banco.** Quem conta é a B3. Aqui entram números já contados — é o
que mantém as três funções testáveis sem Neon e sem mock.

**Traduzir o `23505`.** É da B1 e da B2, onde o erro nasce.

## Pronto quando

- `slugificar` produz o mesmo formato dos slugs do seed, e `slugUnico` resolve
  colisão com sufixo;
- nome e emoji são validados e devolvidos limpos, com a mensagem da tela;
- o aviso cobre nada-dentro, mover, devolver e destino em outro pote, no
  singular e no plural;
- `npm test`, `tsc` e `eslint` limpos.
