import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getCurrentPrincipal } from "@/lib/auth/session";

export default function Home() {
  return (
    <Suspense>
      <HomeRedirect />
    </Suspense>
  );
}

async function HomeRedirect(): Promise<React.ReactNode> {
  redirect((await getCurrentPrincipal()) ? "/dashboard" : "/login");
}
