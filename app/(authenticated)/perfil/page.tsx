import type { Metadata } from "next";

import { PageHeader } from "@/components/authenticated/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePrincipal } from "@/lib/auth/session";
import { ThemePreferences } from "@/modules/authentication/presentation/theme-preferences";

export const metadata: Metadata = { title: "Perfil" };

const roleLabel = {
  ADMIN: "Administrador",
  VISITOR: "Visitante",
  EMPLOYEE: "Colaborador",
} as const;

export default async function ProfilePage() {
  const principal = await requirePrincipal("dashboard:view");
  const initials = principal.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Conta"
        title="Perfil"
        description="Seus dados de acesso são gerenciados pela Microsoft e ficam sempre sincronizados."
      />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-4">
              <Avatar className="size-14">
                <AvatarImage src={principal.image ?? undefined} alt="" />
                <AvatarFallback className="bg-accent text-accent-foreground text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate">{principal.name}</CardTitle>
                <CardDescription className="truncate">{principal.email}</CardDescription>
              </div>
              <Badge variant="outline">{roleLabel[principal.role]}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/50 p-4">
                <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Nome</dt>
                <dd className="mt-1 font-medium">{principal.name}</dd>
              </div>
              <div className="rounded-xl bg-muted/50 p-4">
                <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">E-mail</dt>
                <dd className="mt-1 break-all font-medium">{principal.email}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>Os temas claro e escuro usam a paleta institucional Amara.</CardDescription>
          </CardHeader>
          <CardContent><ThemePreferences /></CardContent>
        </Card>
      </div>
    </div>
  );
}
