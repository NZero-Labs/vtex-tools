"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, FileDiff, RotateCcw, Search, Star, UserRoundCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

function ToolCard({ tool }: { tool: VisibleTool }) {
  const available = tool.status === "available" || tool.status === "beta";
  const Icon = tool.icon === "user-check" ? UserRoundCheck : FileDiff;

  return (
    <Card className="group relative transition-transform duration-200 hover:-translate-y-0.5">
      <CardHeader>
        <div className="bg-accent text-accent-foreground mb-4 flex size-11 items-center justify-center rounded-xl">
          <Icon className="size-5" aria-hidden />
        </div>
        <CardTitle className="pr-10 text-xl">{tool.name}</CardTitle>
        <CardDescription className="mt-1 leading-6">{tool.description}</CardDescription>
        <CardAction>
          <form action={toggleFavorite.bind(null, tool.id)}>
            <Button type="submit" variant="ghost" size="icon-sm" aria-label={tool.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
              <Star className={cn(tool.favorite && "fill-brand-lime text-brand-leaf")} aria-hidden />
            </Button>
          </form>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Badge variant={tool.status === "maintenance" ? "destructive" : tool.status === "available" ? "secondary" : "outline"}>{statusLabel[tool.status]}</Badge>
        <Badge variant="outline">{tool.category}</Badge>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <span className="text-muted-foreground text-xs">{tool.tags.slice(0, 2).join(" · ")}</span>
        {available ? (
          <Link href={tool.route} className={buttonVariants({ size: "sm" })}>
            Abrir <ArrowUpRight data-icon="inline-end" />
          </Link>
        ) : <Button size="sm" disabled>{statusLabel[tool.status]}</Button>}
      </CardFooter>
    </Card>
  );
}

export function ToolExplorer({ tools, favoritesOnly = false }: { tools: VisibleTool[]; favoritesOnly?: boolean }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const categories = [...new Set(tools.map((tool) => tool.category))];
  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return tools.filter((tool) =>
      (!favoritesOnly || tool.favorite) &&
      (status === "all" || tool.status === status) &&
      (category === "all" || tool.category === category) &&
      (!term || `${tool.name} ${tool.description} ${tool.tags.join(" ")}`.toLocaleLowerCase("pt-BR").includes(term)),
    );
  }, [category, favoritesOnly, search, status, tools]);

  const hasFilters = Boolean(search || status !== "all" || category !== "all");

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setCategory("all");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(18rem,1fr)_12rem_11rem_auto]">
        <Field className="sm:col-span-2 lg:col-span-1">
          <FieldLabel htmlFor="tool-search" className="sr-only">Buscar ferramentas</FieldLabel>
          <InputGroup className="h-10">
            <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
            <InputGroupInput
              id="tool-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, tag ou função…"
            />
          </InputGroup>
        </Field>
        <Select value={category} onValueChange={(value) => setCategory(value ?? "all")}>
          <SelectTrigger className="h-10 w-full" aria-label="Filtrar por categoria"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent><SelectGroup><SelectItem value="all">Todas as categorias</SelectItem>{categories.map((item) => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectGroup></SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
          <SelectTrigger className="h-10 w-full" aria-label="Filtrar por status"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectGroup><SelectItem value="all">Todos os status</SelectItem>{Object.entries(statusLabel).map(([value, label]) => <SelectItem value={value} key={value}>{label}</SelectItem>)}</SelectGroup></SelectContent>
        </Select>
        <Button type="button" variant="ghost" className="h-10" onClick={clearFilters} disabled={!hasFilters}>
          <RotateCcw data-icon="inline-start" /> Limpar
        </Button>
      </div>

      <p className="text-muted-foreground text-sm" aria-live="polite">
        {visible.length} {visible.length === 1 ? "ferramenta encontrada" : "ferramentas encontradas"}
      </p>

      {visible.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((tool) => <ToolCard key={tool.id} tool={tool} />)}</div> : (
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
