import type { ActiveUpdateJobDto } from "../domain/active-update";

export const activeUpdateStatusLabels: Record<
  ActiveUpdateJobDto["status"],
  string
> = {
  uploading: "Importando",
  ready: "Pronto",
  running: "Em execução",
  paused: "Pausado",
  completed: "Concluído",
  failed: "Falhou",
};

export const activeUpdateDateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function activeUpdateStatusVariant(
  status: ActiveUpdateJobDto["status"],
) {
  if (status === "failed") return "destructive" as const;
  if (status === "completed" || status === "running")
    return "secondary" as const;
  return "outline" as const;
}
