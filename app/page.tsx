import { redirect } from "next/navigation";

import { getCurrentPrincipal } from "@/lib/auth/session";

export default async function Home() {
  redirect((await getCurrentPrincipal()) ? "/dashboard" : "/login");
}
