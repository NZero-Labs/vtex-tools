import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, Minus, PackageMinus, PackagePlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { subjectDisplayName, type NormalizedSubject, type SubjectComparison } from "../domain/subject";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatMoney = (value: number | null) => value === null ? "Não informado" : money.format(value);

export function ComparisonSummary({
  comparison,
  baseline,
  candidate,
}: {
  comparison: SubjectComparison;
  baseline: NormalizedSubject;
  candidate: NormalizedSubject;
}) {
  const baselineLabel = subjectDisplayName(baseline, "base");
  const candidateLabel = subjectDisplayName(candidate, "comparison");
  const differentItems = comparison.summary.added + comparison.summary.removed + comparison.summary.changed;
  const DeltaIcon = comparison.totalDelta > 0 ? ArrowUpRight : comparison.totalDelta < 0 ? ArrowDownRight : Minus;
  const deltaLabel = comparison.totalDelta > 0 ? "Aumento no total" : comparison.totalDelta < 0 ? "Redução no total" : "Sem diferença no total";

  return (
    <>
      <section aria-label="Resumo executivo">
        <Card className="overflow-hidden">
          <CardContent className="grid gap-px bg-border p-0 sm:grid-cols-2 lg:grid-cols-[1.35fr_repeat(3,1fr)]">
            <div className={cn("bg-card border-l-4 p-5 sm:p-6", comparison.hasDifferences ? "border-destructive" : "border-primary")}>
              <CardDescription>Resultado da comparação</CardDescription>
              <CardTitle className="mt-2 flex items-center gap-3 text-xl">
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", comparison.hasDifferences ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                  {comparison.hasDifferences ? <AlertTriangle className="size-5" aria-hidden /> : <CheckCircle2 className="size-5" aria-hidden />}
                </span>
                {comparison.hasDifferences ? "Há diferenças para revisar" : "Nenhuma diferença encontrada"}
              </CardTitle>
              <p className="text-muted-foreground mt-2 text-sm leading-5">
                {comparison.hasDifferences ? `${differentItems} item(ns) ou informação(ões) precisam de atenção.` : "Os dois lados estão equivalentes nos dados consultados."}
              </p>
            </div>

            <div className="bg-card p-5 sm:p-6">
              <CardDescription>{deltaLabel}</CardDescription>
              <CardTitle className={cn("mt-2 flex items-center gap-2 text-2xl tabular-nums", comparison.totalDelta > 0 ? "text-destructive" : comparison.totalDelta < 0 && "text-primary")}>
                <DeltaIcon className="size-5" aria-hidden />
                {money.format(comparison.totalDelta)}
              </CardTitle>
              <p className="text-muted-foreground mt-2 text-xs">Comparado menos referência</p>
            </div>

            <div className="bg-card p-5 sm:p-6">
              <CardDescription>Itens diferentes</CardDescription>
              <CardTitle className="mt-2 text-2xl tabular-nums">{differentItems}</CardTitle>
              <p className="text-muted-foreground mt-2 text-xs">Adicionados, removidos ou alterados</p>
            </div>

            <div className="bg-card p-5 sm:p-6">
              <CardDescription>Movimentações</CardDescription>
              <CardTitle className="mt-2 flex items-center gap-4 text-xl tabular-nums">
                <span className="flex items-center gap-1.5"><PackagePlus className="text-primary size-5" aria-hidden />+{comparison.summary.added}</span>
                <span className="flex items-center gap-1.5"><PackageMinus className="text-destructive size-5" aria-hidden />−{comparison.summary.removed}</span>
              </CardTitle>
              <p className="text-muted-foreground mt-2 text-xs">Itens que entraram ou saíram</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Total da comparação</CardTitle>
          <CardDescription>Veja o total de cada lado e a diferença entre eles.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
            <div className="bg-muted rounded-2xl p-5">
              <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">{baselineLabel}</p>
              <p className="mt-2 font-heading text-3xl tabular-nums sm:text-4xl">{money.format(baseline.totals.total)}</p>
              <p className="text-muted-foreground mt-3 text-sm">Frete: {baseline.shipping.slas.join(", ") || "Não informado"}</p>
            </div>
            <div className="flex items-center justify-center">
              <Badge variant={comparison.totalDelta === 0 ? "outline" : "destructive"}>
                {comparison.totalDelta > 0 ? "+" : ""}{money.format(comparison.totalDelta)}
              </Badge>
            </div>
            <div className="bg-accent rounded-2xl p-5">
              <p className="text-accent-foreground text-xs font-bold tracking-wider uppercase">{candidateLabel}</p>
              <p className="mt-2 font-heading text-3xl tabular-nums sm:text-4xl">{money.format(candidate.totals.total)}</p>
              <p className="text-accent-foreground/75 mt-3 text-sm">Frete: {candidate.shipping.slas.join(", ") || "Não informado"}</p>
            </div>
          </div>

          <div className="hidden overflow-x-auto rounded-xl border xl:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Composição</TableHead>
                  <TableHead>{baselineLabel}</TableHead>
                  <TableHead>{candidateLabel}</TableHead>
                  <TableHead className="text-right">Diferença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparison.priceBreakdown.map(({ key, label, baseline: base, candidate: current, delta }) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{label}</TableCell>
                    <TableCell className="tabular-nums">{formatMoney(base)}</TableCell>
                    <TableCell className="tabular-nums">{formatMoney(current)}</TableCell>
                    <TableCell className={cn("text-right tabular-nums", delta !== null && delta !== 0 && "text-destructive font-semibold")}>
                      {delta === null ? "—" : money.format(delta)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <dl className="grid gap-3 xl:hidden">
            {comparison.priceBreakdown.map(({ key, label, baseline: base, candidate: current, delta }) => (
              <div key={key} className="rounded-xl border p-4">
                <dt className="font-medium">{label}</dt>
                <dd className="text-muted-foreground mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <span>{baselineLabel}: <strong className="text-foreground">{formatMoney(base)}</strong></span>
                  <span>{candidateLabel}: <strong className="text-foreground">{formatMoney(current)}</strong></span>
                </dd>
                <dd className={cn("mt-2 text-sm font-semibold tabular-nums", delta !== null && delta !== 0 && "text-destructive")}>
                  Diferença: {delta === null ? "Não informada" : money.format(delta)}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </>
  );
}
