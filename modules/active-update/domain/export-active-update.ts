export function csvCell(value: unknown) {
  if (value == null) return "";
  const text = String(value);
  return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function activeUpdateExportFilename(fileName: string, format: "csv" | "json") {
  const base = fileName.replace(/\.csv$/i, "").replaceAll(/[^a-zA-Z0-9_-]/g, "-").replaceAll(/-+/g, "-").slice(0, 80) || "resultado";
  return `${base}-atualizar-ativo.${format}`;
}
