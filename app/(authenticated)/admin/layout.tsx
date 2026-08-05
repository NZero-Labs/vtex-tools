import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { requirePrincipal } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePrincipal("users:manage");
  return <Suspense fallback={<AdminLoading />}>{children}</Suspense>;
}

function AdminLoading() {
  return (
    <main
      className="flex min-h-[60dvh] flex-col gap-6"
      aria-label="Carregando conteúdo"
      aria-busy="true"
    >
      <div className="flex items-center gap-3 border-b pb-6">
        <Skeleton className="size-10 rounded-xl" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-64 max-w-full" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </main>
  );
}
