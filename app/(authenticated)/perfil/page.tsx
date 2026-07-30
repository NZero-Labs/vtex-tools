import type { Metadata } from "next";

import { FeedbackAlert } from "@/components/feedback-alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requirePrincipal } from "@/lib/auth/session";
import { updateProfile } from "@/modules/authentication/actions";
import { SecuritySettings } from "@/modules/authentication/presentation/security-settings";
import { ThemePreferences } from "@/modules/authentication/presentation/theme-preferences";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const principal = await requirePrincipal("dashboard:view");
  const params = await searchParams;
  const initials = principal.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return <div><p className="text-brand mb-2 text-xs font-bold tracking-[0.16em] uppercase">Conta</p><h1 className="font-heading text-4xl font-medium">Perfil e preferências.</h1><p className="text-muted-foreground mt-3 mb-8">Mantenha seus dados atualizados e personalize a experiência.</p><FeedbackAlert success={params.success} error={params.error} /><div className="grid gap-6 lg:grid-cols-2">
    <Card><CardHeader><div className="mb-4 flex items-center gap-4"><Avatar className="size-14"><AvatarFallback className="bg-accent text-accent-foreground text-lg">{initials}</AvatarFallback></Avatar><div><CardTitle>{principal.name}</CardTitle><CardDescription>{principal.email}</CardDescription></div><Badge variant="outline" className="ml-auto">{principal.role === "ADMIN" ? "Administrador" : "Colaborador"}</Badge></div><CardTitle>Dados pessoais</CardTitle><CardDescription>O e-mail é administrado pela plataforma.</CardDescription></CardHeader><CardContent><form action={updateProfile}><Field><FieldLabel htmlFor="name">Nome de exibição</FieldLabel><Input id="name" name="name" defaultValue={principal.name} minLength={2} maxLength={100} required /></Field><Field className="mt-4"><FieldLabel htmlFor="profile-email">E-mail</FieldLabel><Input id="profile-email" value={principal.email} disabled /></Field><Button type="submit" className="mt-5">Salvar perfil</Button></form></CardContent></Card>
    <Card><CardHeader><CardTitle>Segurança</CardTitle><CardDescription>Ao trocar a senha, outras sessões serão encerradas.</CardDescription></CardHeader><CardContent><SecuritySettings /></CardContent></Card>
    <Card className="lg:col-span-2"><CardHeader><CardTitle>Aparência</CardTitle><CardDescription>Os temas claro e escuro usam a paleta institucional Amara.</CardDescription></CardHeader><CardContent><ThemePreferences /></CardContent></Card>
  </div></div>;
}
