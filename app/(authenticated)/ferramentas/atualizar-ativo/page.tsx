import type { Metadata } from "next";
import { redirect } from "next/navigation";

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
    <div>
      <header className="relative mb-8 overflow-hidden rounded-3xl border bg-card px-6 py-8 sm:px-9 sm:py-10">
        <div
          aria-hidden
          className="bg-accent absolute -top-20 -right-14 size-64 rounded-full"
        />
        <div
          aria-hidden
          className="border-primary/20 absolute top-8 right-28 size-28 rounded-full border"
        />
        <div className="relative max-w-3xl">
          <p className="text-brand mb-2 text-xs font-bold tracking-[0.16em] uppercase">
            Operação de clientes
          </p>
          <h1 className="font-heading text-4xl leading-none font-medium text-balance sm:text-6xl">
            Atualize em escala. Acompanhe cada linha.
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl leading-7">
            Importe o CSV, acompanhe os resultados mascarados e retome o
            processamento quando precisar.
          </p>
        </div>
      </header>
      <ActiveUpdateTool
        isAdmin={principal.role === "ADMIN"}
        initialHistory={initialHistory}
        initialJob={initialJob}
      />
    </div>
  );
}
