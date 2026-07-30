import { activeUpdateJobActionSchema } from "@/modules/active-update/domain/active-update";
import { changeActiveUpdateJob, getActiveUpdateJob, getActiveUpdatePrincipal } from "@/modules/active-update/data";

type Context = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const access = await getActiveUpdatePrincipal();
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const job = await getActiveUpdateJob(access.principal, (await params).jobId);
  return job ? Response.json(job) : Response.json({ error: "Processamento não encontrado." }, { status: 404 });
}

export async function PATCH(request: Request, { params }: Context) {
  const access = await getActiveUpdatePrincipal();
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const parsed = activeUpdateJobActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Ação inválida." }, { status: 400 });
  const result = await changeActiveUpdateJob(access.principal, (await params).jobId, parsed.data.action, parsed.data.message);
  return result.ok ? Response.json(result) : Response.json({ error: result.error }, { status: result.status });
}
