"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function RecoveryForm() {
  const [state, setState] = useState<"idle" | "pending" | "sent" | "error">("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("pending");
    const data = new FormData(event.currentTarget);
    const result = await authClient.requestPasswordReset({
      email: String(data.get("email")),
      redirectTo: "/redefinir-senha",
    });
    setState(result.error ? "error" : "sent");
  }

  return (
    <div className="w-full">
      <Link href="/login" className="text-muted-foreground mb-8 inline-flex items-center gap-2 text-sm hover:text-foreground">
        <ArrowLeft className="size-4" /> Voltar para o login
      </Link>
      <h1 className="font-heading text-4xl font-medium tracking-tight">Recupere seu acesso.</h1>
      <p className="text-muted-foreground mt-3 leading-7">Enviaremos um link de redefinição se o e-mail estiver cadastrado.</p>

      <form className="mt-8" onSubmit={submit}>
        <Field>
          <FieldLabel htmlFor="email">E-mail corporativo</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="email" required className="h-11" />
        </Field>
        <Button type="submit" className="mt-5 h-11 w-full" disabled={state === "pending" || state === "sent"}>
          <Send data-icon="inline-start" />
          {state === "pending" ? "Enviando…" : "Enviar link"}
        </Button>
      </form>

      {state === "sent" && <Alert className="mt-5"><AlertDescription>Se houver uma conta para esse e-mail, o link chegará em instantes.</AlertDescription></Alert>}
      {state === "error" && <Alert variant="destructive" className="mt-5"><AlertDescription>O serviço de recuperação não está disponível. Tente novamente mais tarde.</AlertDescription></Alert>}
    </div>
  );
}
