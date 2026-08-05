import Link from "next/link";
import { Compass } from "lucide-react";

import { StatusPage } from "@/components/status-page";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <StatusPage
      icon={Compass}
      eyebrow="Erro 404"
      title="Caminho não encontrado."
      description="A página pode ter mudado ou o endereço está incorreto."
      action={
        <Link
          href="/dashboard"
          className={buttonVariants()}
        >
          Ir para o dashboard
        </Link>
      }
    />
  );
}
