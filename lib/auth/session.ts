import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { type Capability, hasCapability, type Principal, type Role } from "./permissions";

const roles = new Set<Role>(["EMPLOYEE", "ADMIN"]);

export async function getCurrentPrincipal(): Promise<(Principal & { id: string; name: string; email: string }) | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !roles.has(session.user.role as Role)) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role as Role,
    active: !session.user.banned,
  };
}

export async function requirePrincipal(capability?: Capability) {
  const principal = await getCurrentPrincipal();
  if (!principal) redirect("/login");
  if (capability && !hasCapability(principal, capability)) redirect("/acesso-negado");
  return principal;
}
