"use client";

import { useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileDiff,
  FileSpreadsheet,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { budgetRequestSchema } from "../domain/requests";
import { ComparisonResults } from "./comparison-report";
import type { ComparisonReport } from "./export-report";

export function BudgetComparisonTool() {
  const [budgetIds, setBudgetIds] = useState(["", ""]);
  const [data, setData] = useState<ComparisonReport>();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function update(index: number, value: string) {
    setBudgetIds((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = budgetRequestSchema.safeParse({ budgetIds });
    if (!parsed.success)
      return setError(
        parsed.error.issues[0]?.message ?? "Revise os identificadores",
      );

    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/budget-comparisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          typeof result === "object" && result && "error" in result
            ? String(result.error)
            : "Falha na comparação",
        );
      setData(result as ComparisonReport);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível concluir a comparação",
      );
    } finally {
      setPending(false);
    }
  }

  function reset() {
    setData(undefined);
    setError("");
    setBudgetIds(["", ""]);
  }

  if (data) return <ComparisonResults data={data} onReset={reset} />;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <Card>
        <CardHeader>
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <FileDiff className="size-6" aria-hidden />
          </div>
          <Badge variant="outline" className="mb-1 w-fit">Entrada · etapa 1</Badge>
          <CardTitle className="text-2xl">Selecione os orçamentos</CardTitle>
          <CardDescription className="max-w-2xl leading-6">
            Informe de 2 a 5 identificadores. O primeiro será usado como base em
            todas as comparações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-5">
            <FieldGroup>
              {budgetIds.map((budgetId, index) => (
                <Field key={index}>
                  <FieldLabel htmlFor={`budget-${index}`}>
                    {index === 0 ? "Orçamento base" : `Orçamento ${index + 1}`}
                  </FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      id={`budget-${index}`}
                      value={budgetId}
                      onChange={(event) => update(index, event.target.value)}
                      placeholder={index === 0 ? "Ex.: 100234" : "Ex.: 100235"}
                      required
                      autoFocus={index === 0}
                      className="h-11 min-w-0 font-mono"
                      aria-invalid={Boolean(error) || undefined}
                    />
                    {index > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remover orçamento ${index + 1}`}
                        onClick={() =>
                          setBudgetIds((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      >
                        <X />
                      </Button>
                    ) : null}
                  </div>
                </Field>
              ))}
            </FieldGroup>

            {budgetIds.length < 5 ? (
              <Button
                type="button"
                variant="outline"
                className="self-start"
                onClick={() => setBudgetIds((current) => [...current, ""])}
              >
                <Plus data-icon="inline-start" /> Adicionar orçamento
              </Button>
            ) : null}
            {error ? (
                <Alert variant="destructive" aria-live="polite">
                <AlertTriangle />
                <AlertTitle>Não foi possível comparar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Separator />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={reset}
                disabled={pending}
              >
                <Trash2 data-icon="inline-start" /> Limpar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <>
                    <Spinner data-icon="inline-start" /> Consultando VTEX…
                  </>
                ) : (
                  <>
                    Comparar orçamentos <ArrowRight data-icon="inline-end" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <aside className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leitura completa</CardTitle>
            <CardDescription>
              O relatório cruza os pontos que mais impactam uma aprovação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3 text-sm">
              {[
                "Produtos, SKUs e quantidades",
                "Preços, descontos e totais",
                "Frete, CEP e SLAs",
                "Promoções, tags, peso e vendedores",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Alert>
          <FileSpreadsheet />
          <AlertTitle>Relatório pronto para compartilhar</AlertTitle>
          <AlertDescription>
            Ao concluir, exporte todos os resultados em CSV ou JSON.
          </AlertDescription>
        </Alert>
      </aside>

      {pending ? (
        <div
          className="grid gap-4 sm:grid-cols-2 xl:col-span-2 xl:grid-cols-4"
          aria-label="Carregando comparação"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : null}
    </div>
  );
}
