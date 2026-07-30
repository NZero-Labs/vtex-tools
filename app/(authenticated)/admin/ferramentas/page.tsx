import { FileDiff } from "lucide-react";

import { ConfirmForm } from "@/components/confirm-form";
import { FeedbackAlert } from "@/components/feedback-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { toolState } from "@/lib/db/schema";
import { updateToolStatus } from "@/modules/admin/actions";
import { toolCatalog } from "@/modules/tool-catalog/catalog";

export default async function AdminToolsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const params = await searchParams;
  const states = await db.select().from(toolState);
  const current = new Map(states.map((state) => [state.toolId, state.status]));

  return <div><p className="text-brand mb-2 text-xs font-bold tracking-[0.16em] uppercase">Catálogo central</p><h1 className="font-heading text-4xl font-medium">Ferramentas.</h1><p className="text-muted-foreground mt-3 mb-8">Controle a disponibilidade sem duplicar metadados nas telas.</p><FeedbackAlert success={params.success} error={params.error} /><div className="grid gap-5">{toolCatalog.map((tool) => { const status = current.get(tool.id) ?? tool.defaultStatus; return <Card key={tool.id}><CardHeader><div className="bg-accent text-accent-foreground mb-3 flex size-10 items-center justify-center rounded-xl"><FileDiff className="size-5" /></div><CardTitle className="text-xl">{tool.name}</CardTitle><CardDescription>{tool.description}</CardDescription></CardHeader><CardContent className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><Badge variant="outline">{tool.category}</Badge><Badge variant={status === "maintenance" ? "destructive" : "secondary"}>{status}</Badge></div><ConfirmForm action={updateToolStatus} message="Alterar a disponibilidade impacta todos os usuários. Continuar?" className="flex gap-2"><input type="hidden" name="toolId" value={tool.id} /><select name="status" defaultValue={status} className="border-input bg-background h-8 rounded-lg border px-3 text-sm"><option value="available">Disponível</option><option value="beta">Beta</option><option value="maintenance">Manutenção</option><option value="coming-soon">Em breve</option></select><Button type="submit" size="sm">Atualizar</Button></ConfirmForm></CardContent></Card>; })}</div></div>;
}
