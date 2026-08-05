"use client";

import { AlertTriangle } from "lucide-react";

import { StatusPage } from "@/components/status-page";
import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <StatusPage
      icon={AlertTriangle}
      eyebrow="Algo não saiu como esperado"
      title="Não foi possível carregar esta área."
      description="Tente novamente. Se o problema continuar, informe o suporte da plataforma."
      destructive
      action={<Button onClick={reset}>Tentar novamente</Button>}
    />
  );
}
