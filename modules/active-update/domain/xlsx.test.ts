import { describe, expect, it } from "vitest";

import { parseActiveUpdateCsv } from "./active-update";
import { xlsxToActiveUpdateCsv } from "./xlsx";

// Zip mínimo com entradas sem compressão (method 0); o leitor não confere CRC.
function zip(files: Record<string, string>) {
  const encoder = new TextEncoder();
  const locals: number[] = [];
  const central: number[] = [];
  const u16 = (value: number) => [value & 0xff, value >> 8];
  const u32 = (value: number) => [...u16(value & 0xffff), ...u16(value >>> 16)];
  for (const [name, content] of Object.entries(files)) {
    const nameBytes = [...encoder.encode(name)];
    const data = [...encoder.encode(content)];
    const offset = locals.length;
    locals.push(...u32(0x04034b50), ...u16(20), 0, 0, 0, 0, 0, 0, 0, 0, ...u32(0), ...u32(data.length), ...u32(data.length), ...u16(nameBytes.length), ...u16(0), ...nameBytes, ...data);
    central.push(...u32(0x02014b50), ...u16(20), ...u16(20), 0, 0, 0, 0, 0, 0, 0, 0, ...u32(0), ...u32(data.length), ...u32(data.length), ...u16(nameBytes.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...nameBytes);
  }
  const count = Object.keys(files).length;
  const end = [...u32(0x06054b50), 0, 0, 0, 0, ...u16(count), ...u16(count), ...u32(central.length), ...u32(locals.length), 0, 0];
  return new Uint8Array([...locals, ...central, ...end]);
}

const ns = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

describe("XLSX de atualização de ativo", () => {
  it("mapeia colunas pelo cabeçalho e preserva a numeração das linhas", async () => {
    const bytes = zip({
      "xl/workbook.xml": `<workbook ${ns}><sheets><sheet name="A" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      "xl/_rels/workbook.xml.rels": `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/dados.xml"/></Relationships>`,
      "xl/sharedStrings.xml": `<sst ${ns}><si><t>cnpjDoc</t></si><si><t>email</t></si><si><t>A@X.com</t></si></sst>`,
      "xl/worksheets/dados.xml": `<worksheet ${ns}><sheetData>
        <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>
        <row r="2"><c r="A2"><v>9484190000134</v></c><c r="B2" t="s"><v>2</v></c></row>
        <row r="4"><c r="A4" t="inlineStr"><is><t>2</t></is></c><c r="B4" t="inlineStr"><is><t>b@x.com</t></is></c></row>
      </sheetData></worksheet>`,
    });

    const csv = await xlsxToActiveUpdateCsv(bytes);
    const rows = [];
    for await (const row of parseActiveUpdateCsv((async function* () { yield csv; })())) rows.push(row);

    expect(rows).toEqual([
      { rowNumber: 2, email: "a@x.com", cnpjDoc: "9484190000134" },
      { rowNumber: 4, email: "b@x.com", cnpjDoc: "2" },
    ]);
  });

  it("recusa planilha sem as colunas esperadas", async () => {
    const bytes = zip({
      "xl/worksheets/sheet1.xml": `<worksheet ${ns}><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>nome</t></is></c></row></sheetData></worksheet>`,
    });
    await expect(xlsxToActiveUpdateCsv(bytes)).rejects.toMatchObject({ rowNumber: 1 });
  });
});
