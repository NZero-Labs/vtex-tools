"use client";

import { useCallback, useEffect, useState } from "react";
import { XCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  parseActiveUpdateCsv,
  UPLOAD_BATCH_SIZE,
  type ActiveUpdateJobDetailsDto,
  type ActiveUpdateJobDto,
  type ActiveUpdateRow,
} from "../domain/active-update";
import { ActiveUpdateHistory } from "./active-update-history";
import { ActiveUpdateProgress } from "./active-update-progress";
import { ActiveUpdateUpload } from "./active-update-upload";

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

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

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
          const next = await api<ActiveUpdateJobDto>(
            `/api/active-updates/${activeJob.id}/process`,
            { method: "POST" },
          );
          if (stopped) return;
          setActiveJob((current) => (current ? { ...current, ...next } : current));
          if (next.status !== "running") {
            await loadJob(activeJob.id);
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
    loadJob,
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

  async function changeHistoryOwner(nextOwnerId: string) {
    setOwnerId(nextOwnerId);
    setShowAllHistory(false);
    setError(null);
    await loadHistory(nextOwnerId).catch((reason: unknown) =>
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível filtrar o histórico.",
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

      <ActiveUpdateUpload
        file={file}
        uploading={uploading}
        uploadedRows={uploadedRows}
        processing={activeJob?.status === "running"}
        onFileChange={setFile}
        onStart={start}
      />

      {activeJob ? (
        <ActiveUpdateProgress
          activeJob={activeJob}
          progress={progress}
          onChangeJob={changeJob}
        />
      ) : null}

      <ActiveUpdateHistory
        isAdmin={isAdmin}
        history={history}
        collaborators={collaborators}
        ownerId={ownerId}
        showAllHistory={showAllHistory}
        hasMoreHistory={hasMoreHistory}
        loadingHistory={loadingHistory}
        onOwnerChange={changeHistoryOwner}
        onOpenJob={loadJob}
        onExpand={expandHistory}
      />
    </div>
  );
}
