import { z } from "zod";

import { getActiveUpdateExportJob, getActiveUpdatePrincipal } from "@/modules/active-update/data";
import { activeUpdateExportFilename, createActiveUpdateExportStream } from "@/modules/active-update/infrastructure/export-active-update";

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string; format: string }> }) {
  const access = await getActiveUpdatePrincipal();
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const values = await params;
  const format = z.enum(["csv", "json"]).safeParse(values.format);
  if (!format.success) return Response.json({ error: "Formato inválido." }, { status: 400 });
  const job = await getActiveUpdateExportJob(access.principal, values.jobId);
  if (!job) return Response.json({ error: "Processamento não encontrado." }, { status: 404 });
  if (job.status !== "paused" && job.status !== "completed") {
    return Response.json({ error: "Pause ou conclua o processamento antes de baixar o resultado." }, { status: 409 });
  }

  return new Response(createActiveUpdateExportStream(job, format.data), {
    headers: {
      "Content-Type": format.data === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${activeUpdateExportFilename(job.fileName, format.data)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
