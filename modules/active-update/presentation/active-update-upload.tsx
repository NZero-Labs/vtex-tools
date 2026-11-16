"use client";

import { useState } from "react";
import { FileSpreadsheet, FileUp, Play, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const formatBytes = (bytes: number) =>
  bytes >= 1_048_576
    ? `${(bytes / 1_048_576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("pt-BR")} KB`;

export function ActiveUpdateUpload({
  file,
  uploading,
  uploadedRows,
  processing,
  onFileChange,
  onStart,
}: {
  file: File | null;
  uploading: boolean;
  uploadedRows: number;
  processing: boolean;
  onFileChange: (file: File | null) => void;
  onStart: () => Promise<void>;
}) {
  const [dragging, setDragging] = useState(false);
  const disabled = uploading || processing;

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const next = event.dataTransfer.files?.[0] ?? null;
    if (next) onFileChange(next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="text-primary size-5" aria-hidden /> Nova atualização
        </CardTitle>
        <CardDescription>
          Envie a lista de clientes com as colunas <code>email</code> e{" "}
          <code>cnpjDoc</code>. O andamento aparece em tempo real logo abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {file ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3">
              <div className="bg-accent text-accent-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
                <FileSpreadsheet className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{file.name}</p>
                <p className="text-muted-foreground text-xs">{formatBytes(file.size)}</p>
              </div>
              {!disabled ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remover arquivo"
                  onClick={() => onFileChange(null)}
                >
                  <X className="size-4" aria-hidden />
                </Button>
              ) : null}
            </div>
            <Button
              className="min-h-11 sm:shrink-0"
              disabled={disabled}
              onClick={() => void onStart()}
            >
              {uploading ? <Spinner data-icon="inline-start" /> : <Play data-icon="inline-start" />}
              {uploading
                ? `Importando ${uploadedRows.toLocaleString("pt-BR")} registros`
                : "Iniciar atualização"}
            </Button>
          </div>
        ) : (
          <label
            onDragOver={(event) => {
              event.preventDefault();
              if (!disabled) setDragging(true);
            }}
            onDragLeave={(event) => {
              if (event.currentTarget === event.target) setDragging(false);
            }}
            onDrop={handleDrop}
            className={cn(
              "flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-background/40 p-6 text-center transition-colors",
              "hover:border-primary/60 hover:bg-primary/[0.03]",
              dragging && "border-primary bg-primary/5",
              disabled && "pointer-events-none opacity-60",
            )}
          >
            <input
              type="file"
              accept=".csv,.xlsx,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              aria-label="Arquivo CSV ou Excel"
              disabled={disabled}
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            />
            <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
              <FileUp className="size-6" aria-hidden />
            </div>
            <div>
              <p className="font-medium">
                Arraste o CSV ou Excel aqui <span className="text-muted-foreground">ou clique para selecionar</span>
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                <code>email;cnpjDoc</code> · CSV ou XLSX
              </p>
            </div>
          </label>
        )}
      </CardContent>
    </Card>
  );
}
