"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-dvh items-center justify-center px-6"><div className="max-w-md text-center"><AlertTriangle className="text-destructive mx-auto mb-6 size-12" /><p className="text-destructive mb-2 text-xs font-bold tracking-[0.16em] uppercase">Algo não saiu como esperado</p><h1 className="font-heading text-4xl font-medium">Não foi possível carregar esta área.</h1><p className="text-muted-foreground mt-4 leading-7">Tente novamente. Se o problema continuar, informe o suporte da plataforma.</p><Button className="mt-7" onClick={reset}>Tentar novamente</Button></div></main>;
}
