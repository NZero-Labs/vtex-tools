"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../domain/password-policy";

export function SecuritySettings() {
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string }>();
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get("newPassword") !== data.get("confirmation")) return setMessage({ kind: "error", text: "As novas senhas não coincidem." });
    setPending(true);
    const result = await authClient.changePassword({ currentPassword: String(data.get("currentPassword")), newPassword: String(data.get("newPassword")), revokeOtherSessions: true });
    setPending(false);
    if (result.error) return setMessage({ kind: "error", text: result.error.message ?? "Não foi possível alterar a senha." });
    form.reset();
    setMessage({ kind: "success", text: "Senha alterada. As outras sessões foram encerradas." });
  }

  return <form onSubmit={submit}><FieldGroup><Field><FieldLabel htmlFor="currentPassword">Senha atual</FieldLabel><Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required /></Field><Field><FieldLabel htmlFor="newPassword">Nova senha</FieldLabel><Input id="newPassword" name="newPassword" type="password" minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} autoComplete="new-password" required /></Field><Field><FieldLabel htmlFor="confirmation">Confirmar nova senha</FieldLabel><Input id="confirmation" name="confirmation" type="password" minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} autoComplete="new-password" required /></Field></FieldGroup>{message && <Alert variant={message.kind === "error" ? "destructive" : "default"} className="mt-4"><AlertDescription>{message.text}</AlertDescription></Alert>}<Button type="submit" className="mt-5" disabled={pending}><ShieldCheck data-icon="inline-start" />{pending ? "Alterando…" : "Alterar senha"}</Button></form>;
}
