import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requirePrincipal } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const principal = await requirePrincipal();
  if (principal.role === "VISITOR") redirect("/visitante");

  return (
    <SidebarProvider className="bg-sidebar">
      <AppSidebar user={principal} />
      <SidebarInset id="main-content" className="min-w-0 md:m-2 md:ml-0 md:rounded-2xl">
        <AppHeader />
        <div className="mx-auto w-full max-w-[90rem] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
