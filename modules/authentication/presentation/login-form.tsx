"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

export function LoginForm({ destination }: { destination: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await authClient.signIn.email({
        email: String(data.get("email")),
        password: String(data.get("password")),
        rememberMe: true,
      });

      if (result.error) {
        setError(result.error.message ?? "Não foi possível entrar. Verifique suas credenciais.");
        return;
      }

      router.replace(destination);
      router.refresh();
    } catch {
      setError("Não foi possível conectar ao serviço de autenticação. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full">
      <p className="text-brand mb-3 text-xs font-bold tracking-[0.18em] uppercase">Acesso corporativo</p>
      <h2 className="font-heading text-4xl font-medium tracking-tight sm:text-5xl">Boas-vindas.</h2>
      <p className="text-muted-foreground mt-3 leading-7">Entre com seu e-mail corporativo para acessar as ferramentas.</p>

      <form className="mt-9" onSubmit={submit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <div className="relative">
              <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
              <Input id="email" name="email" type="email" autoComplete="email" required autoFocus className="h-11 pl-10" />
            </div>
          </Field>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <Link href="/recuperar-acesso" className="text-primary text-sm font-semibold underline-offset-4 hover:underline">
                Esqueci minha senha
              </Link>
            </div>
            <div className="relative">
              <LockKeyhole className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
              <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-11 pl-10" />
            </div>
          </Field>
        </FieldGroup>

        {error && (
          <Alert variant="destructive" className="mt-5">
            <AlertTitle>Não foi possível entrar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button className="mt-6 h-11 w-full" type="submit" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : <ArrowRight data-icon="inline-end" />}
          {pending ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <p className="text-muted-foreground mt-7 text-center text-xs leading-5">
        O cadastro é realizado exclusivamente por administradores da plataforma.
      </p>
    </div>
  );
}
