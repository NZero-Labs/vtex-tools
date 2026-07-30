"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const themes = [{ value: "light", label: "Claro", icon: Sun }, { value: "dark", label: "Escuro", icon: Moon }, { value: "system", label: "Sistema", icon: Laptop }];

export function ThemePreferences() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  if (!mounted) return <div className="bg-muted h-16 animate-pulse rounded-xl" aria-label="Carregando preferências de tema" />;
  return <div className="grid gap-3 sm:grid-cols-3">{themes.map(({ value, label, icon: Icon }) => <Button key={value} type="button" variant={theme === value ? "default" : "outline"} className="h-auto justify-start px-4 py-4" onClick={() => setTheme(value)}><Icon data-icon="inline-start" /><span><span className="block">{label}</span><span className="block text-xs font-normal opacity-70">{value === "system" ? "Segue o dispositivo" : `Sempre ${label.toLowerCase()}`}</span></span></Button>)}</div>;
}
