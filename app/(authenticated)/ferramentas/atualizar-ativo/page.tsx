import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/authenticated/page-header";
import { requirePrincipal } from "@/lib/auth/session";
import {
  getActiveUpdateJob,
  listActiveUpdateJobs,
} from "@/modules/active-update/data";
import { ActiveUpdateTool } from "@/modules/active-update/presentation/active-update-tool";
import { getToolAccess } from "@/modules/tool-catalog/data";

export const metadata: Metadata = { title: "Atualizar ativo" };

export default async function ActiveUpdatePage() {
  const principal = await requirePrincipal("active:update");
  if (!(await getToolAccess(principal, "active-update")).allowed)
    redirect("/acesso-negado");
  const initialHistory = await listActiveUpdateJobs(principal);
  const initialJob = initialHistory.activeJobId
    ? await getActiveUpdateJob(principal, initialHistory.activeJobId)
    : null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Operação de clientes"
        title="Atualize em escala. Acompanhe cada linha."
        description="Importe o CSV, acompanhe os resultados mascarados e retome o processamento quando precisar."
      />
      <ActiveUpdateTool
        isAdmin={principal.role === "ADMIN"}
        initialHistory={initialHistory}
        initialJob={initialJob}
      />
    </div>
  );
}
