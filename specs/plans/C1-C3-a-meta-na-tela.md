# Plano — C1 a C3, a meta na tela

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** C1 (o percentual no cabeçalho), C2 (o campo), C3 (a soma e o aviso)
**Spec:** `specs/13-metas-por-pote.md`

⚠ **Escrito durante a execução, e não antes dela.** As decisões abaixo foram
tomadas ao abrir cada arquivo — o documento as registra como foram tomadas, com
os desvios no lugar. Nas fases A e B o plano veio antes; aqui não veio, e dizer
isso custa menos que fingir o contrário.

---

## A restrição que decidiu o desenho: o cabeçalho já é um botão

`PoteRecolhivel` desenha o cabeçalho do pote como um `<button>` que abre e
fecha. **Botão dentro de botão não existe** — nem em HTML válido, nem para quem
navega por teclado ou leitor de tela.

Isso parte a tarefa em duas metades naturais:

| Onde | O quê |
| ---- | ----- |
| No cabeçalho (fechado) | o percentual, **só leitura**: `30%` ou `sem meta` |
| Dentro do pote (aberto) | o campo que edita, antes das categorias |

E resolve sozinho a pergunta de ordem: a meta é do **pote**, as categorias são o
que há **dentro** dele. A meta vem primeiro.

---

## Arquivos criados

### `definir-meta/CampoDeMeta.tsx` `FRONT-INTEGRADO`

O gesto é o do `CampoDeRenda`: tocar no número abre o editor, salvar fecha.

⚠ **Não é economia de código — é economia de aprendizado.** As duas coisas que
definem uma meta são a **renda** e o **rateio**. Editadas do mesmo jeito, elas
parecem a mesma ideia, que é o que são.

Três decisões dentro dele:

1. **`inputMode="numeric"`, não `"decimal"`.** O `CampoDeRenda` usa `decimal`
   porque dinheiro tem vírgula. Percentual aqui é inteiro — o teclado não deve
   nem **oferecer** a vírgula que `lerPercentual` vai recusar.
2. **A prévia muda enquanto se digita**, e é onde a pessoa descobre que apagar
   tem consequência — *antes* de apagar: _"Vazio tira a meta: este pote sai do
   julgamento"_.
3. ⚠ **A frase do retroativo está na prévia, não num rodapé:** _"vale para
   todos os meses, inclusive os já importados"_. Quem está prestes a salvar é
   quem precisa saber.

O botão de salvar fica desabilitado enquanto `lerPercentual` recusa — a mesma
função que o servidor vai chamar. O cliente responde rápido; o servidor grava.

### `definir-meta/ResumoDasMetas.tsx` `FRONT-VISUAL`

A linha da soma e o aviso da renda. Sem estado, sem ação.

---

## Arquivos modificados

### `gerir-categorias/TelaDeCategorias.tsx`

- O badge no cabeçalho, **só em pote de gasto**. ⚠ No pote de renda um "sem
  meta" leria como falta, e não como o que é: ele é o que entra, não o que se
  reparte.
- `<CampoDeMeta>` dentro do pote aberto, também só em pote de gasto.
- `<ResumoDasMetas>` depois da lista de potes.
- ⚠ **O rodapé mentia a partir desta spec.** Ele dizia _"os potes são a espinha
  do método **e os percentuais somam 100%** — criar um mexe no rateio de todos
  os outros"_. Somar 100 deixou de ser propriedade garantida no minuto em que o
  usuário pôde editar. A frase agora aponta para onde se mexe.
- **`truncate` no `<h2>` do pote.** O cabeçalho ganhou um elemento; sem isso, um
  nome longo cresce a linha em vez de ceder. É a única mudança de layout que
  fiz sem enxergar o resultado — ver os riscos.

### `app/(app)/categorias/page.tsx`

Passa a ler `rendaDoMes(usuario.id, mesAtual())`, em `Promise.all` com a
consulta que já existia.

⚠ **É uma consulta a mais nesta tela**, e a spec prometia não acrescentar
nenhuma. A promessa era sobre a **meta** — e continua de pé: a meta não custou
consulta nenhuma. Esta é do aviso, e paga por si: sem renda declarada,
`metaDoPote` devolve `null` para todo pote, e o percentual fica lá, correto e
invisível. Sem a frase, a conclusão de quem salvou é que o app não salvou.

A tela **não recebe o valor** da renda — só `temRenda: boolean`. Quem não
precisa do número não deve carregá-lo.

### `lib/mes.ts` — `mesAtual()`

Novo, com `hoje` injetável. ⚠ **UTC, e não hora local**, como o resto do
arquivo: o mês é um rótulo, não um instante.

`mesesDisponiveis` (upload) tem a mesma formatação por dentro e **não foi
unificada**: ela varre 18 meses para trás e este devolve um. Juntar as duas
criaria um helper de deslocamento para servir a um caso só.

### `lib/mes.test.ts` — novo

O primeiro teste do arquivo, e ele existe por uma razão: as outras funções de lá
traduzem texto em texto e erram visivelmente. `mesAtual` **lê um relógio**, e
ler o fuso errado dá o mês certo em quase todo dia do ano — o erro aparece só na
virada, uma vez por mês, para quem estiver do lado errado do meridiano.

---

## ⚠ Riscos que eu não consigo conferir

As três telas precisam da sessão do Clerk do Davi. O que ele precisa olhar:

1. **O cabeçalho do pote a 360px.** Ele agora tem: bolinha, emoji + nome,
   `30%`, `4 categorias`, e a seta. São cinco coisas numa linha de 360px, e o
   `truncate` que acrescentei faz o **nome** ser o que cede. Se ficar apertado,
   a saída é o badge sumir no cabeçalho e viver só dentro do pote.
2. **`sem meta` é mais longo que `30%`** — oito caracteres contra três. Os dois
   potes que o mostram (Manutenção e Outros) são o pior caso da linha.
3. **O campo dentro do pote aberto** empurra as categorias para baixo. Em pote
   com muitas categorias isso é irrelevante; em pote com uma, a meta pode
   parecer mais importante que o conteúdo.

---

## Como saber que a fase C ficou pronta

1. ✅ `npm test` (653), `tsc`, `lint`, `format:check` e `next build` limpos.
2. Mudar um percentual e ver a barra do painel mudar **sem novo upload**.
3. Apagar o campo e ver o pote sair do julgamento — mostrando texto, não "0%".
4. Somar mais de 100 e ver a linha avisar, **sem impedir o salvamento**.
5. Numa conta sem renda declarada, ver o aviso âmbar.
