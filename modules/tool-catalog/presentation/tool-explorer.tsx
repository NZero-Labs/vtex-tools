"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, FileDiff, Search, Star, UserRoundCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
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
    <Card className="group relative transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
      <CardHeader>
        <div className="bg-accent text-accent-foreground mb-4 flex size-11 items-center justify-center rounded-xl"><Icon className="size-5" aria-hidden /></div>
        <CardTitle className="pr-10 text-xl">{tool.name}</CardTitle>
        <CardDescription className="mt-1 leading-6">{tool.description}</CardDescription>
        <CardAction>
          <form action={toggleFavorite.bind(null, tool.id)}>
            <Button type="submit" variant="ghost" size="icon-sm" aria-label={tool.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
              <Star className={cn(tool.favorite && "fill-brand-lime text-brand-leaf")} />
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

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, tag ou função…" className="h-10 bg-card pl-9" aria-label="Buscar ferramentas" />
        </div>
        <Select value={category} onValueChange={(value) => setCategory(value ?? "all")}>
          <SelectTrigger className="h-10 w-full bg-card sm:w-44"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent><SelectGroup><SelectItem value="all">Todas as categorias</SelectItem>{categories.map((item) => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectGroup></SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
          <SelectTrigger className="h-10 w-full bg-card sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectGroup><SelectItem value="all">Todos os status</SelectItem>{Object.entries(statusLabel).map(([value, label]) => <SelectItem value={value} key={value}>{label}</SelectItem>)}</SelectGroup></SelectContent>
        </Select>
      </div>

      {visible.length ? <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">{visible.map((tool) => <ToolCard key={tool.id} tool={tool} />)}</div> : (
        <Empty className="min-h-64 border bg-card/50">
          <EmptyHeader><EmptyMedia variant="icon"><Search /></EmptyMedia><EmptyTitle>Nenhuma ferramenta encontrada</EmptyTitle><EmptyDescription>Ajuste a busca ou os filtros para ver outras opções.</EmptyDescription></EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
