"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, Clipboard, Download, FileJson2, FileSpreadsheet, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ComparisonContext } from "./comparison-context";
import { ComparisonItems } from "./comparison-items";
import { ComparisonSummary } from "./comparison-summary";
import { exportFilename, serializeComparisonCsv, serializeComparisonJson, type ComparisonReport } from "./export-report";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function downloadReport(data: ComparisonReport, format: "csv" | "json") {
  const date = new Date();
  const content = format === "csv" ? serializeComparisonCsv(data) : serializeComparisonJson(data, date);
  const blob = new Blob([content], { type: format === "csv" ? "text/csv;charset=utf-8" : "application/json;charset=utf-8" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = exportFilename(data, format, date);
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(anchor.href);
  toast.success(`Relatório ${format.toUpperCase()} exportado`);
}

export function ComparisonResults({ data, onReset }: { data: ComparisonReport; onReset: () => void }) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const comparison = data.comparisons[candidateIndex];
  const baseline = data.budgets[0];
  const candidate = data.budgets[candidateIndex + 1];

  if (!comparison || !baseline || !candidate) return null;
  const copyText = `Comparação ${baseline.id} × ${candidate.id}\nDiferença total: ${money.format(comparison.totalDelta)}\nAdicionados: ${comparison.summary.added}; removidos: ${comparison.summary.removed}; alterados: ${comparison.summary.changed}`;

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(copyText);
      toast.success("Resumo copiado");
    } catch {
      toast.error("Não foi possível copiar o resumo");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="bg-sidebar text-sidebar-foreground overflow-hidden rounded-3xl p-5 sm:p-7" aria-labelledby="report-title">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-xs font-bold tracking-[0.14em] uppercase opacity-70">Relatório de auditoria · etapa final</p>
              <h2 id="report-title" className="font-heading break-all text-3xl font-medium sm:text-4xl">
                {baseline.id} <span className="opacity-45">×</span> {candidate.id}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 opacity-70">Leitura consolidada de valores, movimentações e divergências por SKU.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={copySummary}><Clipboard data-icon="inline-start" /> Copiar resumo</Button>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="secondary" size="sm" />}>
                  <Download data-icon="inline-start" /> Exportar <ChevronDown data-icon="inline-end" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Relatório completo</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => downloadReport(data, "csv")}><FileSpreadsheet /> CSV para planilha</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadReport(data, "json")}><FileJson2 /> JSON estruturado</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="secondary" size="sm" onClick={onReset}><RotateCcw data-icon="inline-start" /> Nova comparação</Button>
            </div>
          </div>

          {data.comparisons.length > 1 ? (
            <div className="overflow-x-auto pb-1" aria-label="Selecionar orçamento comparado">
              <ToggleGroup
                value={[String(candidateIndex)]}
                onValueChange={(value) => value[0] && setCandidateIndex(Number(value[0]))}
                variant="outline"
                size="sm"
                className="w-max"
              >
                {data.comparisons.map((item, index) => (
                  <ToggleGroupItem key={item.candidateId} value={String(index)}>Base × {item.candidateId}</ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          ) : null}
        </div>
      </section>

      {data.source === "fixture" ? (
        <Alert>
          <AlertTriangle />
          <AlertTitle>Dados de demonstração</AlertTitle>
          <AlertDescription>Esta comparação usa fixtures locais; nenhuma consulta real foi feita à VTEX.</AlertDescription>
        </Alert>
      ) : null}

      {comparison.warnings.map((warning) => (
        <Alert key={warning} variant="destructive">
          <AlertTriangle />
          <AlertTitle>Atenção aos dados parciais</AlertTitle>
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      ))}

      <ComparisonSummary comparison={comparison} baseline={baseline} candidate={candidate} />
      <ComparisonContext comparison={comparison} baseline={baseline} candidate={candidate} />
      <ComparisonItems comparison={comparison} baseline={baseline} candidate={candidate} />
    </div>
  );
}
