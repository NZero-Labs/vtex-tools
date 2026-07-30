import { activeUpdateHistoryQuerySchema, createActiveUpdateJobSchema } from "@/modules/active-update/domain/active-update";
import { createActiveUpdateJob, getActiveUpdatePrincipal, listActiveUpdateJobs } from "@/modules/active-update/data";

export async function GET(request: Request) {
  const access = await getActiveUpdatePrincipal();
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const query = activeUpdateHistoryQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return Response.json({ error: "Filtro de histórico inválido." }, { status: 400 });
  return Response.json(await listActiveUpdateJobs(access.principal, query.data.ownerId, query.data.page));
}

export async function POST(request: Request) {
  const access = await getActiveUpdatePrincipal();
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const parsed = createActiveUpdateJobSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Arquivo inválido." }, { status: 400 });
  return Response.json(await createActiveUpdateJob(access.principal, parsed.data.fileName), { status: 201 });
}
