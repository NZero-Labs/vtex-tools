import Link from "next/link";
import { Search, ShieldCheck, Users } from "lucide-react";

import { PageHeader } from "@/components/authenticated/page-header";
import { ConfirmForm } from "@/components/confirm-form";
import { FeedbackAlert } from "@/components/feedback-alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Role } from "@/lib/auth/permissions";
import { changeUserRole } from "@/modules/admin/actions";
import { getAdminUsers } from "@/modules/admin/read-models";

type AdminUser = Awaited<ReturnType<typeof getAdminUsers>>["users"][number];
type UserStatus = "all" | "active" | "inactive";

const roleOptions: ReadonlyArray<{ value: Role; label: string }> = [
  { value: "VISITOR", label: "Visitante" },
  { value: "EMPLOYEE", label: "Colaborador" },
  { value: "ADMIN", label: "Administrador" },
];

const roleLabels = Object.fromEntries(roleOptions.map((role) => [role.value, role.label])) as Record<Role, string>;
const statusLabels: Record<UserStatus, string> = {
  all: "Todos os status",
  active: "Ativos",
  inactive: "Inativos",
};

function getRoleLabel(role: string) {
  return roleLabels[role as Role] ?? "Cargo inválido";
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "AM";
}

function UserIdentity({ user }: { user: AdminUser }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar size="lg">
        <AvatarImage src={user.image ?? undefined} alt={`Foto de ${user.name}`} />
        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium">{user.name}</p>
        <p className="text-muted-foreground truncate text-xs" title={user.email}>{user.email}</p>
      </div>
    </div>
  );
}

function UserStatusBadge({ user }: { user: AdminUser }) {
  return <Badge variant={user.banned ? "destructive" : "secondary"}>{user.banned ? "Inativo" : "Ativo"}</Badge>;
}

function UserRoleForm({ user }: { user: AdminUser }) {
  const currentRole = roleOptions.some((role) => role.value === user.role) ? user.role : "VISITOR";

  return (
    <ConfirmForm action={changeUserRole} message="Alterar o Cargo encerrará as sessões desse usuário. Continuar?" className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <input type="hidden" name="userId" value={user.id} />
      <Select name="role" defaultValue={currentRole}>
        <SelectTrigger className="h-11 w-full bg-background/55 sm:min-w-48 sm:w-48" aria-label={`Cargo de ${user.name}`}>
          <SelectValue>{getRoleLabel(currentRole)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {roleOptions.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button type="submit" size="lg" variant="outline" className="min-h-11 w-full sm:w-auto">Salvar Cargo</Button>
    </ConfirmForm>
  );
}

function pageHref(query: string, status: UserStatus, page: number) {
  return `?q=${encodeURIComponent(query)}&status=${status}&page=${page}`;
}

function normalizeStatus(value?: string): UserStatus {
  return value === "active" || value === "inactive" ? value : "all";
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const query = params.q?.trim() ?? "";
  const status = normalizeStatus(params.status);
  const { users, totalCount, pageCount } = await getAdminUsers({ query, status, page });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Gestão de acessos"
        title="Usuários"
        description="Todos os acessos entram pela Microsoft. Defina aqui o Cargo que controla o que cada pessoa pode fazer."
      />
      <FeedbackAlert success={params.success} error={params.error} />

      <Card className="overflow-hidden border-transparent bg-card/85 shadow-lg shadow-primary/5">
        <CardHeader className="border-b border-border/60 bg-background/20 pb-5">
          <div className="flex items-start gap-3">
            <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
              <Users aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-xl sm:text-2xl">Diretório de acessos</CardTitle>
                <Badge variant="secondary">Microsoft SSO</Badge>
              </div>
              <CardDescription className="mt-1">{totalCount} {totalCount === 1 ? "usuário encontrado" : "usuários encontrados"}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-5 p-4 sm:p-6">
          <form className="grid gap-3 rounded-2xl border border-border/60 bg-background/85 p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_12rem_auto]" method="get">
            <InputGroup className="h-11 bg-background/55">
              <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
              <InputGroupInput name="q" defaultValue={query} placeholder="Buscar por nome ou e-mail…" aria-label="Buscar usuários" />
            </InputGroup>
            <Select name="status" defaultValue={status}>
              <SelectTrigger className="h-11 w-full bg-background/55" aria-label="Filtrar por status">
                <SelectValue>{statusLabels[status]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button type="submit" size="lg" className="min-h-11">Filtrar</Button>
          </form>

          {users.length ? (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cargo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="transition-colors hover:bg-muted/30">
                        <TableCell className="py-4"><UserIdentity user={user} /></TableCell>
                        <TableCell><UserStatusBadge user={user} /></TableCell>
                        <TableCell className="min-w-72"><UserRoleForm user={user} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <ul className="grid gap-3 lg:hidden">
                {users.map((user) => (
                  <li key={user.id} className="rounded-2xl border border-border/60 bg-background/35 p-4 transition-colors hover:bg-muted/30">
                    <div className="flex items-start justify-between gap-3">
                      <UserIdentity user={user} />
                      <UserStatusBadge user={user} />
                    </div>
                    <Separator className="my-4 bg-border/60" />
                    <div className="flex flex-col gap-2">
                      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Cargo atual</p>
                      <UserRoleForm user={user} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Empty className="min-h-56 border bg-background/30">
              <EmptyHeader>
                <EmptyMedia variant="icon"><Users /></EmptyMedia>
                <EmptyTitle>Nenhum usuário encontrado</EmptyTitle>
                <EmptyDescription>Quando alguém entrar pela Microsoft, o acesso aparecerá aqui para receber um Cargo.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          <Separator />
          <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">Página {page} de {pageCount}</p>
            <div className="flex gap-2">
              {page > 1 ? <Link href={pageHref(query, status, page - 1)} className={buttonVariants({ variant: "outline", size: "sm", className: "min-h-10" })}>Anterior</Link> : <Button size="sm" variant="outline" className="min-h-10" disabled>Anterior</Button>}
              {page < pageCount ? <Link href={pageHref(query, status, page + 1)} className={buttonVariants({ variant: "outline", size: "sm", className: "min-h-10" })}>Próxima</Link> : <Button size="sm" variant="outline" className="min-h-10" disabled>Próxima</Button>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-muted-foreground flex items-start gap-2 text-sm">
        <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
        <p>O Cargo Visitante é aplicado automaticamente a novos acessos até que um administrador revise a conta.</p>
      </div>
    </div>
  );
}
