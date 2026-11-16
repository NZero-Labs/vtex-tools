import { CsvValidationError } from "./active-update";

// ponytail: lê o .xlsx inteiro em memória e só a primeira aba; trocar por lib com streaming se planilhas passarem de dezenas de MB.
async function unzip(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  while (end >= 0 && view.getUint32(end, true) !== 0x06054b50) end -= 1;
  if (end < 0) throw new CsvValidationError(1, "arquivo .xlsx inválido");

  const entries = new Map<string, () => Promise<string>>();
  let offset = view.getUint32(end + 16, true);
  for (let index = view.getUint16(end + 10, true); index > 0; index -= 1) {
    const method = view.getUint16(offset + 10, true);
    const size = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const local = view.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    const data = bytes.subarray(start, start + size);
    entries.set(name, () =>
      method === 0
        ? Promise.resolve(new TextDecoder().decode(data))
        : new Response(new Response(data.slice()).body!.pipeThrough(new DecompressionStream("deflate-raw"))).text(),
    );
    offset += 46 + nameLength + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true);
  }
  return entries;
}

const xml = (text: string) => new DOMParser().parseFromString(text, "application/xml");
const all = (node: Document | Element, tag: string) => Array.from(node.getElementsByTagNameNS("*", tag));
const text = (node: Element) => all(node, "t").map((t) => t.textContent ?? "").join("");

async function firstSheet(entries: Map<string, () => Promise<string>>) {
  const workbook = xml(await (entries.get("xl/workbook.xml")?.() ?? Promise.resolve("<x/>")));
  const relId = all(workbook, "sheet")[0]?.getAttributeNS(
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "id",
  );
  const rels = xml(await (entries.get("xl/_rels/workbook.xml.rels")?.() ?? Promise.resolve("<x/>")));
  const target = all(rels, "Relationship")
    .find((rel) => rel.getAttribute("Id") === relId)
    ?.getAttribute("Target");
  const path = target ? (target.startsWith("/") ? target.slice(1) : `xl/${target}`) : "xl/worksheets/sheet1.xml";
  const sheet = entries.get(path);
  if (!sheet) throw new CsvValidationError(1, "planilha não encontrada no .xlsx");
  return xml(await sheet());
}

const columnIndex = (ref: string) =>
  [...ref.replace(/\d/g, "")].reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;

/** Converte a primeira aba de um .xlsx em CSV `email;cnpjDoc`, localizando as colunas pelo cabeçalho. */
export async function xlsxToActiveUpdateCsv(bytes: Uint8Array) {
  const entries = await unzip(bytes);
  const shared = entries.get("xl/sharedStrings.xml");
  const strings = shared ? all(xml(await shared()), "si").map(text) : [];

  const rows: string[][] = [];
  for (const row of all(await firstSheet(entries), "row")) {
    const values: string[] = [];
    for (const cell of all(row, "c")) {
      const ref = cell.getAttribute("r");
      const column = ref ? columnIndex(ref) : values.length;
      const raw = all(cell, "v")[0]?.textContent ?? "";
      const type = cell.getAttribute("t");
      values[column] = (type === "s" ? strings[Number(raw)] ?? "" : type === "inlineStr" ? text(cell) : raw).trim();
    }
    rows[Number(row.getAttribute("r") ?? rows.length + 1) - 1] = values;
  }

  const header = (rows[0] ?? []).map((value) => value?.toLowerCase());
  const email = header.indexOf("email");
  const cnpjDoc = header.indexOf("cnpjdoc");
  if (email < 0 || cnpjDoc < 0) throw new CsvValidationError(1, "cabeçalho esperado: email e cnpjDoc");

  // Linhas vazias viram linhas em branco para manter a numeração igual à do Excel.
  const lines = Array.from(rows.slice(1), (values = []) =>
    values[email] || values[cnpjDoc] ? `${values[email] ?? ""};${values[cnpjDoc] ?? ""}` : "",
  );
  return ["email;cnpjDoc", ...lines].join("\n");
}
