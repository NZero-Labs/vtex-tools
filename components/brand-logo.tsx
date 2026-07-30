import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandLogo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/logo-amara.png"
      alt="Amara Net Zero"
      width={1462}
      height={676}
      priority={priority}
      className={cn("h-auto w-44 object-contain", className)}
    />
  );
}
