import { getServerEnv } from "@/lib/env";
import { claimActiveUpdateItems, getActiveUpdateJob, getActiveUpdatePrincipal, saveActiveUpdateResults } from "@/modules/active-update/data";
import { processActiveUpdateRow } from "@/modules/active-update/infrastructure/vtex-active-update-repository";

export const maxDuration = 60;

export async function POST(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const access = await getActiveUpdatePrincipal();
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const jobId = (await params).jobId;
  const rows = await claimActiveUpdateItems(access.principal, jobId);
  if (rows.length) {
    const env = getServerEnv();
    const results = await Promise.all(rows.map(async (row) => ({
      rowNumber: row.rowNumber,
      result: await processActiveUpdateRow(row, env),
    })));
    await saveActiveUpdateResults(jobId, results);
  }
  const job = await getActiveUpdateJob(access.principal, jobId);
  return job ? Response.json(job) : Response.json({ error: "Processamento não encontrado." }, { status: 404 });
}
