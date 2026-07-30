import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requirePrincipal } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const principal = await requirePrincipal("dashboard:view");

  return (
    <SidebarProvider>
      <AppSidebar user={principal} />
      <SidebarInset id="main-content">
        <AppHeader />
        <div className="mx-auto w-full max-w-[96rem] flex-1 px-4 py-7 sm:px-6 md:px-8 md:py-10">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
