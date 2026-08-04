"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ChevronDown, Clipboard, Download, FileJson2, FileSpreadsheet, LayoutDashboard, ListChecks, Link2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { subjectDisplayName } from "../domain/subject";
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

export function ComparisonResults({ data, onReset, comparisonId }: { data: ComparisonReport; onReset?: () => void; comparisonId?: string }) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const comparison = data.comparisons[candidateIndex];
  const baseline = data.budgets[0];
  const candidate = data.budgets[candidateIndex + 1];

  if (!comparison || !baseline || !candidate) return null;
  const baselineLabel = subjectDisplayName(baseline, "base");
  const candidateLabel = subjectDisplayName(candidate, "comparison");
  const copyText = `${baselineLabel} × ${candidateLabel}\nDiferença total: ${money.format(comparison.totalDelta)}\nAdicionados: ${comparison.summary.added}; removidos: ${comparison.summary.removed}; alterados: ${comparison.summary.changed}`;

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(copyText);
      toast.success("Resumo copiado");
    } catch {
      toast.error("Não foi possível copiar o resumo");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link da comparação copiado");
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6 sm:gap-8">
      <section className="bg-sidebar text-sidebar-foreground overflow-hidden rounded-2xl p-4 sm:rounded-3xl sm:p-7" aria-labelledby="report-title">
        <div className="flex flex-col gap-6">
          <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-xs font-bold tracking-[0.14em] uppercase opacity-70">Relatório de auditoria · etapa final</p>
              <h2 id="report-title" className="font-heading text-3xl font-medium text-balance sm:text-4xl">
                {baselineLabel} <span className="opacity-45">×</span> {candidateLabel}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 opacity-70">Veja os valores, itens e pontos que precisam de atenção.</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              <Button variant="secondary" size="sm" className="min-h-10 sm:min-h-9" onClick={copySummary}><Clipboard data-icon="inline-start" /> Copiar resumo</Button>
              {comparisonId ? <Button variant="secondary" size="sm" className="min-h-10 sm:min-h-9" onClick={copyLink}><Link2 data-icon="inline-start" /> Copiar link</Button> : null}
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="secondary" size="sm" className="min-h-10 w-full sm:min-h-9 sm:w-auto" />}>
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
              {onReset ? <Button variant="secondary" size="sm" className="min-h-10 sm:min-h-9" onClick={onReset}><RotateCcw data-icon="inline-start" /> Nova comparação</Button> : <Link href="/ferramentas/auditoria-orcamentos" className={buttonVariants({ variant: "secondary", size: "sm", className: "min-h-10 sm:min-h-9" })}><RotateCcw data-icon="inline-start" /> Nova comparação</Link>}
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
                  <ToggleGroupItem key={item.candidateId} value={String(index)}>Orçamento {index + 2}</ToggleGroupItem>
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

      {comparison.warnings.length ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Alguns dados estão incompletos</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {comparison.warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="summary" className="min-w-0 gap-5">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-xl p-1 sm:w-fit">
          <TabsTrigger value="summary" className="min-h-11 flex-1 gap-2 px-4 sm:flex-none"><LayoutDashboard data-icon="inline-start" /> Resumo geral</TabsTrigger>
          <TabsTrigger value="items" className="min-h-11 flex-1 gap-2 px-4 sm:flex-none"><ListChecks data-icon="inline-start" /> Itens e diferenças</TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="flex min-w-0 flex-col gap-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
          <ComparisonSummary comparison={comparison} baseline={baseline} candidate={candidate} />
          <ComparisonContext comparison={comparison} baseline={baseline} candidate={candidate} />
        </TabsContent>
        <TabsContent value="items" className="mt-0 min-w-0 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
          <ComparisonItems comparison={comparison} baseline={baseline} candidate={candidate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
