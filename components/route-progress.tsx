"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// ponytail: universal navigation feedback without a router event — any internal
// link click shows a top progress bar, hidden when the route settles.
export function RouteProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement).closest?.("a");
      const href = anchor?.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//") || href.startsWith("#")) return;
      if (href.split("?")[0] === pathname.split("?")[0]) return;
      setActive(true);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  useEffect(() => {
    if (!active) return;
    timer.current = setTimeout(() => setActive(false), 450);
    return () => window.clearTimeout(timer.current);
  }, [pathname, active]);

  if (!active) return null;

  return (
    <div
      role="progressbar"
      aria-label="Carregando página"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-primary/10"
    >
      <span className="block h-full w-1/3 animate-[route-progress_1s_linear_infinite] bg-primary" />
    </div>
  );
}
