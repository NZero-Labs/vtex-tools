import { z } from "zod";

export const ACTIVE_UPDATE_TOOL_ID = "active-update";
export const UPLOAD_BATCH_SIZE = 500;
export const PROCESS_BATCH_SIZE = 5;
export const MAX_ATTEMPTS = 3;
export const HISTORY_PAGE_SIZE = 20;

export const activeUpdateRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  email: z.email("E-mail inválido").max(254, "E-mail muito longo").transform((value) => value.toLowerCase()),
  cnpjDoc: z.string().trim().min(1, "CNPJ ausente").max(64, "CNPJ muito longo"),
});

export type ActiveUpdateRow = z.infer<typeof activeUpdateRowSchema>;

export type ActiveUpdateJobDto = {
  id: string;
  fileName: string;
  status: "uploading" | "ready" | "running" | "paused" | "completed" | "failed";
  totalCount: number;
  processedCount: number;
  pendingCount: number;
  updatedCount: number;
  unchangedCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  ownerName: string | null;
  canControl: boolean;
};

export type ActiveUpdateJobDetailsDto = ActiveUpdateJobDto & {
  items: Array<{
    rowNumber: number;
    email: string;
    cnpjDoc: string;
    status: "updated" | "unchanged" | "failed";
    message: string | null;
    updatedAt: string;
  }>;
};

export const createActiveUpdateJobSchema = z.object({
  fileName: z.string().trim().min(1, "Nome do arquivo ausente").max(255, "Nome do arquivo muito longo"),
});

export const appendActiveUpdateItemsSchema = z.object({
  rows: z.array(activeUpdateRowSchema).min(1).max(UPLOAD_BATCH_SIZE),
});

export const activeUpdateJobActionSchema = z.object({
  action: z.enum(["finish-upload", "fail-upload", "pause", "resume"]),
  message: z.string().trim().max(500).optional(),
});

export const activeUpdateHistoryQuerySchema = z.object({
  ownerId: z.string().trim().max(128).optional(),
  page: z.coerce.number().int().min(0).max(10_000).default(0),
});

export class CsvValidationError extends Error {
  constructor(readonly rowNumber: number, message: string) {
    super(`Linha ${rowNumber}: ${message}`);
    this.name = "CsvValidationError";
  }
}

function parseLine(line: string, rowNumber: number): ActiveUpdateRow | null {
  if (!line.trim()) return null;
  const columns = line.split(";");
  if (columns.length !== 2) throw new CsvValidationError(rowNumber, "esperadas exatamente as colunas email e cnpjDoc");

  const parsed = activeUpdateRowSchema.safeParse({
    rowNumber,
    email: columns[0]?.trim(),
    cnpjDoc: columns[1]?.trim(),
  });
  if (!parsed.success) throw new CsvValidationError(rowNumber, parsed.error.issues[0]?.message ?? "registro inválido");
  return parsed.data;
}

export async function* parseActiveUpdateCsv(chunks: AsyncIterable<string>): AsyncGenerator<ActiveUpdateRow> {
  let buffer = "";
  let rowNumber = 0;
  let headerRead = false;

  const readLine = (rawLine: string) => {
    rowNumber += 1;
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
    if (!headerRead) {
      headerRead = true;
      const header = line.replace(/^\uFEFF/, "").split(";").map((column) => column.trim());
      if (header.length !== 2 || header[0] !== "email" || header[1] !== "cnpjDoc") {
        throw new CsvValidationError(1, "cabeçalho esperado: email;cnpjDoc");
      }
      return null;
    }
    return parseLine(line, rowNumber);
  };

  for await (const chunk of chunks) {
    buffer += chunk;
    let newline = buffer.indexOf("\n");
    while (newline >= 0) {
      const row = readLine(buffer.slice(0, newline));
      buffer = buffer.slice(newline + 1);
      if (row) yield row;
      newline = buffer.indexOf("\n");
    }
  }

  if (buffer) {
    const row = readLine(buffer);
    if (row) yield row;
  }
  if (!headerRead) throw new CsvValidationError(1, "arquivo vazio");
}

export function maskEmail(email: string) {
  const [local = "", domain = ""] = email.split("@", 2);
  return `${local.slice(0, 1) || "*"}***@${domain || "***"}`;
}

export function maskCnpj(cnpj: string) {
  const digits = cnpj.replaceAll(/\D/g, "");
  return `**.***.***/****-${digits.slice(-2).padStart(2, "*")}`;
}
