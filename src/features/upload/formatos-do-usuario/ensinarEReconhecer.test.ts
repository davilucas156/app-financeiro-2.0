import { describe, expect, it } from "vitest";
import {
  EXTRATO_BANCO_INVENTADO,
  EXTRATO_INTER,
  FATURA_INTER,
} from "@/features/upload/ler-arquivo/amostras";
import { decodificar, paraGrade } from "@/features/upload/ler-arquivo/grade";
import { paraLancamentos } from "@/features/upload/ler-arquivo/lancamentos";
import { palpitar } from "@/features/upload/ler-arquivo/palpite";
import { previaDoMapeamento } from "@/features/upload/ler-arquivo/previa";
import { reconhecer } from "@/features/upload/ler-arquivo/reconhecer";
import { comoFormato, validarMapeamento } from "./formatoDoUsuario";

/**
 * O ciclo inteiro, num banco que não existe (spec 11, tarefa E1).
 *
 * ⚠ **É o teste que responde "a spec funciona?".** Cada fase provou a sua peça;
 * este liga as quatro na ordem em que uma pessoa as usa:
 *
 * 1. o arquivo **não** é reconhecido — é por isso que ela vai ensinar;
 * 2. o palpite propõe um mapeamento sozinho;
 * 3. o mapeamento vira um formato salvo;
 * 4. no envio seguinte, o mesmo arquivo é reconhecido **sem perguntar nada**.
 *
 * O passo 4 é o que dissolve a bifurcação que travava esta spec: medir cada
 * banco e mapear no app são a mesma operação, e o que a pessoa mapeia **vira**
 * medição — para ela.
 */

const bytes = (texto: string) => new TextEncoder().encode(texto);

function ensinar(amostra: string) {
  const texto = decodificar(bytes(amostra));

  const palpite = palpitar(texto);
  if (!palpite) throw new Error("o palpite falhou");

  const cabecalho = paraGrade(texto, palpite.dialeto)[palpite.linhaCabecalho];

  const validado = validarMapeamento(
    {
      ...palpite,
      nome: "Extrato do Banco Inventado",
      banco: "Banco Inventado",
    },
    cabecalho,
  );
  if (!validado.ok) throw new Error(validado.erro);

  return comoFormato("id-de-teste", validado.mapeamento);
}

describe("o ciclo de ensinar um banco novo", () => {
  it("1. o arquivo não é reconhecido por nenhum formato de código", () => {
    const r = reconhecer(bytes(EXTRATO_BANCO_INVENTADO));

    expect(r.ok).toBe(false);
    expect(!r.ok && r.motivo).toBe("desconhecido");
  });

  it("2. o palpite acerta o dialeto que não é o do Inter", () => {
    const p = palpitar(decodificar(bytes(EXTRATO_BANCO_INVENTADO)))!;

    expect(p.dialeto).toEqual({ separador: ",", aspas: false });
    expect(p.formatoData).toBe("aaaa-mm-dd");
    expect(p.formatoNumero).toBe("en-US");
    expect(p.origem).toBe("csv_conta");
  });

  /*
   * ⚠ **A conferência independente, e ela existe porque o arquivo trouxe saldo.**
   * A régua do `references/formatos-de-extrato.md`: somar o que o próprio parser
   * leu não prova nada. Aqui o saldo do banco é a testemunha.
   */
  it("3. a prévia fecha com a coluna de saldo do próprio arquivo", () => {
    const texto = decodificar(bytes(EXTRATO_BANCO_INVENTADO));
    const previa = previaDoMapeamento(texto, palpitar(texto)!);

    expect(previa.lancamentos).toBe(4);
    expect(previa.saldo).not.toBeNull();
    expect(previa.saldo!.batem).toBe(previa.saldo!.transicoes);
    expect(previa.saiuCentavos).toBe(15240 + 3990 + 21000);
    expect(previa.entrouCentavos).toBe(120000);
  });

  it("4. salvo, ele passa a reconhecer o mesmo arquivo sozinho", () => {
    const formato = ensinar(EXTRATO_BANCO_INVENTADO);

    const r = reconhecer(bytes(EXTRATO_BANCO_INVENTADO), [formato]);

    expect(r.ok).toBe(true);
    expect(r.ok && r.formato.id).toBe("id-de-teste");
    expect(r.ok && r.formato.banco).toBe("Banco Inventado");
  });

  it("5. e o import de verdade lê os mesmos números da prévia", () => {
    const texto = decodificar(bytes(EXTRATO_BANCO_INVENTADO));
    const formato = ensinar(EXTRATO_BANCO_INVENTADO);

    const oficial = reconhecer(bytes(EXTRATO_BANCO_INVENTADO), [formato]);
    if (!oficial.ok) throw new Error("devia reconhecer");

    const doImport = paraLancamentos(oficial);
    const daPrevia = previaDoMapeamento(texto, palpitar(texto)!);

    expect(doImport.lancamentos.length).toBe(daPrevia.lancamentos);
    expect(doImport.ignoradas).toHaveLength(0);

    const saiu = doImport.lancamentos
      .filter((l) => l.direcao === "saida")
      .reduce((s, l) => s + l.valorCentavos, 0);

    expect(saiu).toBe(daPrevia.saiuCentavos);
  });

  /*
   * ⚠ **A data lida é a prova de que o dialeto atravessou até o fim.** Com a
   * régua do Inter (`dd/mm/aaaa`), `2026-03-04` não seria lida e a linha viraria
   * "ignorada". Com a certa, ela vira 4 de março.
   */
  it("6. as datas em ISO chegam certas ao lançamento", () => {
    const formato = ensinar(EXTRATO_BANCO_INVENTADO);
    const oficial = reconhecer(bytes(EXTRATO_BANCO_INVENTADO), [formato]);
    if (!oficial.ok) throw new Error("devia reconhecer");

    expect(paraLancamentos(oficial).lancamentos[0].data).toBe("2026-03-04");
  });
});

describe("o caminho rápido não some por existir o caminho lento", () => {
  it("os arquivos do Inter continuam sendo lidos pelos formatos de código", () => {
    const doUsuario = [ensinar(EXTRATO_BANCO_INVENTADO)];

    const extrato = reconhecer(bytes(EXTRATO_INTER), doUsuario);
    const fatura = reconhecer(bytes(FATURA_INTER), doUsuario);

    expect(extrato.ok && extrato.formato.id).toBe("inter-extrato");
    expect(fatura.ok && fatura.formato.id).toBe("inter-fatura");
  });

  /*
   * ⚠ **A regra de desempate da pendência 5, exercitada.** Um formato do
   * usuário que casa com o extrato do Inter ganha dele: quem ensinou por último
   * ensinou sabendo do que já existia, e o app não tem por que discordar.
   */
  it("no empate, o formato do usuário ganha do de código", () => {
    const texto = decodificar(bytes(EXTRATO_INTER));
    const palpite = palpitar(texto)!;
    const cabecalho = paraGrade(texto, palpite.dialeto)[palpite.linhaCabecalho];

    const validado = validarMapeamento(
      {
        ...palpite,
        nome: "Meu jeito de ler o Inter",
        banco: "Inter, do meu jeito",
      },
      cabecalho,
    );
    if (!validado.ok) throw new Error(validado.erro);

    const meu = comoFormato("o-meu", validado.mapeamento);
    const r = reconhecer(bytes(EXTRATO_INTER), [meu]);

    expect(r.ok && r.formato.id).toBe("o-meu");
  });
});
