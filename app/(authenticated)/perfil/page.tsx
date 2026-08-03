import type { Metadata } from "next";

import { PageHeader } from "@/components/authenticated/page-header";
import { FeedbackAlert } from "@/components/feedback-alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requirePrincipal } from "@/lib/auth/session";
import { updateProfile } from "@/modules/authentication/actions";
import { SecuritySettings } from "@/modules/authentication/presentation/security-settings";
import { ThemePreferences } from "@/modules/authentication/presentation/theme-preferences";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const principal = await requirePrincipal("dashboard:view");
  const params = await searchParams;
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
        title="Perfil e preferências"
        description="Mantenha seus dados atualizados e personalize a experiência."
      />
      <FeedbackAlert success={params.success} error={params.error} />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <Avatar className="size-14">
                <AvatarFallback className="bg-accent text-accent-foreground text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate">{principal.name}</CardTitle>
                <CardDescription className="truncate">{principal.email}</CardDescription>
              </div>
              <Badge variant="outline">
                {principal.role === "ADMIN" ? "Administrador" : principal.role === "VISITOR" ? "Visitante" : "Colaborador"}
              </Badge>
            </div>
            <CardTitle>Dados pessoais</CardTitle>
            <CardDescription>O e-mail é administrado pela plataforma.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateProfile}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Nome de exibição</FieldLabel>
                  <Input id="name" name="name" defaultValue={principal.name} minLength={2} maxLength={100} required />
                </Field>
                <Field data-disabled>
                  <FieldLabel htmlFor="profile-email">E-mail</FieldLabel>
                  <Input id="profile-email" value={principal.email} disabled />
                </Field>
              </FieldGroup>
              <Button type="submit" className="mt-5">Salvar perfil</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
            <CardDescription>Ao trocar a senha, outras sessões serão encerradas.</CardDescription>
          </CardHeader>
          <CardContent><SecuritySettings /></CardContent>
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
