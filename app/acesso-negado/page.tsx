import Link from "next/link";
import { ShieldX } from "lucide-react";

import { StatusPage } from "@/components/status-page";
import { buttonVariants } from "@/components/ui/button";

export default function AccessDeniedPage() {
  return (
    <StatusPage
      icon={ShieldX}
      eyebrow="Acesso negado"
      title="Esta área não está disponível para sua conta."
      description="Se você acredita que deveria ter acesso, procure um administrador da VTEX Tools."
      destructive
      action={
        <Link
          href="/dashboard"
          className={buttonVariants()}
        >
          Voltar ao dashboard
        </Link>
      }
    />
  );
}
