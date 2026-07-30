import Link from "next/link";
import { Compass } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-md text-center">
        <Compass className="text-brand mx-auto mb-6 size-12" />
        <p className="text-brand mb-2 text-xs font-bold tracking-[0.16em] uppercase">
          Erro 404
        </p>
        <h1 className="font-heading text-5xl font-medium">
          Caminho não encontrado.
        </h1>
        <p className="text-muted-foreground mt-4 leading-7">
          A página pode ter mudado ou o endereço está incorreto.
        </p>
        <Link
          href="/dashboard"
          className={buttonVariants({ className: "mt-7" })}
        >
          Ir para o dashboard
        </Link>
      </div>
    </main>
  );
}
