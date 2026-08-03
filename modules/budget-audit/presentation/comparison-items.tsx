"use client";

import { useMemo, useState } from "react";
import { Filter, RotateCcw, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  ItemDifference,
  NormalizedSubject,
  SubjectComparison,
} from "../domain/subject";
import { impactLabels, typeLabels } from "./export-report";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

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
      <p>
        {item.quantity} un. · {money.format(item.sellingPrice)}
      </p>
      <p className="text-muted-foreground text-xs">
        Total {money.format(item.totalPrice)} · vendedor{" "}
        {item.sellerIds.join(", ") || "—"}
      </p>
    </div>
  );
}

export function ComparisonItems({
  comparison,
  baseline,
  candidate,
}: {
  comparison: SubjectComparison;
  baseline: NormalizedSubject;
  candidate: NormalizedSubject;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [impact, setImpact] = useState("all");
  const [onlyDifferences, setOnlyDifferences] = useState(true);
  const items = useMemo(
    () =>
      comparison.items.filter((item) => {
        const term = query.trim().toLocaleLowerCase("pt-BR");
        return (
          (!onlyDifferences || item.type !== "unchanged") &&
          (type === "all" || item.type === type) &&
          (impact === "all" || item.impact === impact) &&
          (!term ||
            `${item.skuId} ${item.name}`
              .toLocaleLowerCase("pt-BR")
              .includes(term))
        );
      }),
    [comparison, impact, onlyDifferences, query, type],
  );
  const hasFilters = Boolean(query || type !== "all" || impact !== "all" || !onlyDifferences);

  function clearFilters() {
    setQuery("");
    setType("all");
    setImpact("all");
    setOnlyDifferences(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Produtos e SKUs</CardTitle>
        <CardDescription>
          {items.length} de {comparison.items.length} itens exibidos. A exportação sempre inclui o relatório completo.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_12rem_11rem_auto_auto]">
      <InputGroup className="h-10">
        <InputGroupAddon>
          <Search aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar item ou SKU…"
          aria-label="Buscar item ou SKU"
        />
      </InputGroup>
      <Select
        value={type}
        onValueChange={(value) => setType(value ?? "all")}
      >
        <SelectTrigger className="h-10 w-full" aria-label="Filtrar por tipo de diferença">
          <Filter aria-hidden />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(typeLabels).map(([value, label]) => (
              <SelectItem value={value} key={value}>
                {label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={impact}
        onValueChange={(value) => setImpact(value ?? "all")}
      >
        <SelectTrigger className="h-10 w-full" aria-label="Filtrar por importância">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">Toda importância</SelectItem>
            {Object.entries(impactLabels)
              .filter(([value]) => value !== "none")
              .map(([value, label]) => (
                <SelectItem value={value} key={value}>
                  {label}
                </SelectItem>
              ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <div className="flex h-10 items-center justify-between gap-3 rounded-lg border px-3 text-sm">
        <label htmlFor="only-differences">Só diferenças</label>
        <Switch
          id="only-differences"
          checked={onlyDifferences}
          onCheckedChange={setOnlyDifferences}
        />
      </div>
      <Button type="button" variant="ghost" className="h-10" onClick={clearFilters} disabled={!hasFilters}>
        <RotateCcw data-icon="inline-start" /> Limpar
      </Button>
        </div>

    {items.length ? (
      <>
        <div className="hidden overflow-hidden rounded-xl border lg:block">
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
                  <TableCell className="max-w-64 whitespace-normal">
                    <p className="break-words font-medium">{item.name}</p>
                    <p className="text-muted-foreground break-all text-xs">
                      SKU {item.skuId}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <DifferenceBadge difference={item} />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <ItemValues item={item.baseline} />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <ItemValues item={item.candidate} />
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-semibold tabular-nums",
                      item.financialDelta !== 0 && "text-destructive",
                    )}
                  >
                    {money.format(item.financialDelta)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="grid gap-3 lg:hidden">
          {items.map((item) => (
            <Card key={item.skuId} size="sm">
              <CardHeader>
                <CardTitle className="break-words">{item.name}</CardTitle>
                <CardDescription className="break-all">SKU {item.skuId}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <DifferenceBadge difference={item} />
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-muted-foreground mb-2 text-xs">
                      Base · {baseline.id}
                    </p>
                    <ItemValues item={item.baseline} />
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-muted-foreground mb-2 text-xs">
                      Comparado · {candidate.id}
                    </p>
                    <ItemValues item={item.candidate} />
                  </div>
                </div>
                <p className="text-right font-semibold tabular-nums">
                  Impacto {money.format(item.financialDelta)}
                </p>
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
          <EmptyDescription>
            Ajuste a busca ou os filtros para visualizar outros
            resultados.
          </EmptyDescription>
        </EmptyHeader>
        {hasFilters && <Button type="button" variant="outline" onClick={clearFilters}>Limpar filtros</Button>}
      </Empty>
    )}
      </CardContent>
    </Card>
  );
}
