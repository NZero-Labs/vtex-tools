import { Suspense } from "react";

import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePrincipal } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const unstable_instant = false;

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AuthenticatedLoading />}>
      <AuthenticatedContent>{children}</AuthenticatedContent>
    </Suspense>
  );
}

async function AuthenticatedContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const principal = await requirePrincipal();
  if (principal.role === "VISITOR") redirect("/visitante");

  return (
    <SidebarProvider className="bg-sidebar">
      <AppSidebar user={principal} />
      <SidebarInset
        id="main-content"
        className="min-w-0 md:m-2 md:ml-0 md:rounded-2xl"
      >
        <AppHeader />
        <div className="mx-auto w-full max-w-[90rem] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AuthenticatedLoading() {
  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-[90rem] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8"
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
