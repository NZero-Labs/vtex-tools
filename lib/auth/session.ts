import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { type Capability, hasCapability, type Principal, type Role } from "./permissions";

const roles = new Set<Role>(["VISITOR", "EMPLOYEE", "ADMIN"]);

export type CurrentPrincipal = Principal & {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

export async function getCurrentPrincipal(): Promise<CurrentPrincipal | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !roles.has(session.user.role as Role)) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
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
