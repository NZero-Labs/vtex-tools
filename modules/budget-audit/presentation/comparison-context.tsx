import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { subjectDisplayName, type NormalizedSubject, type SubjectComparison } from "../domain/subject";

function getFreightType(subject: Pick<NormalizedSubject, "shipping">) {
  const fob = subject.shipping.slas.filter((sla) => sla.toUpperCase().includes("FOB"));
  if (fob.length) return fob.join(" / ");
  return subject.shipping.slas.some((sla) => sla.toUpperCase().includes("CIF"))
    ? "CIF"
    : "Não informado";
}

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
  const baselineLabel = subjectDisplayName(baseline, "base");
  const candidateLabel = subjectDisplayName(candidate, "comparison");

  const changedPromotions = comparison.promotions.filter((item) => item.status !== "unchanged").length;

  return (
    <section aria-labelledby="context-title">
      <Card>
        <CardHeader>
          <CardTitle id="context-title" className="text-2xl">Outros pontos conferidos</CardTitle>
          <CardDescription>Informações que podem explicar uma diferença no resultado.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 pt-0 md:grid-cols-2 xl:grid-cols-3">
          <div className="pt-1 xl:border-r xl:pr-6">
            <h3 className="font-medium">Entrega</h3>
            <p className="text-muted-foreground mt-1 text-sm">CEP, tipo de frete, prazo e canal selecionados</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">{baselineLabel} · Tipo de frete:</span>
                <span className="font-medium break-words">{getFreightType(baseline)}</span>
              </div>
              <p><span className="text-muted-foreground">{baselineLabel} · CEP:</span> {baseline.shipping.postalCode ?? "CEP não informado"} · <span className="text-muted-foreground">SLA:</span> {baseline.shipping.slas.join(", ") || "SLA não informado"}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">{candidateLabel} · Tipo de frete:</span>
                <span className="font-medium break-words">{getFreightType(candidate)}</span>
              </div>
              <p><span className="text-muted-foreground">{candidateLabel} · CEP:</span> {candidate.shipping.postalCode ?? "CEP não informado"} · <span className="text-muted-foreground">SLA:</span> {candidate.shipping.slas.join(", ") || "SLA não informado"}</p>
              <Badge className="w-fit" variant={shippingChanged ? "destructive" : "outline"}>{shippingChanged ? "Entrega diferente" : "Entrega igual"}</Badge>
            </div>
          </div>

          <div className="pt-1 md:border-l md:pl-6 xl:border-l-0 xl:border-r xl:px-6 xl:pl-0">
            <h3 className="font-medium">Promoções e tags</h3>
            <p className="text-muted-foreground mt-1 text-sm">Benefícios aplicados em cada lado</p>
            <div className="mt-3 flex flex-col gap-3 text-sm">
              <p>{comparison.promotions.length ? `${changedPromotions} de ${comparison.promotions.length} promoções diferentes` : "Nenhuma promoção informada"}</p>
              <div className="flex flex-wrap gap-1.5">
                {comparison.marketingTags.added.map((tag) => <Badge key={`add-${tag}`} variant="secondary">Adicionada · {tag}</Badge>)}
                {comparison.marketingTags.removed.map((tag) => <Badge key={`remove-${tag}`} variant="destructive">Removida · {tag}</Badge>)}
                {!comparison.marketingTags.added.length && !comparison.marketingTags.removed.length ? <Badge variant="outline">Tags iguais</Badge> : null}
              </div>
            </div>
          </div>

          <div className="pt-1 md:col-span-2 md:border-t md:pt-6 xl:col-span-1 xl:border-t-0 xl:pl-6 xl:pt-1">
            <h3 className="font-medium">Peso conhecido</h3>
            <p className="text-muted-foreground mt-1 text-sm">Peso dos produtos encontrados no catálogo</p>
            <div className="mt-3 text-sm">
              {comparison.weight ? (
                <dl className="grid gap-2">
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{baselineLabel}</dt><dd className="font-semibold tabular-nums">{comparison.weight.baselineTotalKg.toLocaleString("pt-BR")} kg</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{candidateLabel}</dt><dd className="font-semibold tabular-nums">{comparison.weight.candidateTotalKg.toLocaleString("pt-BR")} kg</dd></div>
                  <div className="flex justify-between gap-4 border-t pt-2"><dt className="text-muted-foreground">Diferença</dt><dd className="text-right font-semibold tabular-nums">{comparison.weight.deltaKg === null ? "Dados parciais" : `${comparison.weight.deltaKg.toLocaleString("pt-BR")} kg`}</dd></div>
                </dl>
              ) : <p className="text-muted-foreground">Peso não consultado.</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
