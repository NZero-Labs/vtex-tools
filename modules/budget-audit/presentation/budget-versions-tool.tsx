"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, Clock3, History, RotateCcw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { NormalizedSubject, SubjectComparison } from "../domain/subject";
import { ComparisonResults } from "./comparison-report";
import type { ComparisonReport } from "./export-report";

type Version = { id: string; author: string; date: string | null };
type VersionList = { budgetId: string; currentUpdatedAt: string | null; versions: Version[] };
type VersionComparison = {
  source: "fixture" | "vtex";
  current: NormalizedSubject;
  version: NormalizedSubject;
  comparison: SubjectComparison;
  versionMetadata: Version;
};

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" });

function formatDate(value: string | null) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? dateTime.format(date) : "Data não informada";
}

export function BudgetVersionsTool() {
  const [budgetId, setBudgetId] = useState("");
  const [list, setList] = useState<VersionList>();
  const [data, setData] = useState<ComparisonReport>();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function post(body: object) {
    const response = await fetch("/api/budget-versions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json() as Record<string, unknown>;
    if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Falha ao consultar versões");
    return result;
  }

  async function findVersions(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!budgetId.trim()) {
      setError("Informe o identificador do orçamento");
      return;
    }
    setPending(true);
    setError("");
    try {
      setList(await post({ action: "list", budgetId: budgetId.trim() }) as VersionList);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível consultar as versões");
    } finally {
      setPending(false);
    }
  }

  async function compare(versionId: string) {
    setPending(true);
    setError("");
    try {
      const result = await post({ action: "compare", budgetId: budgetId.trim(), versionId }) as VersionComparison;
      setData({ source: result.source, budgets: [result.current, result.version], comparisons: [result.comparison] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível comparar a versão");
    } finally {
      setPending(false);
    }
  }

  function resetSearch() {
    setList(undefined);
    setBudgetId("");
    setError("");
  }

  if (data) return <ComparisonResults data={data} onReset={() => setData(undefined)} />;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="bg-accent text-accent-foreground mb-4 flex size-12 items-center justify-center rounded-2xl"><History className="size-6" aria-hidden /></div>
          <Badge variant="outline" className="mb-1 w-fit">Entrada · etapa 1</Badge>
          <CardTitle className="text-2xl">Histórico do orçamento</CardTitle>
          <CardDescription>Busque pelo identificador público; o documento interno é resolvido somente no servidor.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={findVersions} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <Field data-invalid={Boolean(error) || undefined}>
              <FieldLabel htmlFor="version-budget">Orçamento atual</FieldLabel>
              <Input id="version-budget" value={budgetId} onChange={(event) => setBudgetId(event.target.value)} placeholder="Ex.: DEMO-1001" required autoFocus className="h-11 font-mono" aria-invalid={Boolean(error) || undefined} />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={pending}>{pending ? <><Spinner data-icon="inline-start" /> Consultando…</> : <>Listar versões <ArrowRight data-icon="inline-end" /></>}</Button>
              {list ? <Button type="button" variant="ghost" onClick={resetSearch}><RotateCcw data-icon="inline-start" /> Outro orçamento</Button> : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive" aria-live="polite">
          <AlertTriangle />
          <AlertTitle>Não foi possível continuar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {list ? list.versions.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Versões encontradas">
          {list.versions.map((version) => (
            <Card key={version.id}>
              <CardHeader>
                <CardTitle className="break-all text-lg">Versão {version.id}</CardTitle>
                <CardDescription>{version.author}</CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground flex items-center gap-2 text-sm"><Clock3 className="size-4" aria-hidden />{formatDate(version.date)}</CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => compare(version.id)} disabled={pending}>
                  {pending ? <Spinner data-icon="inline-start" /> : <History data-icon="inline-start" />} Comparar com a atual
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><History /></EmptyMedia>
            <EmptyTitle>Nenhuma versão encontrada</EmptyTitle>
            <EmptyDescription>Este orçamento ainda não possui histórico disponível no Master Data.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
    </div>
  );
}
