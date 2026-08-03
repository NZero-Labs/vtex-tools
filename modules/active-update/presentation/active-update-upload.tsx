"use client";

import { Play, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Spinner } from "@/components/ui/spinner";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="text-primary size-5" aria-hidden /> Nova atualização
        </CardTitle>
        <CardDescription>
          Selecione um CSV UTF-8 com as colunas <code>email;cnpjDoc</code>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field orientation="responsive" data-disabled={uploading || processing}>
            <div className="min-w-0 flex-1">
              <FieldLabel htmlFor="active-update-file">Arquivo CSV</FieldLabel>
              <FieldDescription className="break-words">
                {file
                  ? `${file.name} · ${file.size.toLocaleString("pt-BR")} bytes`
                  : "O arquivo é lido e enviado em blocos; não é carregado inteiro na memória."}
              </FieldDescription>
            </div>
            <Input
              id="active-update-file"
              type="file"
              accept=".csv,text/csv,text/plain"
              className="min-h-11 min-w-0 md:max-w-md"
              disabled={uploading || processing}
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            />
            <Button className="min-h-11" disabled={!file || uploading || processing} onClick={() => void onStart()}>
              {uploading ? <Spinner data-icon="inline-start" /> : <Play data-icon="inline-start" />}
              {uploading ? `Importando ${uploadedRows.toLocaleString("pt-BR")}` : "Iniciar atualização"}
            </Button>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
