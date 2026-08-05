import { BookOpenCheck } from "lucide-react";

import { PageHeader } from "@/components/authenticated/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRecentAdminAuditLogs } from "@/modules/admin/read-models";

export default async function AuditPage() {
  const logs = await getRecentAdminAuditLogs();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Rastreabilidade"
        title="Log de auditoria"
        description="As 100 ações administrativas mais recentes, sem senhas, tokens ou payloads VTEX."
      />

      <Card>
        <CardHeader>
          <CardTitle>Eventos administrativos</CardTitle>
          <CardDescription>{logs.length} {logs.length === 1 ? "evento" : "eventos"}</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length ? (
            <>
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Ator</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Resumo</TableHead>
                      <TableHead>Alvo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">{log.createdAt.toLocaleString("pt-BR")}</TableCell>
                        <TableCell>{log.actorName ?? "Usuário removido"}</TableCell>
                        <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                        <TableCell className="whitespace-normal">{log.summary}</TableCell>
                        <TableCell className="font-mono text-xs">{log.targetType}:{log.targetId.slice(0, 8)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ul className="flex flex-col gap-3 lg:hidden">
                {logs.map((log) => (
                  <li key={log.id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="outline">{log.action}</Badge>
                      <time className="text-muted-foreground text-xs" dateTime={log.createdAt.toISOString()}>{log.createdAt.toLocaleString("pt-BR")}</time>
                    </div>
                    <p className="mt-3 text-sm font-medium">{log.summary}</p>
                    <p className="text-muted-foreground mt-2 break-all text-xs">{log.actorName ?? "Usuário removido"} · {log.targetType}:{log.targetId.slice(0, 8)}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><BookOpenCheck /></EmptyMedia>
                <EmptyTitle>Nenhuma ação registrada</EmptyTitle>
                <EmptyDescription>As alterações administrativas aparecerão aqui.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
