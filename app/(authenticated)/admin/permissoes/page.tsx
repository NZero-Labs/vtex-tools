import { KeyRound } from "lucide-react";

import { PageHeader } from "@/components/authenticated/page-header";
import { FeedbackAlert } from "@/components/feedback-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { updateToolPermission } from "@/modules/admin/actions";
import { getPermissionMatrix } from "@/modules/admin/read-models";
import { toolCatalog } from "@/modules/tool-catalog/catalog";

export default async function PermissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { users, access } = await getPermissionMatrix();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Autorização"
        title="Permissões"
        description="Defina exceções por usuário. Herdar mantém as capacidades normais do papel."
      />
      <FeedbackAlert success={params.success} error={params.error} />

      {users.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription className="break-all">
                  {user.email} · {user.role === "ADMIN" ? "Administrador" : user.role === "VISITOR" ? "Visitante" : "Colaborador"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {toolCatalog.map((tool) => {
                  const fieldId = `access-${user.id}-${tool.id}`;

                  return (
                    <form key={tool.id} action={updateToolPermission} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-center">
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="toolId" value={tool.id} />
                      <label htmlFor={fieldId} className="min-w-0 text-sm font-medium">{tool.name}</label>
                      <select id={fieldId} name="access" defaultValue={access.get(`${user.id}:${tool.id}`) ?? "inherit"} className="border-input bg-background h-10 rounded-lg border px-3 text-sm">
                        <option value="inherit">Herdar</option>
                        <option value="allow">Permitir</option>
                        <option value="deny">Negar</option>
                      </select>
                      <Button type="submit" variant="outline">Salvar</Button>
                    </form>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><KeyRound /></EmptyMedia>
            <EmptyTitle>Nenhum usuário ativo</EmptyTitle>
            <EmptyDescription>Usuários ativos aparecerão aqui para configuração de exceções.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
