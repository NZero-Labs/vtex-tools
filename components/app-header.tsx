"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

const titles: Record<string, string> = {
  "/dashboard": "Visão geral",
  "/ferramentas": "Ferramentas",
  "/favoritos": "Favoritos",
  "/ferramentas/atualizar-ativo": "Atualizar ativo",
  "/ferramentas/comparar-orcamentos": "Comparação de orçamentos",
  "/ferramentas/auditoria-orcamentos": "Auditoria de orçamentos",
  "/ferramentas/auditoria-orcamentos/orcamentos": "Orçamentos",
  "/ferramentas/auditoria-orcamentos/carrinho": "Orçamento e carrinho",
  "/ferramentas/auditoria-orcamentos/versoes": "Versões do orçamento",
  "/perfil": "Perfil e preferências",
  "/admin": "Administração",
  "/admin/usuarios": "Usuários",
  "/admin/permissoes": "Permissões",
  "/admin/ferramentas": "Catálogo",
  "/admin/auditoria": "Log de auditoria",
};

const parentTitles: Record<string, { href: string; label: string }> = {
  "/ferramentas/": { href: "/ferramentas", label: "Ferramentas" },
  "/admin/": { href: "/admin", label: "Administração" },
};

export function AppHeader() {
  const pathname = usePathname();
  const title = titles[pathname] ?? "VTEX Tools";
  const parent = Object.entries(parentTitles).find(([prefix]) =>
    pathname.startsWith(prefix),
  )?.[1];

  return (
    <header className="bg-background/92 sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-3 backdrop-blur-md sm:px-5 lg:px-7">
      <SidebarTrigger aria-label="Alternar navegação" />
      <Separator orientation="vertical" className="mx-1 h-4" />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap overflow-hidden">
          {parent && (
            <>
              <BreadcrumbItem className="hidden sm:inline-flex">
                <BreadcrumbLink render={<Link href={parent.href} />}>
                  {parent.label}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
            </>
          )}
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate text-sm font-medium">{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Link
        href="/ferramentas"
        className={buttonVariants({
          variant: "outline",
          size: "sm",
          className: "text-muted-foreground hidden justify-start font-normal md:flex",
        })}
      >
        <Search data-icon="inline-start" /> Ferramentas
      </Link>
      <ThemeToggle />
    </header>
  );
}
