"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, ArrowRight, ShoppingCart, Trash2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
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
  comparisonId: string;
};

export function BudgetCartTool() {
  const router = useRouter();
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
      router.push(`/ferramentas/auditoria-orcamentos/historico/${result.comparisonId}`);
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
          <Badge variant="outline" className="mb-1 w-fit">Passo 1 de 2</Badge>
          <CardTitle className="text-2xl">Confira o carrinho</CardTitle>
          <CardDescription>Informe o orçamento e o carrinho que deseja conferir.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-5">
            <FieldGroup>
              <Field data-invalid={Boolean(error) || undefined}>
                <FieldLabel htmlFor="budget-id">Orçamento de referência</FieldLabel>
                <FieldDescription>É com ele que o carrinho será comparado.</FieldDescription>
                <Input id="budget-id" value={budgetId} onChange={(event) => setBudgetId(event.target.value)} placeholder="Digite o número do orçamento" required autoFocus className="h-11 font-mono" aria-invalid={Boolean(error) || undefined} />
              </Field>
              <Field data-invalid={Boolean(error) || undefined}>
                <FieldLabel htmlFor="order-form">Carrinho atual</FieldLabel>
                <FieldDescription>Cole o ID ou a URL completa do carrinho VTEX.</FieldDescription>
                <Input id="order-form" value={orderForm} onChange={(event) => setOrderForm(event.target.value)} placeholder="Cole o ID ou a URL do carrinho" required className="h-11 font-mono" aria-invalid={Boolean(error) || undefined} />
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
                {pending ? <><Spinner data-icon="inline-start" /> Consultando carrinho…</> : <>Ver diferenças <ArrowRight data-icon="inline-end" /></>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <aside>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Como funciona</CardTitle>
            <CardDescription>Você verá só o que precisa revisar.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3 text-sm">
              {[
                ["1", "Escolha o orçamento de referência"],
                ["2", "Informe o carrinho atual"],
                ["3", "Revise as diferenças encontradas"],
              ].map(([step, item]) => (
                <li key={step} className="flex gap-3"><span className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">{step}</span><span>{item}</span></li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
