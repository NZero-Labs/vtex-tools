"use client";

import Link from "next/link";
import { useState } from "react";
import { KeyRound } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../domain/password-policy";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "pending" | "done" | "error">(token ? "idle" : "error");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirmation")) return setState("error");
    setState("pending");
    const result = await authClient.resetPassword({ newPassword: String(data.get("password")), token });
    setState(result.error ? "error" : "done");
  }

  return (
    <div className="w-full">
      <h1 className="font-heading text-4xl font-medium tracking-tight">Defina uma nova senha.</h1>
      <p className="text-muted-foreground mt-3 leading-7">Use ao menos {PASSWORD_MIN_LENGTH} caracteres. As sessões anteriores serão encerradas.</p>
      {state !== "done" && (
        <form className="mt-8" onSubmit={submit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="password">Nova senha</FieldLabel>
              <Input id="password" name="password" type="password" minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} autoComplete="new-password" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmation">Confirmar senha</FieldLabel>
              <Input id="confirmation" name="confirmation" type="password" minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} autoComplete="new-password" required />
            </Field>
          </FieldGroup>
          <Button type="submit" className="mt-6 w-full" disabled={!token || state === "pending"}>
            {state === "pending" ? <Spinner data-icon="inline-start" /> : <KeyRound aria-hidden="true" data-icon="inline-start" />}
            {state === "pending" ? "Salvando…" : "Redefinir senha"}
          </Button>
        </form>
      )}
      <div aria-live="polite">
        {state === "error" && (
          <Alert variant="destructive" className="mt-5">
            <AlertDescription>O link é inválido, expirou ou as senhas não coincidem.</AlertDescription>
          </Alert>
        )}
        {state === "done" && (
          <Alert className="mt-6">
            <AlertDescription>
              Senha atualizada. <Link href="/login" className="font-semibold underline">Entrar novamente</Link>.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
