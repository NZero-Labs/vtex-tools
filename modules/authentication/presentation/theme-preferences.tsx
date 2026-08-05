"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const themes = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Laptop },
];

export function ThemePreferences() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  if (!mounted) return <Skeleton className="h-16 w-full rounded-xl" aria-label="Carregando preferências de tema" />;

  return (
    <ToggleGroup
      value={[theme ?? "system"]}
      onValueChange={(values) => values[0] && setTheme(values[0])}
      variant="outline"
      className="grid w-full gap-3 sm:grid-cols-3"
      aria-label="Tema da interface"
    >
      {themes.map(({ value, label, icon: Icon }) => (
        <ToggleGroupItem key={value} value={value} className="h-auto justify-start px-4 py-4">
          <Icon data-icon="inline-start" />
          <span className="text-left">
            <span className="block">{label}</span>
            <span className="block text-xs font-normal opacity-70">
              {value === "system" ? "Segue o dispositivo" : `Sempre ${label.toLowerCase()}`}
            </span>
          </span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
