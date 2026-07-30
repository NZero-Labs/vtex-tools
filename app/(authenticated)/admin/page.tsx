import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { ArrowRight, BookOpenCheck, FileDiff, UserCheck, Users } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { adminAuditLog, user } from "@/lib/db/schema";

export default async function AdminPage() {
  const [[users], [active], [admins], logs] = await Promise.all([
    db.select({ value: count() }).from(user),
    db.select({ value: count() }).from(user).where(eq(user.banned, false)),
    db.select({ value: count() }).from(user).where(eq(user.role, "ADMIN")),
    db.select().from(adminAuditLog).orderBy(desc(adminAuditLog.createdAt)).limit(5),
  ]);
  const metrics = [
    { label: "Usuários", value: users?.value ?? 0, icon: Users },
    { label: "Acessos ativos", value: active?.value ?? 0, icon: UserCheck },
    { label: "Administradores", value: admins?.value ?? 0, icon: BookOpenCheck },
    { label: "Ferramentas", value: 1, icon: FileDiff },
  ];

  return <div><p className="text-brand mb-2 text-xs font-bold tracking-[0.16em] uppercase">Gestão da plataforma</p><h1 className="font-heading text-4xl font-medium">Administração.</h1><p className="text-muted-foreground mt-3 mb-8">Controle acessos e disponibilidade com histórico auditável.</p><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, icon: Icon }) => <Card key={label} size="sm"><CardHeader><Icon className="text-brand mb-2 size-5" /><CardDescription>{label}</CardDescription><CardTitle className="text-3xl tabular-nums">{value}</CardTitle></CardHeader></Card>)}</section><section className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]"><Card><CardHeader><CardTitle>Atividade recente</CardTitle><CardDescription>{logs.length ? logs.map((log) => `${log.summary} · ${log.createdAt.toLocaleString("pt-BR")}`).join("\n") : "Nenhuma ação administrativa registrada."}</CardDescription></CardHeader></Card><Card><CardHeader><CardTitle>Ações rápidas</CardTitle><div className="mt-4 space-y-2"><Link href="/admin/usuarios" className={buttonVariants({ variant: "outline", className: "w-full justify-between" })}>Gerenciar usuários <ArrowRight data-icon="inline-end" /></Link><Link href="/admin/ferramentas" className={buttonVariants({ variant: "outline", className: "w-full justify-between" })}>Gerenciar catálogo <ArrowRight data-icon="inline-end" /></Link><Link href="/admin/permissoes" className={buttonVariants({ variant: "outline", className: "w-full justify-between" })}>Revisar permissões <ArrowRight data-icon="inline-end" /></Link></div></CardHeader></Card></section></div>;
}
