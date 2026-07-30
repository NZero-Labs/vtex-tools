"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock3,
  Download,
  FileSpreadsheet,
  MinusCircle,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import {
  parseActiveUpdateCsv,
  UPLOAD_BATCH_SIZE,
  type ActiveUpdateJobDetailsDto,
  type ActiveUpdateJobDto,
  type ActiveUpdateRow,
} from "../domain/active-update";

type HistoryResponse = {
  jobs: ActiveUpdateJobDto[];
  collaborators: Array<{ id: string; name: string }>;
  activeJobId: string | null;
  hasMore: boolean;
  page: number;
};

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "Não foi possível concluir a solicitação.";
    throw new ApiError(message, response.status);
  }
  return payload as T;
}

async function* decodedFileChunks(file: File) {
  const reader = file.stream().getReader();
  const decoder = new TextDecoder("utf-8");
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
    const final = decoder.decode();
    if (final) yield final;
  } finally {
    reader.releaseLock();
  }
}

const statusLabels: Record<ActiveUpdateJobDto["status"], string> = {
  uploading: "Importando",
  ready: "Pronto",
  running: "Em execução",
  paused: "Pausado",
  completed: "Concluído",
  failed: "Falhou",
};

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});
const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function statusVariant(status: ActiveUpdateJobDto["status"]) {
  if (status === "failed") return "destructive" as const;
  if (status === "completed" || status === "running")
    return "secondary" as const;
  return "outline" as const;
}

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

export function ActiveUpdateTool({
  isAdmin,
  initialHistory,
  initialJob,
}: {
  isAdmin: boolean;
  initialHistory: HistoryResponse;
  initialJob: ActiveUpdateJobDetailsDto | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedRows, setUploadedRows] = useState(0);
  const [activeJob, setActiveJob] =
    useState<ActiveUpdateJobDetailsDto | null>(initialJob);
  const [history, setHistory] = useState<ActiveUpdateJobDto[]>(
    initialHistory.jobs,
  );
  const [collaborators, setCollaborators] = useState<
    HistoryResponse["collaborators"]
  >(initialHistory.collaborators);
  const [ownerId, setOwnerId] = useState("all");
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(initialHistory.page);
  const [hasMoreHistory, setHasMoreHistory] = useState(
    initialHistory.hasMore,
  );
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJob = useCallback(async (jobId: string) => {
    const job = await api<ActiveUpdateJobDetailsDto>(
      `/api/active-updates/${jobId}`,
    );
    setActiveJob(job);
    return job;
  }, []);

  const loadHistory = useCallback(
    async (selectedOwner: string, page = 0, append = false) => {
      setLoadingHistory(true);
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (selectedOwner !== "all") params.set("ownerId", selectedOwner);
        const result = await api<HistoryResponse>(
          `/api/active-updates?${params}`,
        );
        setHistory((current) => {
          if (!append) return result.jobs;
          const loadedIds = new Set(current.map((job) => job.id));
          return [
            ...current,
            ...result.jobs.filter((job) => !loadedIds.has(job.id)),
          ];
        });
        setCollaborators(result.collaborators);
        setHistoryPage(result.page);
        setHasMoreHistory(result.hasMore);
      } finally {
        setLoadingHistory(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (activeJob?.status !== "running" || !activeJob.canControl) return;
    let stopped = false;

    const pump = async () => {
      while (!stopped) {
        try {
          const next = await api<ActiveUpdateJobDetailsDto>(
            `/api/active-updates/${activeJob.id}/process`,
            { method: "POST" },
          );
          if (stopped) return;
          setActiveJob(next);
          if (next.status !== "running") {
            await loadHistory(ownerId);
            return;
          }
          await wait(150);
        } catch (reason) {
          if (stopped) return;
          setError(
            reason instanceof Error
              ? reason.message
              : "O processamento foi interrompido.",
          );
          if (
            reason instanceof ApiError &&
            (reason.status === 401 || reason.status === 403)
          )
            return;
          await wait(2_000);
        }
      }
    };
    void pump();
    return () => {
      stopped = true;
    };
  }, [
    activeJob?.canControl,
    activeJob?.id,
    activeJob?.status,
    loadHistory,
    ownerId,
  ]);

  async function sendRows(jobId: string, rows: ActiveUpdateRow[]) {
    await api(`/api/active-updates/${jobId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
  }

  async function start() {
    if (!file) return;
    setUploading(true);
    setUploadedRows(0);
    setError(null);
    let jobId: string | null = null;
    try {
      const job = await api<{ id: string }>("/api/active-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name }),
      });
      jobId = job.id;
      const batch: ActiveUpdateRow[] = [];
      let parsedRows = 0;
      for await (const row of parseActiveUpdateCsv(decodedFileChunks(file))) {
        batch.push(row);
        parsedRows += 1;
        if (batch.length === UPLOAD_BATCH_SIZE) {
          await sendRows(jobId, batch.splice(0));
          setUploadedRows(parsedRows);
        }
      }
      if (batch.length) await sendRows(jobId, batch);
      setUploadedRows(parsedRows);
      await api(`/api/active-updates/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finish-upload" }),
      });
      await loadJob(jobId);
      await loadHistory(ownerId);
      setFile(null);
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : "Não foi possível importar o arquivo.";
      setError(message);
      if (jobId)
        await api(`/api/active-updates/${jobId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "fail-upload", message }),
        }).catch(() => undefined);
      await loadHistory(ownerId).catch(() => undefined);
    } finally {
      setUploading(false);
    }
  }

  async function changeJob(action: "pause" | "resume") {
    if (!activeJob) return;
    setError(null);
    await api(`/api/active-updates/${activeJob.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
      .then(() => loadJob(activeJob.id))
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível alterar o processamento.",
        ),
      );
  }

  const progress = activeJob?.totalCount
    ? Math.round((activeJob.processedCount / activeJob.totalCount) * 100)
    : 0;
  const visibleHistory = showAllHistory ? history : history.slice(0, 5);

  async function expandHistory() {
    if (!showAllHistory) {
      setShowAllHistory(true);
      return;
    }
    if (!hasMoreHistory) {
      setShowAllHistory(false);
      return;
    }
    setError(null);
    await loadHistory(ownerId, historyPage + 1, true).catch((reason: unknown) =>
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível carregar mais processamentos.",
      ),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <Alert variant="destructive" role="alert">
          <XCircle />
          <AlertTitle>Não foi possível continuar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="text-primary size-5" aria-hidden /> Nova
            atualização
          </CardTitle>
          <CardDescription>
            Selecione um CSV UTF-8 com as colunas <code>email;cnpjDoc</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field
              orientation="responsive"
              data-disabled={uploading || activeJob?.status === "running"}
            >
              <div className="flex-1">
                <FieldLabel htmlFor="active-update-file">
                  Arquivo CSV
                </FieldLabel>
                <FieldDescription>
                  {file
                    ? `${file.name} · ${file.size.toLocaleString("pt-BR")} bytes`
                    : "O arquivo é lido e enviado em blocos; não é carregado inteiro na memória."}
                </FieldDescription>
              </div>
              <Input
                id="active-update-file"
                type="file"
                accept=".csv,text/csv,text/plain"
                className="min-h-11 max-w-md"
                disabled={uploading || activeJob?.status === "running"}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <Button
                className="min-h-11"
                disabled={!file || uploading || activeJob?.status === "running"}
                onClick={() => void start()}
              >
                {uploading ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <Play data-icon="inline-start" />
                )}
                {uploading
                  ? `Importando ${uploadedRows.toLocaleString("pt-BR")}`
                  : "Iniciar atualização"}
              </Button>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {activeJob ? (
        <section
          className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,.75fr)]"
          aria-label="Processamento atual"
        >
          <Card>
            <CardHeader>
              <div>
                <Badge variant={statusVariant(activeJob.status)}>
                  <Clock3 data-icon="inline-start" />
                  {statusLabels[activeJob.status]}
                </Badge>
                <CardTitle className="mt-3 text-2xl">
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
                  className="bg-muted h-2.5 overflow-hidden rounded-full"
                  role="progressbar"
                  aria-label="Progresso do processamento"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <div
                    className="from-brand to-brand-lime h-full rounded-full bg-linear-to-r transition-[width] duration-200 motion-reduce:transition-none"
                    style={{ width: `${progress}%` }}
                  />
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
                    <p className="text-muted-foreground text-xs">
                      {stat.label}
                    </p>
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
            <CardFooter className="flex-wrap justify-between gap-3">
              <span className="text-muted-foreground text-xs">
                Dados completos aparecem somente nos arquivos de resultado.
              </span>
              <div className="flex flex-wrap gap-2">
                {activeJob.canControl && activeJob.status === "running" ? (
                  <Button
                    variant="outline"
                    onClick={() => void changeJob("pause")}
                  >
                    <Pause data-icon="inline-start" />
                    Pausar
                  </Button>
                ) : null}
                {activeJob.canControl && activeJob.status === "paused" ? (
                  <Button onClick={() => void changeJob("resume")}>
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

          <Card>
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
                        <p className="text-sm font-medium">
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
                <p className="text-muted-foreground py-8 text-center text-sm">
                  Os resultados aparecerão aqui assim que o primeiro bloco
                  terminar.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      <Card>
        <CardHeader>
          <div>
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
          </div>
          {isAdmin ? (
            <CardAction>
              <Select
                value={ownerId}
                onValueChange={(value) => {
                  const next = value ?? "all";
                  setOwnerId(next);
                  setShowAllHistory(false);
                  void loadHistory(next).catch((reason: unknown) =>
                    setError(
                      reason instanceof Error
                        ? reason.message
                        : "Não foi possível filtrar o histórico.",
                    ),
                  );
                }}
              >
                <SelectTrigger
                  className="h-11 min-w-52"
                  aria-label="Filtrar por colaborador"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Todos os colaboradores</SelectItem>
                    {collaborators.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          {visibleHistory.length ? (
            <>
              <div className="hidden overflow-hidden rounded-xl border md:block">
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
                        <TableCell className="font-medium">
                          {job.fileName}
                        </TableCell>
                        {isAdmin ? (
                          <TableCell>{job.ownerName}</TableCell>
                        ) : null}
                        <TableCell>
                          <Badge variant={statusVariant(job.status)}>
                            {statusLabels[job.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {job.updatedCount} atualizados · {job.failedCount}{" "}
                          falhas
                        </TableCell>
                        <TableCell>
                          {dateTime.format(new Date(job.createdAt))}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void loadJob(job.id)}
                          >
                            Abrir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="grid gap-3 md:hidden">
                {visibleHistory.map((job) => (
                  <button
                    type="button"
                    className="bg-card min-h-11 rounded-xl border p-4 text-left"
                    onClick={() => void loadJob(job.id)}
                    key={job.id}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <strong>{job.fileName}</strong>
                      <Badge variant={statusVariant(job.status)}>
                        {statusLabels[job.status]}
                      </Badge>
                    </span>
                    {isAdmin ? (
                      <span className="text-muted-foreground mt-2 block text-xs">
                        {job.ownerName}
                      </span>
                    ) : null}
                    <span className="text-muted-foreground mt-2 block text-xs">
                      {job.updatedCount} atualizados · {job.failedCount} falhas
                      · {dateTime.format(new Date(job.createdAt))}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground py-10 text-center text-sm">
              Nenhum processamento encontrado.
            </p>
          )}
        </CardContent>
        {history.length > 5 || hasMoreHistory ? (
          <CardFooter className="justify-center">
            <Button
              variant="ghost"
              disabled={loadingHistory}
              onClick={() => void expandHistory()}
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
    </div>
  );
}
