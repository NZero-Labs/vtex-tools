import { deleteExpiredActiveUpdates } from "@/modules/active-update/data";
import { getServerEnv } from "@/lib/env";

export async function GET(request: Request) {
  const secret = getServerEnv().CRON_SECRET;
  if (!secret) return Response.json({ error: "Retenção não configurada." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Acesso negado." }, { status: 401 });
  const deleted = await deleteExpiredActiveUpdates();
  return Response.json({ deleted: deleted.length });
}
