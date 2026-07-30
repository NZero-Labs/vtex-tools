import { asc, eq } from "drizzle-orm";
import { KeyRound } from "lucide-react";

import { FeedbackAlert } from "@/components/feedback-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { toolPermission, user } from "@/lib/db/schema";
import { updateToolPermission } from "@/modules/admin/actions";
import { toolCatalog } from "@/modules/tool-catalog/catalog";

export default async function PermissionsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const params = await searchParams;
  const [users, permissions] = await Promise.all([
    db.select().from(user).where(eq(user.banned, false)).orderBy(asc(user.name)),
    db.select().from(toolPermission),
  ]);
  const access = new Map(permissions.map((item) => [`${item.userId}:${item.toolId}`, item.allowed ? "allow" : "deny"]));

  return <div><p className="text-brand mb-2 text-xs font-bold tracking-[0.16em] uppercase">Autorização</p><h1 className="font-heading text-4xl font-medium">Permissões.</h1><p className="text-muted-foreground mt-3 mb-8">Exceções por usuário. “Herdar” aplica as capacidades normais do papel.</p><FeedbackAlert success={params.success} error={params.error} /><Card><CardHeader><KeyRound className="text-brand mb-2 size-5" /><CardTitle>Acesso por ferramenta</CardTitle><CardDescription>Administradores ainda precisam de disponibilidade global ativa.</CardDescription></CardHeader><CardContent className="space-y-3">{users.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-medium">{item.name}</p><p className="text-muted-foreground text-xs">{item.email} · {item.role}</p></div><div className="space-y-2">{toolCatalog.map((tool) => <form key={tool.id} action={updateToolPermission} className="flex flex-wrap items-center gap-2"><input type="hidden" name="userId" value={item.id} /><input type="hidden" name="toolId" value={tool.id} /><span className="text-sm">{tool.name}</span><select name="access" defaultValue={access.get(`${item.id}:${tool.id}`) ?? "inherit"} className="border-input bg-background h-8 rounded-lg border px-2 text-sm"><option value="inherit">Herdar</option><option value="allow">Permitir</option><option value="deny">Negar</option></select><Button type="submit" size="sm" variant="outline">Salvar</Button></form>)}</div></div>)}{!users.length && <p className="text-muted-foreground py-8 text-center text-sm">Nenhum usuário ativo.</p>}</CardContent></Card></div>;
}
