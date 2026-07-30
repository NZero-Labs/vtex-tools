import { desc, eq } from "drizzle-orm";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { adminAuditLog, user } from "@/lib/db/schema";

export default async function AuditPage() {
  const logs = await db.select({ id: adminAuditLog.id, action: adminAuditLog.action, targetType: adminAuditLog.targetType, targetId: adminAuditLog.targetId, summary: adminAuditLog.summary, createdAt: adminAuditLog.createdAt, actorName: user.name }).from(adminAuditLog).leftJoin(user, eq(adminAuditLog.actorId, user.id)).orderBy(desc(adminAuditLog.createdAt)).limit(100);

  return <div><p className="text-brand mb-2 text-xs font-bold tracking-[0.16em] uppercase">Rastreabilidade</p><h1 className="font-heading text-4xl font-medium">Log de auditoria.</h1><p className="text-muted-foreground mt-3 mb-8">As 100 ações administrativas mais recentes, sem senhas, tokens ou payloads VTEX.</p><Card><CardHeader><CardTitle>Eventos administrativos</CardTitle><CardDescription>{logs.length} evento(s)</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Ator</TableHead><TableHead>Ação</TableHead><TableHead>Resumo</TableHead><TableHead>Alvo</TableHead></TableRow></TableHeader><TableBody>{logs.map((log) => <TableRow key={log.id}><TableCell className="whitespace-nowrap text-xs">{log.createdAt.toLocaleString("pt-BR")}</TableCell><TableCell>{log.actorName ?? "Usuário removido"}</TableCell><TableCell><Badge variant="outline">{log.action}</Badge></TableCell><TableCell>{log.summary}</TableCell><TableCell className="font-mono text-xs">{log.targetType}:{log.targetId.slice(0, 8)}</TableCell></TableRow>)}</TableBody></Table></div>{!logs.length && <p className="text-muted-foreground py-10 text-center text-sm">Nenhuma ação registrada.</p>}</CardContent></Card></div>;
}
