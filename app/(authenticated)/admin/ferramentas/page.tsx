import { FileDiff } from "lucide-react";

import { PageHeader } from "@/components/authenticated/page-header";
import { ConfirmForm } from "@/components/confirm-form";
import { FeedbackAlert } from "@/components/feedback-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateToolStatus } from "@/modules/admin/actions";
import { getToolStatuses } from "@/modules/admin/read-models";
import { toolCatalog, type ToolStatus } from "@/modules/tool-catalog/catalog";

const statusLabels: Record<ToolStatus, string> = {
  available: "Disponível",
  beta: "Beta",
  maintenance: "Manutenção",
  "coming-soon": "Em breve",
};

export default async function AdminToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const current = await getToolStatuses();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Catálogo central"
        title="Ferramentas"
        description="Controle a disponibilidade sem duplicar metadados nas telas."
      />
      <FeedbackAlert success={params.success} error={params.error} />

      <div className="grid gap-4 lg:grid-cols-2">
        {toolCatalog.map((tool) => {
          const status = (current.get(tool.id) ?? tool.defaultStatus) as ToolStatus;

          return (
            <Card key={tool.id}>
              <CardHeader>
                <div className="bg-accent text-accent-foreground mb-3 flex size-10 items-center justify-center rounded-xl">
                  <FileDiff className="size-5" aria-hidden />
                </div>
                <CardTitle className="text-xl">{tool.name}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{tool.category}</Badge>
                  <Badge variant={status === "maintenance" ? "destructive" : "secondary"}>{statusLabels[status]}</Badge>
                </div>
                <ConfirmForm
                  action={updateToolStatus}
                  message="Alterar a disponibilidade impacta todos os usuários. Continuar?"
                  className="grid gap-2 sm:grid-cols-[minmax(9rem,1fr)_auto]"
                >
                  <input type="hidden" name="toolId" value={tool.id} />
                  <label className="sr-only" htmlFor={`status-${tool.id}`}>Disponibilidade de {tool.name}</label>
                  <select id={`status-${tool.id}`} name="status" defaultValue={status} className="border-input bg-background h-10 rounded-lg border px-3 text-sm">
                    <option value="available">Disponível</option>
                    <option value="beta">Beta</option>
                    <option value="maintenance">Manutenção</option>
                    <option value="coming-soon">Em breve</option>
                  </select>
                  <Button type="submit">Atualizar</Button>
                </ConfirmForm>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
