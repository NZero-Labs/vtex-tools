import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { NormalizedSubject, SubjectComparison } from "../domain/subject";

export function ComparisonContext({
  comparison,
  baseline,
  candidate,
}: {
  comparison: SubjectComparison;
  baseline: NormalizedSubject;
  candidate: NormalizedSubject;
}) {
  const shippingChanged = comparison.shipping.postalCodeChanged || comparison.shipping.deliveryTypesChanged || comparison.shipping.slasChanged;

  return (
    <section className="grid gap-4 lg:grid-cols-3" aria-label="Logística, promoções e peso">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Entrega</CardTitle>
          <CardDescription>CEP, SLAs e canais selecionados</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p><span className="text-muted-foreground">Base:</span> {baseline.shipping.postalCode ?? "CEP não informado"} · {baseline.shipping.slas.join(", ") || "SLA não informado"}</p>
          <p><span className="text-muted-foreground">Comparado:</span> {candidate.shipping.postalCode ?? "CEP não informado"} · {candidate.shipping.slas.join(", ") || "SLA não informado"}</p>
          <Badge className="w-fit" variant={shippingChanged ? "destructive" : "outline"}>{shippingChanged ? "Logística divergente" : "Logística alinhada"}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Promoções e tags</CardTitle>
          <CardDescription>Benefícios e segmentações de marketing</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p>{comparison.promotions.length ? `${comparison.promotions.filter((item) => item.status !== "unchanged").length} de ${comparison.promotions.length} promoções divergentes` : "Nenhuma promoção informada"}</p>
          <div className="flex flex-wrap gap-1.5">
            {comparison.marketingTags.added.map((tag) => <Badge key={`add-${tag}`} variant="secondary">Adicionada · {tag}</Badge>)}
            {comparison.marketingTags.removed.map((tag) => <Badge key={`remove-${tag}`} variant="destructive">Removida · {tag}</Badge>)}
            {!comparison.marketingTags.added.length && !comparison.marketingTags.removed.length ? <Badge variant="outline">Tags alinhadas</Badge> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Peso conhecido</CardTitle>
          <CardDescription>Somatório dos SKUs encontrados no catálogo</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {comparison.weight ? (
            <dl className="grid gap-2">
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Base</dt><dd className="font-semibold tabular-nums">{comparison.weight.baselineTotalKg.toLocaleString("pt-BR")} kg</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Comparado</dt><dd className="font-semibold tabular-nums">{comparison.weight.candidateTotalKg.toLocaleString("pt-BR")} kg</dd></div>
              <div className="flex justify-between gap-4 border-t pt-2"><dt className="text-muted-foreground">Diferença</dt><dd className="text-right font-semibold tabular-nums">{comparison.weight.deltaKg === null ? "Dados parciais" : `${comparison.weight.deltaKg.toLocaleString("pt-BR")} kg`}</dd></div>
            </dl>
          ) : <p className="text-muted-foreground">Peso não consultado.</p>}
        </CardContent>
      </Card>
    </section>
  );
}
