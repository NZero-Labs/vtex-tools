import { describe, expect, it } from "vitest";

import { maskCnpj, maskEmail, parseActiveUpdateCsv } from "./active-update";

async function* chunks(...values: string[]) {
  for (const value of values) yield value;
}

describe("CSV de atualização de ativo", () => {
  it("lê BOM, CRLF e quebras entre chunks sem carregar o arquivo inteiro", async () => {
    const rows = [];
    for await (const row of parseActiveUpdateCsv(chunks("\uFEFFemail;cnpjDoc\r\na@x.com;00.000", ".000/0001-00\r\nb@x.com;2"))) rows.push(row);

    expect(rows).toEqual([
      { rowNumber: 2, email: "a@x.com", cnpjDoc: "00.000.000/0001-00" },
      { rowNumber: 3, email: "b@x.com", cnpjDoc: "2" },
    ]);
    expect(maskEmail("bernardo@empresa.com")).toBe("b***@empresa.com");
    expect(maskCnpj("12.345.678/0001-42")).toBe("**.***.***/****-42");
  });

  it("informa a linha inválida", async () => {
    const read = async () => {
      for await (const row of parseActiveUpdateCsv(chunks("email;cnpjDoc\nemail-invalido;1")))
        expect(row).toBeDefined();
    };
    await expect(read()).rejects.toMatchObject({ rowNumber: 2 });
  });

  it("ignora e reporta linhas inválidas quando há onSkip", async () => {
    const rows = [];
    const skipped: number[] = [];
    for await (const row of parseActiveUpdateCsv(chunks("email;cnpjDoc\na@x.com;1\nb@x.com;\nc@x.com;3"), (error) => skipped.push(error.rowNumber)))
      rows.push(row.rowNumber);

    expect(rows).toEqual([2, 4]);
    expect(skipped).toEqual([3]);
  });
});
