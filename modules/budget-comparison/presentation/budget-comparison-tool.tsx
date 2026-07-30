"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Download,
  FileDiff,
  FileJson2,
  FileSpreadsheet,
  Filter,
  PackageMinus,
  PackagePlus,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
  budgetRequestSchema,
  type ItemDifference,
} from "../domain/budget-comparison";
import {
  exportFilename,
  impactLabels,
  serializeComparisonCsv,
  serializeComparisonJson,
  type ComparisonReport,
  typeLabels,
} from "./export-report";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const formatMoney = (value: number | null) =>
  value === null ? "Não informado" : money.format(value);

function DifferenceBadge({ difference }: { difference: ItemDifference }) {
  const variant =
    difference.type === "unchanged"
      ? "outline"
      : difference.impact === "critical" || difference.type === "removed"
        ? "destructive"
        : "secondary";

  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant={variant}>{typeLabels[difference.type]}</Badge>
      {difference.impact !== "none" ? (
        <Badge variant="outline">{impactLabels[difference.impact]}</Badge>
      ) : null}
    </div>
  );
}

function ItemValues({ item }: { item: ItemDifference["baseline"] }) {
  if (!item) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="flex flex-col gap-0.5 tabular-nums">
      <p>{item.quantity} un. · {money.format(item.sellingPrice)}</p>
      <p className="text-muted-foreground text-xs">
        Total {money.format(item.totalPrice)} · vendedor {item.sellerIds.join(", ") || "—"}
      </p>
    </div>
  );
}

function downloadReport(data: ComparisonReport, format: "csv" | "json") {
  const date = new Date();
  const content = format === "csv"
    ? serializeComparisonCsv(data)
    : serializeComparisonJson(data, date);
  const blob = new Blob([content], {
    type: format === "csv" ? "text/csv;charset=utf-8" : "application/json;charset=utf-8",
  });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = exportFilename(data, format, date);
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(anchor.href);
  toast.success(`Relatório ${format.toUpperCase()} exportado`);
}

function Results({ data, onReset }: { data: ComparisonReport; onReset: () => void }) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [impact, setImpact] = useState("all");
  const [onlyDifferences, setOnlyDifferences] = useState(true);
  const comparison = data.comparisons[candidateIndex];
  const baseline = data.budgets[0];
  const candidate = data.budgets[candidateIndex + 1];

  const items = useMemo(() => comparison?.items.filter((item) => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return (
      (!onlyDifferences || item.type !== "unchanged")
      && (type === "all" || item.type === type)
      && (impact === "all" || item.impact === impact)
      && (!term || `${item.skuId} ${item.name}`.toLocaleLowerCase("pt-BR").includes(term))
    );
  }) ?? [], [comparison, impact, onlyDifferences, query, type]);

  if (!comparison || !baseline || !candidate) return null;

  const totals = [
    ["Subtotal", baseline.totals.subtotal, candidate.totals.subtotal],
    ["Descontos", baseline.totals.discount, candidate.totals.discount],
    ["Frete", baseline.totals.shipping, candidate.totals.shipping],
    ["Impostos", baseline.totals.tax, candidate.totals.tax],
  ] as const;
  const copyText = `Comparação ${baseline.id} × ${candidate.id}\nDiferença total: ${money.format(comparison.totalDelta)}\nAdicionados: ${comparison.summary.added}; removidos: ${comparison.summary.removed}; alterados: ${comparison.summary.changed}`;

  async function copySummary() {
    await navigator.clipboard.writeText(copyText);
    toast.success("Resumo copiado");
  }

  return (
    <div className="flex animate-in flex-col gap-8 fade-in slide-in-from-bottom-2 duration-500">
      <section className="relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-xl shadow-primary/10 sm:p-7">
        <div aria-hidden className="absolute -top-24 -right-16 size-64 rounded-full border border-primary-foreground/15" />
        <div aria-hidden className="absolute -right-6 -bottom-28 size-52 rounded-full bg-primary-foreground/5" />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold tracking-[0.16em] uppercase opacity-75">Relatório de auditoria</p>
              <h2 className="font-heading text-3xl font-medium sm:text-4xl">
                {baseline.id} <span className="opacity-45">×</span> {candidate.id}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 opacity-75">
                Leitura consolidada de valores, movimentações e divergências por SKU.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={copySummary}>
                <Clipboard data-icon="inline-start" /> Copiar resumo
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="secondary" size="sm" />}>
                  <Download data-icon="inline-start" /> Exportar <ChevronDown data-icon="inline-end" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Relatório completo</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => downloadReport(data, "csv")}>
                      <FileSpreadsheet /> CSV para planilha
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadReport(data, "json")}>
                      <FileJson2 /> JSON estruturado
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="secondary" size="sm" onClick={onReset}>
                <RotateCcw data-icon="inline-start" /> Nova comparação
              </Button>
            </div>
          </div>

          {data.comparisons.length > 1 ? (
            <div className="overflow-x-auto pb-1">
              <ToggleGroup
                value={[String(candidateIndex)]}
                onValueChange={(value) => value[0] && setCandidateIndex(Number(value[0]))}
                variant="outline"
                size="sm"
                className="w-max bg-primary-foreground/10 p-1"
              >
                {data.comparisons.map((item, index) => (
                  <ToggleGroupItem key={item.candidateId} value={String(index)}>
                    Base × {item.candidateId}
                  </ToggleGroupItem>
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.35fr_repeat(3,1fr)]" aria-label="Resumo executivo">
        <Card>
          <CardHeader>
            <CardDescription>Diagnóstico</CardDescription>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <span className={cn("flex size-10 items-center justify-center rounded-full", comparison.hasDifferences ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                {comparison.hasDifferences ? <AlertTriangle className="size-5" /> : <CheckCircle2 className="size-5" />}
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
          <CardFooter>
            <span className="text-muted-foreground text-xs">Candidato menos orçamento base</span>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Itens alterados</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{comparison.summary.changed}</CardTitle>
          </CardHeader>
          <CardFooter>
            <span className="text-muted-foreground text-xs">Preço, quantidade, total ou vendedor</span>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Movimentações</CardDescription>
            <CardTitle className="flex items-center gap-4 text-2xl tabular-nums">
              <span className="flex items-center gap-1.5"><PackagePlus className="text-primary size-5" />+{comparison.summary.added}</span>
              <span className="flex items-center gap-1.5"><PackageMinus className="text-destructive size-5" />−{comparison.summary.removed}</span>
            </CardTitle>
          </CardHeader>
          <CardFooter>
            <span className="text-muted-foreground text-xs">Itens adicionados e removidos</span>
          </CardFooter>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Panorama financeiro</CardTitle>
          <CardDescription>Valores normalizados em reais; o primeiro orçamento permanece como referência.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
            <div className="rounded-2xl bg-muted p-5">
              <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">Base · {baseline.id}</p>
              <p className="mt-2 font-heading text-4xl tabular-nums">{money.format(baseline.totals.total)}</p>
              <p className="text-muted-foreground mt-3 text-sm">Frete: {baseline.shippingType ?? "Não informado"}</p>
            </div>
            <div className="flex items-center justify-center">
              <Badge variant={comparison.totalDelta === 0 ? "outline" : "destructive"}>
                {comparison.totalDelta > 0 ? "+" : ""}{money.format(comparison.totalDelta)}
              </Badge>
            </div>
            <div className="rounded-2xl bg-accent p-5">
              <p className="text-accent-foreground text-xs font-bold tracking-wider uppercase">Comparado · {candidate.id}</p>
              <p className="mt-2 font-heading text-4xl tabular-nums">{money.format(candidate.totals.total)}</p>
              <p className="text-accent-foreground/75 mt-3 text-sm">Frete: {candidate.shippingType ?? "Não informado"}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border">
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
                {totals.map(([label, base, current]) => {
                  const delta = base === null || current === null ? null : current - base;
                  return (
                    <TableRow key={label}>
                      <TableCell className="font-medium">{label}</TableCell>
                      <TableCell className="tabular-nums">{formatMoney(base)}</TableCell>
                      <TableCell className="tabular-nums">{formatMoney(current)}</TableCell>
                      <TableCell className={cn("text-right tabular-nums", delta !== null && delta !== 0 && "text-destructive font-semibold")}>
                        {delta === null ? "—" : money.format(delta)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Produtos e SKUs</CardTitle>
          <CardDescription>{items.length} de {comparison.items.length} itens exibidos. A exportação sempre inclui o relatório completo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_12rem_11rem_auto]">
            <InputGroup className="h-10">
              <InputGroupAddon><Search /></InputGroupAddon>
              <InputGroupInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar item ou SKU…" />
            </InputGroup>
            <Select value={type} onValueChange={(value) => setType(value ?? "all")}>
              <SelectTrigger className="h-10 w-full"><Filter /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(typeLabels).map(([value, label]) => <SelectItem value={value} key={value}>{label}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={impact} onValueChange={(value) => setImpact(value ?? "all")}>
              <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Toda importância</SelectItem>
                  {Object.entries(impactLabels).filter(([value]) => value !== "none").map(([value, label]) => <SelectItem value={value} key={value}>{label}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
            <label className="flex h-10 items-center justify-between gap-3 rounded-lg border px-3 text-sm">
              <span>Só diferenças</span>
              <Switch checked={onlyDifferences} onCheckedChange={setOnlyDifferences} />
            </label>
          </div>

          {items.length ? (
            <>
              <div className="hidden overflow-hidden rounded-xl border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Classificação</TableHead>
                      <TableHead>{baseline.id}</TableHead>
                      <TableHead>{candidate.id}</TableHead>
                      <TableHead className="text-right">Impacto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.skuId}>
                        <TableCell><p className="font-medium">{item.name}</p><p className="text-muted-foreground text-xs">SKU {item.skuId}</p></TableCell>
                        <TableCell><DifferenceBadge difference={item} /></TableCell>
                        <TableCell><ItemValues item={item.baseline} /></TableCell>
                        <TableCell><ItemValues item={item.candidate} /></TableCell>
                        <TableCell className={cn("text-right font-semibold tabular-nums", item.financialDelta !== 0 && "text-destructive")}>{money.format(item.financialDelta)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="grid gap-3 md:hidden">
                {items.map((item) => (
                  <Card key={item.skuId} size="sm">
                    <CardHeader>
                      <CardTitle>{item.name}</CardTitle>
                      <CardDescription>SKU {item.skuId}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <DifferenceBadge difference={item} />
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg bg-muted p-3"><p className="text-muted-foreground mb-2 text-xs">Base · {baseline.id}</p><ItemValues item={item.baseline} /></div>
                        <div className="rounded-lg bg-muted p-3"><p className="text-muted-foreground mb-2 text-xs">Comparado · {candidate.id}</p><ItemValues item={item.candidate} /></div>
                      </div>
                      <p className="text-right font-semibold tabular-nums">Impacto {money.format(item.financialDelta)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon"><Search /></EmptyMedia>
                <EmptyTitle>Nenhum item encontrado</EmptyTitle>
                <EmptyDescription>Ajuste a busca ou os filtros para visualizar outros resultados.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function BudgetComparisonTool() {
  const [budgetIds, setBudgetIds] = useState(["", ""]);
  const [data, setData] = useState<ComparisonReport>();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function update(index: number, value: string) {
    setBudgetIds((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = budgetRequestSchema.safeParse({ budgetIds });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Revise os identificadores");

    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/budget-comparisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(typeof result === "object" && result && "error" in result ? String(result.error) : "Falha na comparação");
      setData(result as ComparisonReport);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível concluir a comparação");
    } finally {
      setPending(false);
    }
  }

  function reset() {
    setData(undefined);
    setError("");
    setBudgetIds(["", ""]);
  }

  if (data) return <Results data={data} onReset={reset} />;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <Card className="shadow-xl shadow-primary/5">
        <CardHeader>
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><FileDiff className="size-6" /></div>
          <CardTitle className="text-2xl">Selecione os orçamentos</CardTitle>
          <CardDescription className="max-w-2xl leading-6">Informe de 2 a 5 identificadores. O primeiro será usado como base em todas as comparações.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-5">
            <FieldGroup>
              {budgetIds.map((budgetId, index) => (
                <Field key={index}>
                  <FieldLabel htmlFor={`budget-${index}`}>{index === 0 ? "Orçamento base" : `Orçamento ${index + 1}`}</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      id={`budget-${index}`}
                      value={budgetId}
                      onChange={(event) => update(index, event.target.value)}
                      placeholder={index === 0 ? "Ex.: 100234" : "Ex.: 100235"}
                      required
                      autoFocus={index === 0}
                      className="h-11 font-mono"
                    />
                    {index > 1 ? (
                      <Button type="button" variant="ghost" size="icon" aria-label={`Remover orçamento ${index + 1}`} onClick={() => setBudgetIds((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                        <X />
                      </Button>
                    ) : null}
                  </div>
                </Field>
              ))}
            </FieldGroup>

            {budgetIds.length < 5 ? (
              <Button type="button" variant="outline" className="self-start" onClick={() => setBudgetIds((current) => [...current, ""])}>
                <Plus data-icon="inline-start" /> Adicionar orçamento
              </Button>
            ) : null}
            {error ? (
              <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível comparar</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
            ) : null}
            <Separator />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={reset} disabled={pending}><Trash2 data-icon="inline-start" /> Limpar</Button>
              <Button type="submit" disabled={pending}>
                {pending ? <><Spinner data-icon="inline-start" /> Consultando VTEX…</> : <>Comparar orçamentos <ArrowRight data-icon="inline-end" /></>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <aside className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leitura completa</CardTitle>
            <CardDescription>O relatório cruza os pontos que mais impactam uma aprovação.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3 text-sm">
              {["Produtos, SKUs e quantidades", "Preços, descontos e totais", "Frete e tipo de entrega", "Vendedores por item"].map((item) => (
                <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Alert>
          <FileSpreadsheet />
          <AlertTitle>Relatório pronto para compartilhar</AlertTitle>
          <AlertDescription>Ao concluir, exporte todos os resultados em CSV ou JSON.</AlertDescription>
        </Alert>
      </aside>

      {pending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:col-span-2 xl:grid-cols-4" aria-label="Carregando comparação">
          {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}
        </div>
      ) : null}
    </div>
  );
}
