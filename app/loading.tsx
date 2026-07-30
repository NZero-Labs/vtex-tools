import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10" aria-label="Carregando conteúdo"><Skeleton className="h-10 w-64" /><Skeleton className="h-5 w-96 max-w-full" /><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div></main>;
}
