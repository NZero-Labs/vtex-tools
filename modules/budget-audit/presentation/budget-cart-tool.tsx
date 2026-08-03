"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, ShoppingCart, Trash2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { budgetCartRequestSchema } from "../domain/requests";
import type { NormalizedSubject, SubjectComparison } from "../domain/subject";
import { ComparisonResults } from "./comparison-report";
import type { ComparisonReport } from "./export-report";

type CartResponse = {
  source: "fixture" | "vtex";
  budget: NormalizedSubject;
  cart: NormalizedSubject;
  comparison: SubjectComparison;
};

const auditedItems = [
  "Itens, quantidades e vendedores",
  "Preços, descontos e total",
  "CEP, frete e todos os SLAs",
  "Promoções, tags e peso",
];

export function BudgetCartTool() {
  const [budgetId, setBudgetId] = useState("");
  const [orderForm, setOrderForm] = useState("");
  const [data, setData] = useState<ComparisonReport>();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = budgetCartRequestSchema.safeParse({ budgetId, orderForm });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revise os dados informados");
      return;
    }

    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/budget-cart-comparisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json() as CartResponse | { error: string };
      if (!response.ok || "error" in result) {
        throw new Error("error" in result ? result.error : "Falha na comparação");
      }
      setData({ source: result.source, budgets: [result.budget, result.cart], comparisons: [result.comparison] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível concluir a comparação");
    } finally {
      setPending(false);
    }
  }

  function reset() {
    setData(undefined);
    setError("");
    setBudgetId("");
    setOrderForm("");
  }

  if (data) return <ComparisonResults data={data} onReset={reset} />;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <Card>
        <CardHeader>
          <div className="bg-accent text-accent-foreground mb-4 flex size-12 items-center justify-center rounded-2xl">
            <ShoppingCart className="size-6" aria-hidden />
          </div>
          <Badge variant="outline" className="mb-1 w-fit">Entrada · etapa 1</Badge>
          <CardTitle className="text-2xl">Orçamento e carrinho</CardTitle>
          <CardDescription>O carrinho pode ser informado pelo ID ou por uma URL que contenha o orderFormId.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-5">
            <FieldGroup>
              <Field data-invalid={Boolean(error) || undefined}>
                <FieldLabel htmlFor="budget-id">Orçamento</FieldLabel>
                <Input id="budget-id" value={budgetId} onChange={(event) => setBudgetId(event.target.value)} placeholder="Ex.: DEMO-1001" required autoFocus className="h-11 font-mono" aria-invalid={Boolean(error) || undefined} />
              </Field>
              <Field data-invalid={Boolean(error) || undefined}>
                <FieldLabel htmlFor="order-form">ID ou URL do carrinho</FieldLabel>
                <Input id="order-form" value={orderForm} onChange={(event) => setOrderForm(event.target.value)} placeholder="Ex.: DEMO-CART-1001" required className="h-11 font-mono" aria-invalid={Boolean(error) || undefined} />
              </Field>
            </FieldGroup>
            {error ? (
              <Alert variant="destructive" aria-live="polite">
                <AlertTriangle />
                <AlertTitle>Não foi possível comparar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Separator />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={reset} disabled={pending}><Trash2 data-icon="inline-start" /> Limpar</Button>
              <Button type="submit" disabled={pending}>
                {pending ? <><Spinner data-icon="inline-start" /> Consultando VTEX…</> : <>Comparar com carrinho <ArrowRight data-icon="inline-end" /></>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <aside>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">O que será auditado</CardTitle>
            <CardDescription>Uma leitura única antes de fechar o pedido.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3 text-sm">
              {auditedItems.map((item) => (
                <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
