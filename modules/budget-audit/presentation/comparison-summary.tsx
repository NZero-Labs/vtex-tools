import { AlertTriangle, CheckCircle2, PackageMinus, PackagePlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { NormalizedSubject, SubjectComparison } from "../domain/subject";

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
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.35fr_repeat(3,1fr)]" aria-label="Resumo executivo">
        <Card>
          <CardHeader>
            <CardDescription>Diagnóstico</CardDescription>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", comparison.hasDifferences ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                {comparison.hasDifferences ? <AlertTriangle className="size-5" aria-hidden /> : <CheckCircle2 className="size-5" aria-hidden />}
              </span>
              {comparison.hasDifferences ? "Há divergências" : "Orçamentos equivalentes"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-6">
              {comparison.hasDifferences
                ? "Revise os itens classificados abaixo antes de aprovar este orçamento."
                : "Nenhuma alteração financeira ou de item foi localizada."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Diferença total</CardDescription>
            <CardTitle className={cn("text-3xl tabular-nums", comparison.totalDelta !== 0 && "text-destructive")}>
              {money.format(comparison.totalDelta)}
            </CardTitle>
          </CardHeader>
          <CardFooter><span className="text-muted-foreground text-xs">Candidato menos orçamento base</span></CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Itens alterados</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{comparison.summary.changed}</CardTitle>
          </CardHeader>
          <CardFooter><span className="text-muted-foreground text-xs">Preço, quantidade, total ou vendedor</span></CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Movimentações</CardDescription>
            <CardTitle className="flex items-center gap-4 text-2xl tabular-nums">
              <span className="flex items-center gap-1.5"><PackagePlus className="text-primary size-5" aria-hidden />+{comparison.summary.added}</span>
              <span className="flex items-center gap-1.5"><PackageMinus className="text-destructive size-5" aria-hidden />−{comparison.summary.removed}</span>
            </CardTitle>
          </CardHeader>
          <CardFooter><span className="text-muted-foreground text-xs">Itens adicionados e removidos</span></CardFooter>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Panorama financeiro</CardTitle>
          <CardDescription>Valores normalizados em reais; o primeiro orçamento permanece como referência.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
            <div className="bg-muted rounded-2xl p-5">
              <p className="text-muted-foreground break-all text-xs font-bold tracking-wider uppercase">Base · {baseline.id}</p>
              <p className="mt-2 font-heading text-3xl tabular-nums sm:text-4xl">{money.format(baseline.totals.total)}</p>
              <p className="text-muted-foreground mt-3 text-sm">Frete: {baseline.shipping.slas.join(", ") || "Não informado"}</p>
            </div>
            <div className="flex items-center justify-center">
              <Badge variant={comparison.totalDelta === 0 ? "outline" : "destructive"}>
                {comparison.totalDelta > 0 ? "+" : ""}{money.format(comparison.totalDelta)}
              </Badge>
            </div>
            <div className="bg-accent rounded-2xl p-5">
              <p className="text-accent-foreground break-all text-xs font-bold tracking-wider uppercase">Comparado · {candidate.id}</p>
              <p className="mt-2 font-heading text-3xl tabular-nums sm:text-4xl">{money.format(candidate.totals.total)}</p>
              <p className="text-accent-foreground/75 mt-3 text-sm">Frete: {candidate.shipping.slas.join(", ") || "Não informado"}</p>
            </div>
          </div>

          <div className="hidden overflow-hidden rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Composição</TableHead>
                  <TableHead>{baseline.id}</TableHead>
                  <TableHead>{candidate.id}</TableHead>
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

          <dl className="grid gap-3 md:hidden">
            {comparison.priceBreakdown.map(({ key, label, baseline: base, candidate: current, delta }) => (
              <div key={key} className="rounded-xl border p-4">
                <dt className="font-medium">{label}</dt>
                <dd className="text-muted-foreground mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <span>Base: <strong className="text-foreground">{formatMoney(base)}</strong></span>
                  <span>Comparado: <strong className="text-foreground">{formatMoney(current)}</strong></span>
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
