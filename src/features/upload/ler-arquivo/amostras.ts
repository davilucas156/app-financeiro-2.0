/**
 * Amostras de extrato para os testes.
 *
 * **São strings em TypeScript e não arquivos `.csv` de propósito.** Extrato de
 * verdade está no `.gitignore` — carrega número de conta, nomes de pessoas e o
 * gasto do mês inteiro. Aqui os valores são inventados, mas o **formato é
 * exato**: separador, aspas, BOM, casas decimais e ordem das colunas foram
 * copiados dos arquivos reais medidos em `references/formatos-de-extrato.md`.
 *
 * Ao encontrar um formato novo, acrescente a amostra aqui antes de escrever o
 * parser. É o que impede o parser de ser escrito no escuro.
 */

/** Banco Inter — extrato de conta corrente. `;`, sem aspas, sem BOM. */
export const EXTRATO_INTER = `Extrato Conta Corrente
Conta ;12345678
Período ;02/06/2026 a 02/07/2026
Saldo: ;665,25

Data Lançamento;Descrição;Valor;Saldo
02/06/2026;Pix recebido: "Cp :12345678-FULANO DE TAL";1.200,00;2.581,55
02/06/2026;Pagamento efetuado: "Pagamento fatura cartao Inter";-318,19;2.263,36
03/06/2026;Pix enviado: "Cp :00000000-Beltrana da Silva";-10,00;2.253,36
`;

/**
 * Banco Inter — fatura do cartão. `,` com todos os campos citados, **com BOM**.
 *
 * O `﻿` no início é o BOM de verdade, escrito de forma visível para não
 * depender de um caractere invisível sobreviver a copiar e colar.
 */
export const FATURA_INTER = `﻿"Data","Lançamento","Categoria","Tipo","Valor"
"27/06/2026","LOJA EXEMPLO           Betim         BRA","TRANSPORTE","Compra à vista","R$ 15,00"
"12/06/2026","OFICINA EXEMPLO        BETIM         BRA","OUTROS","Parcela 1/2","R$ 166,50"
"02/06/2026","PAGAMENTO ON LINE","OUTROS","Compra à vista","-R$ 318,19"
`;

/**
 * Um banco que **não existe**, para a spec 11 (tarefa E1).
 *
 * ⚠ **Esta é a única amostra do arquivo que não foi medida em arquivo real**, e
 * a diferença importa: as duas de cima descrevem formatos que existem e por isso
 * viraram entradas em `FORMATOS`; esta existe para exercitar o caminho de quem
 * **não** está lá.
 *
 * Ela é de propósito o oposto do Inter em tudo que dá:
 *
 * | | Inter (conta) | aqui |
 * |---|---|---|
 * | separador | `;` | `,` |
 * | data | `dd/mm/aaaa` | `aaaa-mm-dd` |
 * | número | `1.200,00` | `1200.00` |
 * | cabeçalho | linha 5 | linha 0 |
 * | nomes de coluna | `Data Lançamento`… | nada que a `reconhecer` conheça |
 *
 * ⚠ **Nomes inventados e nenhum número de conta**, como manda o
 * `references/formatos-de-extrato.md`. Não há dado real de ninguém aqui.
 */
export const EXTRATO_BANCO_INVENTADO = `Fecha_Mov,Historico,Vlr,Saldo_Post
2026-03-04,COMPRA MERCADO CENTRAL,-152.40,3847.60
2026-03-05,TRANSFERENCIA RECEBIDA,1200.00,5047.60
2026-03-11,ASSINATURA MENSAL,-39.90,5007.70
2026-03-18,POSTO DE COMBUSTIVEL,-210.00,4797.70
`;
