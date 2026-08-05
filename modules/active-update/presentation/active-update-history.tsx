"use client";

import { FileSpreadsheet, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ActiveUpdateJobDto } from "../domain/active-update";
import { ALL_OWNERS } from "../domain/active-update";
import {
  activeUpdateDateTime,
  activeUpdateStatusLabels,
  activeUpdateStatusVariant,
} from "./active-update-status";

export function ActiveUpdateHistory({
  isAdmin,
  history,
  collaborators,
  ownerId,
  showAllHistory,
  hasMoreHistory,
  loadingHistory,
  onOwnerChange,
  onOpenJob,
  onExpand,
}: {
  isAdmin: boolean;
  history: ActiveUpdateJobDto[];
  collaborators: Array<{ id: string; name: string }>;
  ownerId: string;
  showAllHistory: boolean;
  hasMoreHistory: boolean;
  loadingHistory: boolean;
  onOwnerChange: (ownerId: string) => Promise<void>;
  onOpenJob: (jobId: string) => Promise<ActiveUpdateJobDto>;
  onExpand: () => Promise<void>;
}) {
  const visibleHistory = showAllHistory ? history : history.slice(0, 5);

  return (
    <Card>
      <CardHeader>
      <CardTitle className="flex items-center gap-2">
        {isAdmin ? (
          <ShieldCheck className="text-primary size-5" aria-hidden />
        ) : (
          <FileSpreadsheet className="text-primary size-5" aria-hidden />
        )}{" "}
        Histórico
      </CardTitle>
      <CardDescription>
        Processamentos disponíveis por até 90 dias.
      </CardDescription>
      {isAdmin ? (
        <Select
          value={ownerId}
          onValueChange={(value) => void onOwnerChange(value ?? ALL_OWNERS)}
        >
          <SelectTrigger
            className="mt-3 h-11 w-full sm:w-56"
            aria-label="Filtrar por colaborador"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={ALL_OWNERS}>Todos os colaboradores</SelectItem>
              {collaborators.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ) : null}
      </CardHeader>
      <CardContent>
    {visibleHistory.length ? (
      <>
        <div className="hidden overflow-hidden rounded-xl border lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                {isAdmin ? <TableHead>Colaborador</TableHead> : null}
                <TableHead>Status</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleHistory.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="max-w-64 truncate font-medium" title={job.fileName}>
                    {job.fileName}
                  </TableCell>
                  {isAdmin ? (
                    <TableCell>{job.ownerName}</TableCell>
                  ) : null}
                  <TableCell>
                    <Badge variant={activeUpdateStatusVariant(job.status)}>
                      {activeUpdateStatusLabels[job.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {job.updatedCount} atualizados · {job.failedCount}{" "}
                    falhas
                  </TableCell>
                  <TableCell>
                    {activeUpdateDateTime.format(new Date(job.createdAt))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void onOpenJob(job.id)}
                    >
                      Abrir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="grid gap-3 lg:hidden">
          {visibleHistory.map((job) => (
            <button
              type="button"
              className="bg-card min-h-11 rounded-xl border p-4 text-left"
              onClick={() => void onOpenJob(job.id)}
              key={job.id}
            >
              <span className="flex items-center justify-between gap-3">
                <strong className="min-w-0 break-all">{job.fileName}</strong>
                <Badge variant={activeUpdateStatusVariant(job.status)}>
                  {activeUpdateStatusLabels[job.status]}
                </Badge>
              </span>
              {isAdmin ? (
                <span className="text-muted-foreground mt-2 block text-xs">
                  {job.ownerName}
                </span>
              ) : null}
              <span className="text-muted-foreground mt-2 block text-xs">
                {job.updatedCount} atualizados · {job.failedCount} falhas
                · {activeUpdateDateTime.format(new Date(job.createdAt))}
              </span>
            </button>
          ))}
        </div>
      </>
    ) : (
      <Empty className="py-10">
        <EmptyHeader>
          <EmptyTitle>Nenhum processamento encontrado.</EmptyTitle>
          <EmptyDescription>Novas atualizações aparecerão aqui.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )}
      </CardContent>
  {history.length > 5 || hasMoreHistory ? (
    <CardFooter className="justify-center">
      <Button
        variant="ghost"
        disabled={loadingHistory}
        onClick={() => void onExpand()}
      >
        {loadingHistory ? (
          <Spinner data-icon="inline-start" />
        ) : null}
        {!showAllHistory
          ? "Ver histórico completo"
          : hasMoreHistory
            ? "Carregar mais"
            : "Mostrar menos"}
      </Button>
    </CardFooter>
      ) : null}
    </Card>
  );
}
