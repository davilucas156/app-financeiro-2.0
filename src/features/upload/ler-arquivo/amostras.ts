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
