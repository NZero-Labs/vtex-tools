"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

const titles: Record<string, string> = {
  "/dashboard": "Visão geral",
  "/ferramentas": "Ferramentas",
  "/favoritos": "Favoritos",
  "/ferramentas/comparar-orcamentos": "Comparação de orçamentos",
  "/perfil": "Perfil e preferências",
  "/admin": "Administração",
  "/admin/usuarios": "Usuários",
  "/admin/permissoes": "Permissões",
  "/admin/ferramentas": "Catálogo",
  "/admin/auditoria": "Log de auditoria",
};

export function AppHeader() {
  const pathname = usePathname();
  const title = titles[pathname] ?? "VTEX Tools";

  return (
    <header className="bg-background/85 sticky top-0 z-20 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-md md:px-7">
      <SidebarTrigger aria-label="Alternar navegação" />
      <Separator orientation="vertical" className="h-5" />
      <p className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</p>
      <Link href="/ferramentas" className={buttonVariants({ variant: "outline", className: "text-muted-foreground hidden w-60 justify-start font-normal lg:flex" })}>
        <Search data-icon="inline-start" /> Buscar ferramentas
        <kbd className="bg-muted ml-auto rounded border px-1.5 py-0.5 text-[10px]">⌘ K</kbd>
      </Link>
      <ThemeToggle />
    </header>
  );
}
