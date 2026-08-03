import Link from "next/link";
import { ArrowRight, Clock3, Search, Sparkles, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { requirePrincipal } from "@/lib/auth/session";
import { getPlatformUpdates, getVisibleTools } from "@/modules/tool-catalog/data";
import { ToolExplorer, type VisibleTool } from "@/modules/tool-catalog/presentation/tool-explorer";

const greeting = () => {
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: "America/Sao_Paulo",
    }).format(new Date()),
  );
  return hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
};

export default async function DashboardPage() {
  const principal = await requirePrincipal("dashboard:view");
  const [tools, updates] = await Promise.all([
    getVisibleTools(principal),
    getPlatformUpdates(),
  ]);
  const serializedTools: VisibleTool[] = tools.map((tool) => ({
    ...tool,
    lastUsedAt: tool.lastUsedAt?.toISOString(),
  }));
  const favorites = serializedTools.filter((tool) => tool.favorite);
  const recent = serializedTools.filter((tool) => tool.lastUsedAt).sort((a, b) => (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? ""));

  return (
    <div className="flex flex-col gap-10 lg:gap-12">
      <section className="bg-sidebar text-sidebar-foreground relative overflow-hidden rounded-3xl px-6 py-8 sm:px-9 sm:py-10">
        <div className="border-sidebar-primary/20 absolute -top-24 -right-20 size-72 rounded-full border-[3rem]" aria-hidden />
        <div className="relative max-w-3xl">
          <Badge variant="outline" className="border-sidebar-border text-sidebar-foreground mb-5">
            Área interna Amara
          </Badge>
          <h1 className="font-heading text-4xl leading-tight font-medium text-balance sm:text-5xl">
            {greeting()}, {principal.name.split(" ")[0]}.
          </h1>
          <p className="text-sidebar-foreground/70 mt-3 max-w-2xl text-base leading-7">
            Encontre a ferramenta certa e avance com segurança nas operações VTEX.
          </p>
          <Link href="/ferramentas/comparar-orcamentos" className={buttonVariants({ variant: "secondary", className: "mt-7" })}>
            Comparar orçamentos <ArrowRight data-icon="inline-end" />
          </Link>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2" aria-label="Seus atalhos">
        <Card>
          <CardHeader>
            <Star className="text-brand-leaf mb-2 size-5" aria-hidden />
            <CardTitle>Favoritos</CardTitle>
            <CardDescription>Acesso rápido ao que você mais usa.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {favorites.length ? favorites.slice(0, 4).map((tool) => (
              <Link key={tool.id} href={tool.route} className={buttonVariants({ variant: "ghost", className: "w-full justify-between" })}>
                {tool.name}<ArrowRight data-icon="inline-end" />
              </Link>
            )) : <p className="text-muted-foreground py-3 text-sm">Favorite uma ferramenta para encontrá-la aqui.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Clock3 className="text-brand mb-2 size-5" aria-hidden />
            <CardTitle>Usadas recentemente</CardTitle>
            <CardDescription>Continue de onde parou.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {recent.length ? recent.slice(0, 4).map((tool) => (
              <Link key={tool.id} href={tool.route} className={buttonVariants({ variant: "ghost", className: "w-full justify-between" })}>
                {tool.name}<ArrowRight data-icon="inline-end" />
              </Link>
            )) : <p className="text-muted-foreground py-3 text-sm">As ferramentas abertas aparecerão aqui.</p>}
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-primary mb-2 text-xs font-bold tracking-[0.14em] uppercase">Catálogo</p>
            <h2 className="font-heading text-3xl font-medium">Ferramentas para o seu dia</h2>
          </div>
          <Link href="/ferramentas" className={buttonVariants({ variant: "ghost", className: "hidden sm:flex" })}>Ver catálogo <ArrowRight data-icon="inline-end" /></Link>
        </div>
        <ToolExplorer tools={serializedTools} />
      </section>

      <section>
        <div className="mb-5 flex items-center gap-3">
          <Sparkles className="text-brand-leaf size-5" aria-hidden />
          <h2 className="font-heading text-2xl font-medium">Novidades</h2>
        </div>
        {updates.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {updates.map((update) => (
              <Card key={update.id} size="sm">
                <CardHeader>
                  <CardTitle>{update.title}</CardTitle>
                  <CardDescription>{update.summary}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon"><Search /></EmptyMedia>
              <EmptyTitle>Nenhuma novidade publicada</EmptyTitle>
              <EmptyDescription>As atualizações da plataforma aparecerão aqui.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  );
}
