"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpenCheck,
  FileDiff,
  Grid2X2,
  Heart,
  KeyRound,
  LoaderCircle,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  useSidebar,
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

type NavigationItem = (typeof primaryItems)[number];

function getActiveHref(items: NavigationItem[], pathname: string) {
  const exactMatch = items.find((item) => item.href === pathname);
  if (exactMatch) return exactMatch.href;

  return items
    .filter((item) => pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

export function AppSidebar({ user }: { user: { name: string; email: string; image: string | null; role: Role } }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const [pendingHref, setPendingHref] = useState<string>();
  const initials = user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const visiblePendingHref = pendingHref === pathname ? undefined : pendingHref;

  async function signOut() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  function handleNavigation(href: string) {
    if (href === pathname) return;
    setPendingHref(href);
    if (isMobile) setOpenMobile(false);
  }

  const menu = (items: NavigationItem[]) => {
    const activeHref = getActiveHref(items, pathname);

    return (
      <SidebarMenu>
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = activeHref === href;
          const isPending = visiblePendingHref === href;

          return (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton
                render={<Link href={href} prefetch aria-label={label} aria-current={isActive ? "page" : undefined} aria-busy={isPending || undefined} />}
                isActive={isActive}
                tooltip={label}
                onClick={() => handleNavigation(href)}
                onMouseEnter={() => router.prefetch(href)}
                onFocus={() => router.prefetch(href)}
                className={isPending ? "text-sidebar-foreground/70" : undefined}
              >
                {isPending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden /> : <Icon />}
                <span>{label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    );
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="p-3 pb-2 group-data-[collapsible=icon]:p-2">
        <Link href="/dashboard" className="flex h-16 items-center justify-start overflow-hidden rounded-lg px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:justify-center">
          <BrandLogo className="h-auto w-[8.5rem] max-w-full shrink-0 object-left dark:brightness-0 dark:invert group-data-[collapsible=icon]:hidden" />
          <Image
            src="/favicon.ico"
            alt="Amara Net Zero"
            width={40}
            height={40}
            unoptimized
            className="hidden size-10 shrink-0 rounded-xl object-contain group-data-[collapsible=icon]:block"
          />
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
            <SidebarMenuButton render={<Link href="/perfil" aria-label="Perfil e preferências" />} size="lg" tooltip="Perfil e preferências" onClick={() => isMobile && setOpenMobile(false)}>
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={user.image ?? undefined} alt="" className="rounded-lg" />
                <AvatarFallback className="rounded-lg bg-sidebar-accent text-xs text-sidebar-accent-foreground">{initials}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{user.name}</span>
                <span className="block truncate text-xs text-sidebar-foreground/60">{user.email}</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} aria-label="Sair" tooltip="Sair"><LogOut /><span>Sair</span></SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
