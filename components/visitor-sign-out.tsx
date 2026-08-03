"use client";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function VisitorSignOut() {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.replace("/login");
  }

  return (
    <Button type="button" variant="outline" onClick={signOut} className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
      Sair e trocar de conta
    </Button>
  );
}
