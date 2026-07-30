"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Alternar tema claro e escuro"
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <Moon data-icon="inline-start" className="dark:hidden" />
      <Sun data-icon="inline-start" className="hidden dark:block" />
    </Button>
  );
}
