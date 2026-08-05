import { Suspense } from "react";
import { CircleUserRound, LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { Skeleton } from "@/components/ui/skeleton";
import { VisitorSignOut } from "@/components/visitor-sign-out";
import { getCurrentPrincipal } from "@/lib/auth/session";

export default function VisitorPage() {
  return (
    <main className="relative flex min-h-dvh overflow-hidden bg-[#0d2b1a] px-6 py-6 text-white sm:px-10 lg:px-14">
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_14%_18%,#77b72a_0,transparent_20rem),radial-gradient(circle_at_88%_82%,#c1d000_0,transparent_22rem)]" />
      <div className="absolute top-1/2 left-1/2 size-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c1d000]/10" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between">
          <BrandLogo className="w-40 brightness-0 invert sm:w-52" priority />
          <span className="text-xs font-bold tracking-[0.18em] text-white/55 uppercase">VTEX Tools</span>
        </header>

        <section className="my-auto grid gap-10 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-24">
          <Suspense fallback={<VisitorGreetingFallback />}>
            <VisitorGreeting />
          </Suspense>

          <div className="max-w-xl border-l border-[#c1d000]/40 pl-6 sm:pl-10">
            <p className="text-2xl leading-tight font-medium sm:text-4xl">
              Seu acesso está como visitante por enquanto.
            </p>
            <p className="mt-6 max-w-lg text-base leading-8 text-white/65 sm:text-lg">
              Para liberar as ferramentas da Amara, entre em contato com a equipe de Tecnologia da Informação e solicite a aprovação do seu acesso.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2 text-sm text-white/55">
                <LockKeyhole className="size-4 text-[#c1d000]" aria-hidden />
                Ferramentas bloqueadas
              </span>
              <VisitorSignOut />
            </div>
          </div>
        </section>

        <footer className="flex items-center gap-3 text-sm text-white/45">
          <span className="size-2 rounded-full bg-[#c1d000]" />
          Acesso aguardando aprovação da T.I. Amara
        </footer>
      </div>
    </main>
  );
}

async function VisitorGreeting() {
  const principal = await getCurrentPrincipal();
  if (!principal) redirect("/login");
  if (principal.role !== "VISITOR") redirect("/dashboard");

  return (
    <div>
      <div className="mb-8 flex size-16 items-center justify-center rounded-2xl border border-[#c1d000]/30 bg-[#c1d000]/10 text-[#c1d000] shadow-[0_0_50px_rgba(193,208,0,0.15)]">
        <CircleUserRound className="size-8" aria-hidden />
      </div>
      <p className="mb-5 text-xs font-bold tracking-[0.22em] text-[#c1d000] uppercase">Perfil visitante</p>
      <h1 className="font-heading max-w-2xl text-5xl leading-[0.98] font-medium tracking-tight text-balance sm:text-7xl">
        Olá, {principal.name.split(" ")[0]}.
      </h1>
    </div>
  );
}

function VisitorGreetingFallback() {
  return (
    <div>
      <div className="mb-8 size-16 rounded-2xl bg-white/10" />
      <Skeleton className="mb-5 h-4 w-32 bg-white/10" />
      <Skeleton className="h-14 w-64 bg-white/10" />
    </div>
  );
}
