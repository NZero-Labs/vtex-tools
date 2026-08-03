import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 max-w-3xl">
        {eyebrow && (
          <p className="text-primary mb-2 text-xs font-bold tracking-[0.14em] uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading text-3xl leading-tight font-medium text-balance sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6 sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
