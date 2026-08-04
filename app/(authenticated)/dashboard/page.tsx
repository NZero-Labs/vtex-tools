import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Search,
  Sparkles,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { requirePrincipal } from "@/lib/auth/session";
import {
  getPlatformUpdates,
  getVisibleTools,
} from "@/modules/tool-catalog/data";
import {
  ToolExplorer,
  type VisibleTool,
} from "@/modules/tool-catalog/presentation/tool-explorer";

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
  const recent = serializedTools
    .filter((tool) => tool.lastUsedAt)
    .sort((a, b) => (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? ""));
  const favoriteIds = new Set(favorites.map((tool) => tool.id));
  const quickAccess = [
    ...favorites,
    ...recent.filter((tool) => !favoriteIds.has(tool.id)),
  ].slice(0, 6);
  const availableTools = serializedTools.filter(
    (tool) => tool.status === "available" || tool.status === "beta",
  );

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <section className="flex flex-col gap-5 border-b pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <div className="text-primary mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.14em] uppercase">
            <span className="bg-primary size-1.5 rounded-full" aria-hidden />
            Área interna Amara
          </div>
          <h1 className="font-heading text-3xl leading-tight font-medium text-balance sm:text-4xl">
            {greeting()}, {principal.name.split(" ")[0]}.
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl leading-6">
            Encontre a ferramenta certa e avance com segurança nas operações
            VTEX.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/ferramentas/comparar-orcamentos"
            className={buttonVariants()}
          >
            Comparar orçamentos <ArrowRight data-icon="inline-end" />
          </Link>
          <Link
            href="#catalogo"
            className={buttonVariants({ variant: "outline" })}
          >
            Ver ferramentas
          </Link>
        </div>
      </section>

      <section
        id="catalogo"
        className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]"
        aria-labelledby="catalogo-titulo"
      >
        <Card className="min-w-0 border-transparent bg-card/85 shadow-lg shadow-primary/5 transition-[background-color,box-shadow] duration-300">
          <CardHeader className="border-b border-border/60 bg-background/20 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="bg-primary/10 text-primary hidden size-10 shrink-0 items-center justify-center rounded-xl sm:flex">
                <Sparkles aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle
                    id="catalogo-titulo"
                    className="text-xl sm:text-2xl"
                  >
                    Ferramentas
                  </CardTitle>
                  <Badge variant="secondary">
                    {availableTools.length} ativas
                  </Badge>
                </div>
                <CardDescription className="mt-1">
                  Filtre por categoria, status ou pesquise por uma função.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 sm:pt-6">
            <ToolExplorer tools={serializedTools} glass />
          </CardContent>
        </Card>

        <Card
          className="min-w-0 border-transparent bg-card/85 shadow-lg shadow-primary/5 transition-[background-color,box-shadow] duration-300 xl:sticky xl:top-6"
          aria-label="Seus atalhos"
        >
          <CardHeader className="border-b border-border/60 bg-background/20 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Clock3 aria-hidden />
                </span>
                <div className="min-w-0">
                  <CardTitle>Acesso rápido</CardTitle>
                  <CardDescription>
                    Favoritos e últimos acessos em um só lugar.
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0">
                {quickAccess.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            {quickAccess.length ? (
              <div className="flex flex-col gap-1">
                {quickAccess.map((tool) => {
                  const isFavorite = favoriteIds.has(tool.id);
                  const AccessIcon = isFavorite ? Star : Clock3;
                  return (
                    <Link
                      key={tool.id}
                      href={tool.route}
                      className="group flex min-h-14 items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <AccessIcon
                          className={cn(
                            isFavorite && "fill-brand-lime text-brand-leaf",
                          )}
                          aria-hidden
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-muted-foreground block text-xs">
                          {isFavorite ? "Favorito" : "Acesso recente"}
                        </span>
                        <span className="block truncate text-sm font-medium">
                          {tool.name}
                        </span>
                      </span>
                      <ArrowRight
                        className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-sm font-medium">Comece por uma ferramenta</p>
                <p className="text-muted-foreground mt-1 text-sm leading-5">
                  Seus favoritos e acessos recentes aparecerão aqui.
                </p>
              </div>
            )}
            <Link
              href={favorites.length ? "/favoritos" : "/ferramentas"}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "mt-3 w-full",
              })}
            >
              {favorites.length ? "Gerenciar favoritos" : "Ver catálogo"}
              <ArrowRight data-icon="inline-end" />
            </Link>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="novidades-titulo">
        <div className="mb-5 flex items-center gap-3">
          <Sparkles className="text-brand-leaf size-5" aria-hidden />
          <div>
            <h2
              id="novidades-titulo"
              className="font-heading text-xl font-medium"
            >
              Novidades
            </h2>
            <p className="text-muted-foreground mt-0.5 text-sm">
              O que mudou recentemente na plataforma.
            </p>
          </div>
        </div>
        {updates.length ? (
          <Card className="overflow-hidden">
            <div className="divide-y">
              {updates.map((update, index) => (
                <article
                  key={update.id}
                  className="group flex gap-3 p-4 transition-colors duration-200 hover:bg-muted/40 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 sm:gap-4 sm:p-5"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CheckCircle2
                    className="text-primary mt-0.5 size-4 shrink-0"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-primary text-xs font-semibold tracking-wide uppercase">
                      Atualização
                    </p>
                    <h3 className="mt-1 font-medium">{update.title}</h3>
                    <p className="text-muted-foreground mt-1 text-sm leading-5">
                      {update.summary}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </Card>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>Nenhuma novidade publicada</EmptyTitle>
              <EmptyDescription>
                As atualizações da plataforma aparecerão aqui.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  );
}
