import Link from "next/link";
import { Search, UserPlus, Users } from "lucide-react";

import { PageHeader } from "@/components/authenticated/page-header";
import { ConfirmForm } from "@/components/confirm-form";
import { FeedbackAlert } from "@/components/feedback-alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { changeUserRole, createUser, setUserActive } from "@/modules/admin/actions";
import { getAdminUsers } from "@/modules/admin/read-models";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/modules/authentication/domain/password-policy";

type AdminUser = Awaited<ReturnType<typeof getAdminUsers>>["users"][number];

function UserRoleForm({ user }: { user: AdminUser }) {
  return (
    <ConfirmForm action={changeUserRole} message="Alterar o papel encerrará as sessões desse usuário. Continuar?" className="flex flex-wrap gap-2">
      <input type="hidden" name="userId" value={user.id} />
      <label className="sr-only" htmlFor={`role-${user.id}`}>Papel de {user.name}</label>
      <select id={`role-${user.id}`} name="role" defaultValue={user.role} className="border-input bg-background h-9 rounded-lg border px-2 text-sm">
        <option value="VISITOR">Visitante</option>
        <option value="EMPLOYEE">Colaborador</option>
        <option value="ADMIN">Administrador</option>
      </select>
      <Button type="submit" size="sm" variant="outline">Salvar</Button>
    </ConfirmForm>
  );
}

function UserAccessForm({ user }: { user: AdminUser }) {
  return (
    <ConfirmForm action={setUserActive} message={user.banned ? "Reativar este acesso?" : "Desativar este acesso e encerrar suas sessões?"}>
      <input type="hidden" name="userId" value={user.id} />
      <input type="hidden" name="active" value={String(user.banned)} />
      <Button type="submit" size="sm" variant={user.banned ? "outline" : "destructive"}>
        {user.banned ? "Reativar" : "Desativar"}
      </Button>
    </ConfirmForm>
  );
}

function pageHref(query: string, status: string, page: number) {
  return `?q=${encodeURIComponent(query)}&status=${status}&page=${page}`;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const query = params.q ?? "";
  const status = params.status ?? "all";
  const { users, totalCount, pageCount } = await getAdminUsers({ query, status, page });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Acesso"
        title="Usuários"
        description="Cadastre colaboradores, altere papéis e desative acessos sem excluir histórico."
      />
      <FeedbackAlert success={params.success} error={params.error} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Colaboradores</CardTitle>
            <CardDescription>{totalCount} {totalCount === 1 ? "registro encontrado" : "registros encontrados"}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto]" method="get">
              <Field>
                <FieldLabel htmlFor="user-search" className="sr-only">Buscar usuários</FieldLabel>
                <InputGroup className="h-10">
                  <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
                  <InputGroupInput id="user-search" name="q" defaultValue={query} placeholder="Buscar nome ou e-mail…" />
                </InputGroup>
              </Field>
              <label className="sr-only" htmlFor="user-status">Filtrar por status</label>
              <select id="user-status" name="status" defaultValue={status} className="border-input bg-background h-10 rounded-lg border px-3 text-sm">
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
              <Button type="submit" variant="outline">Filtrar</Button>
            </form>

            {users.length ? (
              <>
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead className="text-right">Acesso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-muted-foreground max-w-72 truncate text-xs" title={user.email}>{user.email}</p>
                          </TableCell>
                          <TableCell><Badge variant={user.banned ? "destructive" : "secondary"}>{user.banned ? "Inativo" : "Ativo"}</Badge></TableCell>
                          <TableCell><UserRoleForm user={user} /></TableCell>
                          <TableCell className="text-right"><UserAccessForm user={user} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <ul className="grid gap-3 lg:hidden">
                  {users.map((user) => (
                    <li key={user.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-muted-foreground break-all text-xs">{user.email}</p>
                        </div>
                        <Badge variant={user.banned ? "destructive" : "secondary"}>{user.banned ? "Inativo" : "Ativo"}</Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                        <UserRoleForm user={user} />
                        <UserAccessForm user={user} />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Users /></EmptyMedia>
                  <EmptyTitle>Nenhum usuário encontrado</EmptyTitle>
                  <EmptyDescription>Ajuste a busca ou o filtro de status.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

            <nav className="flex flex-wrap items-center justify-between gap-3 border-t pt-4" aria-label="Paginação de usuários">
              <p className="text-muted-foreground text-xs">Página {page} de {pageCount}</p>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link href={pageHref(query, status, page - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>Anterior</Link>
                ) : <Button size="sm" variant="outline" disabled>Anterior</Button>}
                {page < pageCount ? (
                  <Link href={pageHref(query, status, page + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>Próxima</Link>
                ) : <Button size="sm" variant="outline" disabled>Próxima</Button>}
              </div>
            </nav>
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-20">
          <CardHeader>
            <UserPlus className="text-primary mb-2 size-5" aria-hidden />
            <CardTitle>Novo usuário</CardTitle>
            <CardDescription>Envie a senha temporária por um canal seguro.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createUser}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Nome</FieldLabel>
                  <Input id="name" name="name" required minLength={2} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">E-mail</FieldLabel>
                  <Input id="email" name="email" type="email" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Senha temporária</FieldLabel>
                  <Input id="password" name="password" type="password" minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} autoComplete="new-password" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="role">Papel</FieldLabel>
                  <select id="role" name="role" defaultValue="EMPLOYEE" className="border-input bg-background h-10 rounded-lg border px-3 text-sm">
                    <option value="VISITOR">Visitante</option>
                    <option value="EMPLOYEE">Colaborador</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </Field>
              </FieldGroup>
              <Button type="submit" className="mt-5 w-full">Criar usuário</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
