import Link from "next/link";
import { and, asc, count, eq, ilike, or, type SQL } from "drizzle-orm";
import { Search, UserPlus } from "lucide-react";

import { ConfirmForm } from "@/components/confirm-form";
import { FeedbackAlert } from "@/components/feedback-alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { changeUserRole, createUser, setUserActive } from "@/modules/admin/actions";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/modules/authentication/domain/password-policy";

const pageSize = 10;

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string; success?: string; error?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const filters: SQL[] = [];
  if (params.q) filters.push(or(ilike(user.name, `%${params.q}%`), ilike(user.email, `%${params.q}%`))!);
  if (params.status === "active") filters.push(eq(user.banned, false));
  if (params.status === "inactive") filters.push(eq(user.banned, true));
  const where = filters.length ? and(...filters) : undefined;
  const [[total], users] = await Promise.all([
    db.select({ value: count() }).from(user).where(where),
    db.select().from(user).where(where).orderBy(asc(user.name)).limit(pageSize).offset((page - 1) * pageSize),
  ]);
  const pages = Math.max(1, Math.ceil((total?.value ?? 0) / pageSize));

  return <div><p className="text-brand mb-2 text-xs font-bold tracking-[0.16em] uppercase">Acesso</p><h1 className="font-heading text-4xl font-medium">Usuários.</h1><p className="text-muted-foreground mt-3 mb-8">Cadastre colaboradores, altere papéis e desative acessos sem excluir histórico.</p><FeedbackAlert success={params.success} error={params.error} /><div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
    <Card><CardHeader><CardTitle>Colaboradores</CardTitle><CardDescription>{total?.value ?? 0} registro(s) encontrado(s)</CardDescription></CardHeader><CardContent>
      <form className="mb-5 flex flex-col gap-3 sm:flex-row" method="get"><div className="relative flex-1"><Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" /><Input name="q" defaultValue={params.q} placeholder="Buscar nome ou e-mail…" className="pl-9" /></div><select name="status" defaultValue={params.status ?? "all"} className="border-input bg-background h-8 rounded-lg border px-3 text-sm"><option value="all">Todos</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select><Button type="submit" variant="outline">Filtrar</Button></form>
      <div className="hidden overflow-x-auto md:block"><Table><TableHeader><TableRow><TableHead>Usuário</TableHead><TableHead>Status</TableHead><TableHead>Papel</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader><TableBody>{users.map((item) => <TableRow key={item.id}><TableCell><p className="font-medium">{item.name}</p><p className="text-muted-foreground text-xs">{item.email}</p></TableCell><TableCell><Badge variant={item.banned ? "destructive" : "secondary"}>{item.banned ? "Inativo" : "Ativo"}</Badge></TableCell><TableCell><ConfirmForm action={changeUserRole} message="Alterar o papel encerrará as sessões desse usuário. Continuar?" className="flex gap-2"><input type="hidden" name="userId" value={item.id} /><select name="role" defaultValue={item.role} className="border-input bg-background h-8 rounded-lg border px-2 text-sm"><option value="EMPLOYEE">Colaborador</option><option value="ADMIN">Administrador</option></select><Button type="submit" size="sm" variant="outline">Salvar</Button></ConfirmForm></TableCell><TableCell className="text-right"><ConfirmForm action={setUserActive} message={item.banned ? "Reativar este acesso?" : "Desativar este acesso e encerrar suas sessões?"}><input type="hidden" name="userId" value={item.id} /><input type="hidden" name="active" value={String(item.banned)} /><Button type="submit" size="sm" variant={item.banned ? "outline" : "destructive"}>{item.banned ? "Reativar" : "Desativar"}</Button></ConfirmForm></TableCell></TableRow>)}</TableBody></Table></div>
      <div className="grid gap-3 md:hidden">{users.map((item) => <div key={item.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{item.name}</p><p className="text-muted-foreground text-xs break-all">{item.email}</p></div><Badge variant={item.banned ? "destructive" : "secondary"}>{item.banned ? "Inativo" : "Ativo"}</Badge></div><div className="mt-4 flex flex-wrap gap-2"><ConfirmForm action={changeUserRole} message="Alterar o papel encerrará as sessões. Continuar?" className="flex gap-2"><input type="hidden" name="userId" value={item.id} /><select name="role" defaultValue={item.role} className="border-input bg-background h-8 rounded-lg border px-2 text-sm"><option value="EMPLOYEE">Colaborador</option><option value="ADMIN">Administrador</option></select><Button type="submit" size="sm" variant="outline">Salvar</Button></ConfirmForm><ConfirmForm action={setUserActive} message="Confirmar alteração de acesso?"><input type="hidden" name="userId" value={item.id} /><input type="hidden" name="active" value={String(item.banned)} /><Button type="submit" size="sm" variant="ghost">{item.banned ? "Reativar" : "Desativar"}</Button></ConfirmForm></div></div>)}</div>
      {!users.length && <p className="text-muted-foreground py-10 text-center text-sm">Nenhum usuário corresponde aos filtros.</p>}
      <div className="mt-5 flex items-center justify-between"><p className="text-muted-foreground text-xs">Página {page} de {pages}</p><div className="flex gap-2">{page > 1 ? <Link href={`?q=${encodeURIComponent(params.q ?? "")}&status=${params.status ?? "all"}&page=${page - 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Anterior</Link> : <Button size="sm" variant="outline" disabled>Anterior</Button>}{page < pages ? <Link href={`?q=${encodeURIComponent(params.q ?? "")}&status=${params.status ?? "all"}&page=${page + 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Próxima</Link> : <Button size="sm" variant="outline" disabled>Próxima</Button>}</div></div>
    </CardContent></Card>
    <Card><CardHeader><UserPlus className="text-brand mb-2 size-5" /><CardTitle>Novo usuário</CardTitle><CardDescription>O cadastro é administrativo. Envie a senha temporária por um canal seguro.</CardDescription></CardHeader><CardContent><form action={createUser}><FieldGroup><Field><FieldLabel htmlFor="name">Nome</FieldLabel><Input id="name" name="name" required minLength={2} /></Field><Field><FieldLabel htmlFor="email">E-mail</FieldLabel><Input id="email" name="email" type="email" required /></Field><Field><FieldLabel htmlFor="password">Senha temporária</FieldLabel><Input id="password" name="password" type="password" minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} autoComplete="new-password" required /></Field><Field><FieldLabel htmlFor="role">Papel</FieldLabel><select id="role" name="role" defaultValue="EMPLOYEE" className="border-input bg-background h-8 rounded-lg border px-3 text-sm"><option value="EMPLOYEE">Colaborador</option><option value="ADMIN">Administrador</option></select></Field></FieldGroup><Button type="submit" className="mt-5 w-full">Criar usuário</Button></form></CardContent></Card>
  </div></div>;
}
