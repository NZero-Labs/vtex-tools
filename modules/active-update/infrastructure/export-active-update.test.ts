import { describe, expect, it } from "vitest";

import { activeUpdateExportFilename, csvCell } from "../domain/export-active-update";

describe("exportação da atualização", () => {
  it("escapa CSV e normaliza o nome do arquivo", () => {
    expect(csvCell('falha; motivo "x"')).toBe('"falha; motivo ""x"""');
    expect(activeUpdateExportFilename("Planilha ativa.csv", "json")).toBe("Planilha-ativa-atualizar-ativo.json");
  });
});
