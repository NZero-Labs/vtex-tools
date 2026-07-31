export function AuditPageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="relative mb-8 overflow-hidden rounded-3xl border bg-card px-6 py-8 sm:px-9 sm:py-10">
      <div aria-hidden className="absolute -top-16 -right-12 size-56 rounded-full bg-accent/70" />
      <div aria-hidden className="absolute top-10 right-24 size-24 rounded-full border border-primary/15" />
      <div className="relative">
        <p className="text-brand mb-2 text-xs font-bold tracking-[0.16em] uppercase">{eyebrow}</p>
        <h1 className="font-heading max-w-4xl text-4xl leading-none font-medium text-balance sm:text-6xl">{title}</h1>
        <p className="text-muted-foreground mt-4 max-w-2xl leading-7">{description}</p>
      </div>
    </header>
  );
}
