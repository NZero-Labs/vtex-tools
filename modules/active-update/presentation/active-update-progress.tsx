"use client";

import {
  Activity,
  CheckCircle2,
  Clock3,
  Download,
  MinusCircle,
  Pause,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import type { ActiveUpdateJobDetailsDto } from "../domain/active-update";
import {
  activeUpdateStatusLabels,
  activeUpdateStatusVariant,
} from "./active-update-status";

function ResultIcon({
  status,
}: {
  status: ActiveUpdateJobDetailsDto["items"][number]["status"];
}) {
  if (status === "updated")
    return <CheckCircle2 className="text-primary size-4" aria-hidden />;
  if (status === "unchanged")
    return <MinusCircle className="text-muted-foreground size-4" aria-hidden />;
  return <XCircle className="text-destructive size-4" aria-hidden />;
}

export function ActiveUpdateProgress({
  activeJob,
  progress,
  onChangeJob,
}: {
  activeJob: ActiveUpdateJobDetailsDto;
  progress: number;
  onChangeJob: (action: "pause" | "resume") => Promise<void>;
}) {
  return (
    <section
      className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,.75fr)]"
      aria-label="Processamento atual"
    >
      <Card className="min-w-0">
        <CardHeader>
          <div>
            <Badge variant={activeUpdateStatusVariant(activeJob.status)}>
              <Clock3 data-icon="inline-start" />
              {activeUpdateStatusLabels[activeJob.status]}
            </Badge>
            <CardTitle className="mt-3 break-all text-2xl">
              {activeJob.fileName}
            </CardTitle>
            <CardDescription className="mt-1">
              {activeJob.canControl
                ? "O progresso é salvo após cada registro. Você pode fechar a página com segurança."
                : `Processamento de ${activeJob.ownerName ?? "colaborador"}.`}
            </CardDescription>
          </div>
          <CardAction>
            <span className="font-heading text-3xl tabular-nums">
              {progress}%
            </span>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div>
            <div
              className="bg-muted flex h-2.5 overflow-hidden rounded-full"
              role="progressbar"
              aria-label="Progresso do processamento"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              {activeJob.updatedCount > 0 ? (
                <div
                  className="bg-primary h-full rounded-l-full transition-[width] duration-200 motion-reduce:transition-none"
                  style={{ width: `${(activeJob.updatedCount / activeJob.totalCount) * 100}%` }}
                />
              ) : null}
              {activeJob.unchangedCount > 0 ? (
                <div
                  className="bg-muted-foreground/40 h-full transition-[width] duration-200 motion-reduce:transition-none"
                  style={{ width: `${(activeJob.unchangedCount / activeJob.totalCount) * 100}%` }}
                />
              ) : null}
              {activeJob.failedCount > 0 ? (
                <div
                  className="bg-destructive h-full rounded-r-full transition-[width] duration-200 motion-reduce:transition-none"
                  style={{ width: `${(activeJob.failedCount / activeJob.totalCount) * 100}%` }}
                />
              ) : null}
            </div>
            <div className="text-muted-foreground mt-2 flex justify-between text-xs tabular-nums">
              <span>
                {activeJob.processedCount.toLocaleString("pt-BR")} de{" "}
                {activeJob.totalCount.toLocaleString("pt-BR")}
              </span>
              <span>
                {activeJob.pendingCount.toLocaleString("pt-BR")} pendentes
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="bg-primary size-2 rounded-full" aria-hidden /> Atualizados
              </span>
              <span className="flex items-center gap-1.5">
                <span className="bg-muted-foreground/40 size-2 rounded-full" aria-hidden /> Sem alteração
              </span>
              <span className="flex items-center gap-1.5">
                <span className="bg-destructive size-2 rounded-full" aria-hidden /> Falhas
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-3">
            {[
              {
                label: "Atualizados",
                value: activeJob.updatedCount,
                color: "text-primary",
              },
              {
                label: "Sem alteração",
                value: activeJob.unchangedCount,
                color: "text-foreground",
              },
              {
                label: "Falhas",
                value: activeJob.failedCount,
                color: "text-destructive",
              },
            ].map((stat) => (
              <div className="bg-card p-4" key={stat.label}>
                <p className="text-muted-foreground text-xs">{stat.label}</p>
                <p
                  className={cn(
                    "mt-1 font-heading text-2xl tabular-nums",
                    stat.color,
                  )}
                >
                  {stat.value.toLocaleString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground text-xs">
            Dados completos aparecem somente nos arquivos de resultado.
          </span>
          <div className="flex flex-wrap gap-2">
            {activeJob.canControl && activeJob.status === "running" ? (
              <Button
                variant="outline"
                onClick={() => void onChangeJob("pause")}
              >
                <Pause data-icon="inline-start" />
                Pausar
              </Button>
            ) : null}
            {activeJob.canControl && activeJob.status === "paused" ? (
              <Button onClick={() => void onChangeJob("resume")}>
                <RotateCcw data-icon="inline-start" />
                Retomar
              </Button>
            ) : null}
            {activeJob.status === "paused" ||
            activeJob.status === "completed" ? (
              <>
                <a
                  className={buttonVariants({ variant: "outline" })}
                  href={`/api/active-updates/${activeJob.id}/export/csv`}
                >
                  <Download data-icon="inline-start" />
                  CSV
                </a>
                <a
                  className={buttonVariants({ variant: "outline" })}
                  href={`/api/active-updates/${activeJob.id}/export/json`}
                >
                  <Download data-icon="inline-start" />
                  JSON
                </a>
              </>
            ) : null}
          </div>
        </CardFooter>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="text-primary size-5" aria-hidden /> Log em
            tempo real
          </CardTitle>
          <CardDescription>
            Últimos resultados, sempre mascarados.
          </CardDescription>
        </CardHeader>
        <CardContent aria-live="polite">
          {activeJob.items.length ? (
            <div className="flex flex-col gap-3">
              {activeJob.items.slice(0, 6).map((item) => (
                <div
                  className="flex gap-3 border-b pb-3 last:border-0 last:pb-0"
                  key={`${item.rowNumber}-${item.updatedAt}`}
                >
                  <ResultIcon status={item.status} />
                  <div className="min-w-0">
                    <p className="break-all text-sm font-medium">
                      {item.email} · {item.cnpjDoc}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs leading-5">
                      Linha {item.rowNumber}:{" "}
                      {item.message ?? "Resultado registrado"}
                    </p>
                  </div>
                </div>
              ))}
              {activeJob.items.length > 6 ? (
                <details className="text-sm">
                  <summary className="text-primary min-h-11 cursor-pointer py-3 font-medium">
                    Ver todos os logs recentes
                  </summary>
                  <div className="flex flex-col gap-3 pt-2">
                    {activeJob.items.slice(6).map((item) => (
                      <div
                        className="flex gap-3"
                        key={`${item.rowNumber}-${item.updatedAt}`}
                      >
                        <ResultIcon status={item.status} />
                        <p>
                          <span className="font-medium">
                            Linha {item.rowNumber}
                          </span>
                          <br />
                          <span className="text-muted-foreground text-xs">
                            {item.message}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          ) : (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyTitle>Aguardando resultados</EmptyTitle>
                <EmptyDescription>
                  Os registros aparecerão assim que o primeiro bloco terminar.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
