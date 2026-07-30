import Link from "next/link";
import { ShieldX } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export default function AccessDeniedPage() {
  return <main className="flex min-h-dvh items-center justify-center px-6"><div className="max-w-md text-center"><div className="bg-destructive/10 text-destructive mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl"><ShieldX className="size-7" /></div><p className="text-destructive mb-2 text-xs font-bold tracking-[0.16em] uppercase">Acesso negado</p><h1 className="font-heading text-4xl font-medium">Esta área não está disponível para sua conta.</h1><p className="text-muted-foreground mt-4 leading-7">Se você acredita que deveria ter acesso, procure um administrador da VTEX Tools.</p><Link href="/dashboard" className={buttonVariants({ className: "mt-7" })}>Voltar ao dashboard</Link></div></main>;
}
