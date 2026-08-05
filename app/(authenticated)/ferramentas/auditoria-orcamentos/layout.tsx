import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { requirePrincipal } from "@/lib/auth/session";
import { getToolAccess } from "@/modules/tool-catalog/data";
import { redirect } from "next/navigation";

export default async function BudgetAuditLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const principal = await requirePrincipal("budget:compare");
  if (!(await getToolAccess(principal, "budget-comparison")).allowed) redirect("/acesso-negado");
  return <Suspense fallback={<BudgetAuditLoading />}>{children}</Suspense>;
}

function BudgetAuditLoading() {
  return (
    <div className="flex min-h-[50dvh] flex-col gap-6" aria-label="Carregando conteúdo" aria-busy="true">
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
