import "server-only";

import { getActiveUpdateExportRows } from "../data";
import { csvCell } from "../domain/export-active-update";

export { activeUpdateExportFilename } from "../domain/export-active-update";

const csvHeaders = ["linha", "email", "cnpjDoc", "status", "codigo", "motivo", "tentativas", "processadoEm"];

function exportRow(row: Awaited<ReturnType<typeof getActiveUpdateExportRows>>[number]) {
  return {
    rowNumber: row.rowNumber,
    email: row.email,
    cnpjDoc: row.cnpjDoc,
    status: row.status,
    code: row.code,
    message: row.message,
    attempts: row.attempts,
    processedAt: row.processedAt?.toISOString() ?? null,
  };
}

export function createActiveUpdateExportStream(input: {
  id: string;
  fileName: string;
  status: string;
  createdAt: Date;
}, format: "csv" | "json") {
  const encoder = new TextEncoder();
  let afterRow = 0;
  let started = false;
  let finished = false;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (!started) {
        started = true;
        const prefix = format === "csv"
          ? `\uFEFF${csvHeaders.join(";")}\r\n`
          : `${JSON.stringify({ job: { id: input.id, fileName: input.fileName, status: input.status, createdAt: input.createdAt.toISOString() } }).slice(0, -1)},"items":[`;
        controller.enqueue(encoder.encode(prefix));
      }

      const rows = await getActiveUpdateExportRows(input.id, afterRow);
      if (!rows.length) {
        if (!finished && format === "json") controller.enqueue(encoder.encode("]}"));
        finished = true;
        controller.close();
        return;
      }

      const content = format === "csv"
        ? `${rows.map((row) => [row.rowNumber, row.email, row.cnpjDoc, row.status, row.code, row.message, row.attempts, row.processedAt?.toISOString()].map(csvCell).join(";")).join("\r\n")}\r\n`
        : `${afterRow === 0 ? "" : ","}${rows.map((row) => JSON.stringify(exportRow(row))).join(",")}`;
      afterRow = rows.at(-1)?.rowNumber ?? afterRow;
      controller.enqueue(encoder.encode(content));
    },
  });
}
