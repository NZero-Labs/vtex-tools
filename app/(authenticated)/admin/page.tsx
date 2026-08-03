import Link from "next/link";
import { ArrowRight, BookOpenCheck, FileDiff, UserCheck, Users } from "lucide-react";

import { PageHeader } from "@/components/authenticated/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { getAdminOverview } from "@/modules/admin/read-models";

export default async function AdminPage() {
  const overview = await getAdminOverview();
  const metrics = [
    { label: "Usuários", value: overview.userCount, icon: Users },
    { label: "Acessos ativos", value: overview.activeUserCount, icon: UserCheck },
    { label: "Administradores", value: overview.adminCount, icon: BookOpenCheck },
    { label: "Ferramentas", value: overview.toolCount, icon: FileDiff },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Gestão da plataforma"
        title="Administração"
        description="Controle acessos e disponibilidade com histórico auditável."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo da plataforma">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label} size="sm">
            <CardHeader>
              <Icon className="text-primary mb-2 size-5" aria-hidden />
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Atividade recente</CardTitle>
            <CardDescription>Últimas alterações administrativas registradas.</CardDescription>
          </CardHeader>
          <CardContent>
            {overview.recentLogs.length ? (
              <ul className="divide-y">
                {overview.recentLogs.map((log) => (
                  <li key={log.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                    <span className="text-sm font-medium">{log.summary}</span>
                    <time className="text-muted-foreground shrink-0 text-xs" dateTime={log.createdAt.toISOString()}>
                      {log.createdAt.toLocaleString("pt-BR")}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyTitle>Nenhuma atividade registrada</EmptyTitle>
                  <EmptyDescription>As alterações administrativas aparecerão aqui.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações rápidas</CardTitle>
            <CardDescription>Atalhos para as rotinas mais frequentes.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link href="/admin/usuarios" className={buttonVariants({ variant: "outline", className: "w-full justify-between" })}>
              Gerenciar usuários <ArrowRight data-icon="inline-end" />
            </Link>
            <Link href="/admin/ferramentas" className={buttonVariants({ variant: "outline", className: "w-full justify-between" })}>
              Gerenciar catálogo <ArrowRight data-icon="inline-end" />
            </Link>
            <Link href="/admin/permissoes" className={buttonVariants({ variant: "outline", className: "w-full justify-between" })}>
              Revisar permissões <ArrowRight data-icon="inline-end" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
