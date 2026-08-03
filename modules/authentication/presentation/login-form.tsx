"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

export function LoginForm({ destination }: { destination: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signInWithMicrosoft() {
    setPending(true);
    setError("");
    try {
      const result = await authClient.signIn.social({
        provider: "microsoft",
        callbackURL: destination,
      });
      if (result.error) setError(result.error.message ?? "Não foi possível entrar com a Microsoft.");
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
      <p className="text-muted-foreground mt-3 max-w-sm leading-7">
        Entre com sua conta Microsoft corporativa para acessar as ferramentas da Amara.
      </p>

      {error && (
        <Alert variant="destructive" className="mt-7">
          <AlertTitle>Não foi possível entrar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button className="mt-9 h-12 w-full" type="button" disabled={pending} onClick={signInWithMicrosoft}>
        {pending ? <Spinner data-icon="inline-start" /> : <MicrosoftMark />}
        {pending ? "Conectando…" : "Continuar com Microsoft"}
        {!pending && <ArrowRight data-icon="inline-end" />}
      </Button>

      <p className="text-muted-foreground mt-7 text-center text-xs leading-5">
        O acesso é gerenciado pela equipe de Tecnologia da Informação.
      </p>
    </div>
  );
}

function MicrosoftMark() {
  return (
    <span className="grid size-4 grid-cols-2 gap-px" aria-hidden="true">
      <span className="bg-[#f25022]" />
      <span className="bg-[#7fba00]" />
      <span className="bg-[#00a4ef]" />
      <span className="bg-[#ffb900]" />
    </span>
  );
}
