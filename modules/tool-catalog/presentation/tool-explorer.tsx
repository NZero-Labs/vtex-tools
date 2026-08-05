"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, FileDiff, RotateCcw, Search, Star, UserRoundCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toggleFavorite } from "../actions";
import type { ToolStatus } from "../catalog";

export type VisibleTool = {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: "files" | "user-check";
  category: string;
  tags: readonly string[];
  status: ToolStatus;
  favorite: boolean;
  lastUsedAt?: string;
};

const statusLabel: Record<ToolStatus, string> = {
  available: "Disponível",
  beta: "Beta",
  maintenance: "Manutenção",
  "coming-soon": "Em breve",
};

type ToolExplorerProps = {
  tools: VisibleTool[];
  favoritesOnly?: boolean;
  glass?: boolean;
};

function ToolCard({ tool, glass }: { tool: VisibleTool; glass: boolean }) {
  const available = tool.status === "available" || tool.status === "beta";
  const Icon = tool.icon === "user-check" ? UserRoundCheck : FileDiff;
  const cardContent = (
    <div className="flex min-h-56 flex-col">
      <CardHeader className="px-4 pt-4 sm:px-5 sm:pt-5">
        <div className="flex items-start gap-3 pr-10">
          <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl transition-[background-color,transform] duration-200 group-hover:scale-105 group-hover:bg-primary/15">
            <Icon aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base leading-5">{tool.name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-3 leading-5">{tool.description}</CardDescription>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tool.tags.slice(0, 3).map((tag) => <Badge key={tag} variant="outline" className="bg-background/35 text-xs font-normal">{tag}</Badge>)}
        </div>
      </CardHeader>
      <CardContent className="mt-auto px-4 pb-4 sm:px-5 sm:pb-5">
        <Separator className="mb-3 bg-border/70" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            <Badge variant={tool.status === "maintenance" ? "destructive" : tool.status === "available" ? "secondary" : "outline"}>{statusLabel[tool.status]}</Badge>
            <Badge variant="outline" className="max-w-32 truncate">{tool.category}</Badge>
          </div>
          {available ? <ArrowUpRight className="text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden /> : null}
        </div>
      </CardContent>
    </div>
  );

  return (
    <Card className={cn(
      "group relative overflow-hidden p-0 transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-1 hover:bg-card/90 hover:shadow-xl hover:shadow-primary/10 focus-within:ring-2 focus-within:ring-ring/60",
      glass && "border-border/60 bg-card/85",
    )}>
      {available ? <Link href={tool.route} aria-label={`Abrir ${tool.name}`} className="block rounded-[inherit] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">{cardContent}</Link> : <div aria-disabled="true" className="opacity-75">{cardContent}</div>}
      <form action={toggleFavorite.bind(null, tool.id)} className="absolute top-3 right-3">
        <Button type="submit" variant="ghost" size="icon-lg" className="size-11 rounded-full bg-background/90 text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground" aria-label={tool.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
          <Star className={cn(tool.favorite && "fill-brand-lime text-brand-leaf")} aria-hidden />
        </Button>
      </form>
    </Card>
  );
}

const ALL_FILTER = "all";

export function ToolExplorer({ tools, favoritesOnly = false, glass = false }: ToolExplorerProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL_FILTER);
  const [category, setCategory] = useState(ALL_FILTER);
  const categories = [...new Set(tools.map((tool) => tool.category))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const visible = tools.filter((tool) => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return (
      (!favoritesOnly || tool.favorite) &&
      (status === ALL_FILTER || tool.status === status) &&
      (category === ALL_FILTER || tool.category === category) &&
      (!term || `${tool.name} ${tool.description} ${tool.tags.join(" ")}`.toLocaleLowerCase("pt-BR").includes(term))
    );
  });

  const hasFilters = Boolean(search.trim() || status !== ALL_FILTER || category !== ALL_FILTER);

  function clearFilters() {
    setSearch("");
    setStatus(ALL_FILTER);
    setCategory(ALL_FILTER);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className={cn(
        "relative isolate overflow-hidden rounded-3xl border p-3 shadow-sm sm:p-4",
        glass
          ? "border-border/60 bg-background/85 shadow-lg shadow-primary/5"
          : "bg-card/70",
      )}>
        {glass ? <><span className="pointer-events-none absolute -top-20 -right-14 size-44 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--brand-lime)_15%,transparent),transparent_68%)]" aria-hidden /><span className="pointer-events-none absolute -bottom-24 -left-16 size-40 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--brand)_10%,transparent),transparent_68%)]" aria-hidden /></> : null}
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-primary text-[0.7rem] font-bold tracking-[0.16em] uppercase">Busca inteligente</p>
              <p className="text-muted-foreground mt-1 text-sm">Encontre uma ferramenta por nome, categoria ou função.</p>
            </div>
            <Badge variant="outline" className="bg-background/45">{visible.length} {visible.length === 1 ? "resultado" : "resultados"}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(16rem,1fr)_minmax(10rem,12rem)_minmax(10rem,12rem)]" role="group" aria-label="Filtros do catálogo">
          <Field className="sm:col-span-2 lg:col-span-1">
            <FieldLabel htmlFor="tool-search" className="sr-only">Buscar ferramentas</FieldLabel>
            <InputGroup className="h-11 bg-background/85 shadow-sm">
              <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
              <InputGroupInput
                id="tool-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome, tag ou função…"
              />
            </InputGroup>
          </Field>
          <Select value={category} onValueChange={(value) => setCategory(value ?? ALL_FILTER)}>
            <SelectTrigger className="h-11 w-full bg-background/55" aria-label="Filtrar por categoria"><SelectValue>{(value) => value === ALL_FILTER ? "Todas as categorias" : String(value)}</SelectValue></SelectTrigger>
            <SelectContent><SelectGroup><SelectItem value={ALL_FILTER}>Todas as categorias</SelectItem>{categories.map((item) => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
          <Select value={status} onValueChange={(value) => setStatus(value ?? ALL_FILTER)}>
            <SelectTrigger className="h-11 w-full bg-background/55" aria-label="Filtrar por status"><SelectValue>{(value) => value === ALL_FILTER ? "Todos os status" : statusLabel[value as ToolStatus] ?? "Status"}</SelectValue></SelectTrigger>
            <SelectContent><SelectGroup><SelectItem value={ALL_FILTER}>Todos os status</SelectItem>{Object.entries(statusLabel).map(([value, label]) => <SelectItem value={value} key={value}>{label}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
          </div>
          <Separator className="bg-border/60" />
          <div className="text-muted-foreground flex min-h-6 items-center justify-between gap-3 text-sm" aria-live="polite">
            <span>{hasFilters ? "Filtros aplicados" : "Todas as ferramentas disponíveis"}</span>
            {hasFilters && <Button type="button" variant="ghost" size="sm" className="-my-1" onClick={clearFilters}><RotateCcw data-icon="inline-start" /> Limpar filtros</Button>}
          </div>
        </div>
      </div>

      {visible.length ? <div className="grid gap-4 sm:grid-cols-2">{visible.map((tool) => <ToolCard key={tool.id} tool={tool} glass={glass} />)}</div> : (
        <Empty className="min-h-64 border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Search /></EmptyMedia>
            <EmptyTitle>Nenhuma ferramenta encontrada</EmptyTitle>
            <EmptyDescription>{favoritesOnly ? "Favorite uma ferramenta no catálogo para encontrá-la aqui." : "Ajuste a busca ou os filtros para ver outras opções."}</EmptyDescription>
          </EmptyHeader>
          {hasFilters && <Button type="button" variant="outline" onClick={clearFilters}>Limpar filtros</Button>}
        </Empty>
      )}
    </div>
  );
}
