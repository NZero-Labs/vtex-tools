"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

const THEME_TRANSITION_DURATION = 240;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  function toggleTheme() {
    const root = document.documentElement;
    root.classList.add("theme-transitioning");
    setTheme(dark ? "light" : "dark");
    window.setTimeout(() => root.classList.remove("theme-transitioning"), THEME_TRANSITION_DURATION);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Alternar tema claro e escuro"
      onClick={toggleTheme}
    >
      <Moon data-icon="inline-start" className="theme-toggle-icon dark:hidden" />
      <Sun data-icon="inline-start" className="theme-toggle-icon hidden dark:block" />
    </Button>
  );
}
