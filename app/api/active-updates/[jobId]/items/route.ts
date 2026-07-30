import { appendActiveUpdateItemsSchema } from "@/modules/active-update/domain/active-update";
import { appendActiveUpdateItems, getActiveUpdatePrincipal } from "@/modules/active-update/data";

export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const access = await getActiveUpdatePrincipal();
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const parsed = appendActiveUpdateItemsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Registros inválidos." }, { status: 400 });
  const result = await appendActiveUpdateItems(access.principal, (await params).jobId, parsed.data.rows);
  return result.ok ? Response.json(result) : Response.json({ error: result.error }, { status: result.status });
}
