import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(32rem,0.72fr)]">
      <section className="relative hidden overflow-hidden bg-[#0d2b1a] px-14 py-12 text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_20%_25%,#77b72a_0,transparent_18rem),radial-gradient(circle_at_85%_85%,#c1d000_0,transparent_16rem)]" />
        <div className="relative z-10">
          <BrandLogo className="w-56 brightness-0 invert" priority />
        </div>
        <div className="relative z-10 mt-auto max-w-xl pb-10">
          <p className="mb-5 text-xs font-bold tracking-[0.22em] text-[#c1d000] uppercase">Operação conectada</p>
          <h1 className="font-heading text-6xl leading-[0.95] font-medium text-balance">
            Decisões VTEX com menos atrito.
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-white/72">
            Um espaço seguro para auditar, comparar e operar com confiança — feito para o time Amara.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 text-sm text-white/55">
          <span className="size-2 rounded-full bg-[#c1d000]" />
          VTEX Tools · Ambiente interno
        </div>
      </section>
      <section className="flex min-h-dvh flex-col px-6 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between lg:justify-end">
          <BrandLogo className="w-36 dark:brightness-0 dark:invert lg:hidden" priority />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 items-center py-12">{children}</div>
      </section>
    </main>
  );
}
