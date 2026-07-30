"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpenCheck, FileDiff, Grid2X2, Heart, KeyRound, LogOut, Settings, ShieldCheck, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/brand-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import type { Role } from "@/lib/auth/permissions";

const primaryItems = [
  { href: "/dashboard", label: "Visão geral", icon: Grid2X2 },
  { href: "/ferramentas", label: "Ferramentas", icon: FileDiff },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
];

const adminItems = [
  { href: "/admin", label: "Administração", icon: ShieldCheck },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/permissoes", label: "Permissões", icon: KeyRound },
  { href: "/admin/ferramentas", label: "Catálogo", icon: Settings },
  { href: "/admin/auditoria", label: "Auditoria", icon: BookOpenCheck },
];

export function AppSidebar({ user }: { user: { name: string; email: string; role: Role } }) {
  const pathname = usePathname();
  const router = useRouter();
  const initials = user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  async function signOut() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  const menu = (items: typeof primaryItems) => (
    <SidebarMenu>
      {items.map(({ href, label, icon: Icon }) => (
        <SidebarMenuItem key={href}>
          <SidebarMenuButton
            render={<Link href={href} />}
            isActive={pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))}
            tooltip={label}
            className="h-10 px-3"
          >
            <Icon />
            <span>{label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <Link href="/dashboard" className="flex h-11 items-center overflow-hidden rounded-md focus-visible:outline-2 focus-visible:outline-sidebar-ring">
          <BrandLogo className="w-40 shrink-0 brightness-0 invert group-data-[collapsible=icon]:hidden" />
          <span className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary font-heading text-xl font-bold text-sidebar-primary-foreground group-data-[collapsible=icon]:flex">V</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
          <SidebarGroupContent>{menu(primaryItems)}</SidebarGroupContent>
        </SidebarGroup>
        {user.role === "ADMIN" && (
          <SidebarGroup>
            <SidebarGroupLabel>Gestão</SidebarGroupLabel>
            <SidebarGroupContent>{menu(adminItems)}</SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/perfil" />} size="lg" tooltip="Perfil e preferências">
              <Avatar className="size-8 rounded-lg"><AvatarFallback className="rounded-lg bg-sidebar-accent text-xs text-sidebar-accent-foreground">{initials}</AvatarFallback></Avatar>
              <span className="min-w-0 flex-1"><span className="block truncate font-medium">{user.name}</span><span className="block truncate text-xs text-sidebar-foreground/60">{user.email}</span></span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Sair"><LogOut /><span>Sair</span></SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
