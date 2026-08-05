import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/modules/authentication/presentation/login-form";
import { getCurrentPrincipal } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  return (
    <Suspense>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginContent({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  if (await getCurrentPrincipal()) redirect("/dashboard");
  const { returnTo } = await searchParams;
  const destination = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";

  return <LoginForm destination={destination} />;
}
