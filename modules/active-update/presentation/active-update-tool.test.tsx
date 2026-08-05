import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ActiveUpdateTool } from "./active-update-tool";

describe("ActiveUpdateTool", () => {
  it("apresenta upload e histórico vazio sem iniciar chamadas remotas", () => {
    render(
      <ActiveUpdateTool
        isAdmin={false}
        initialJob={null}
        initialHistory={{
          jobs: [],
          collaborators: [],
          activeJobId: null,
          hasMore: false,
          page: 0,
        }}
      />,
    );

    expect(screen.getByText("Nova atualização")).toBeInTheDocument();
    expect(screen.getByLabelText("Arquivo CSV")).toBeInTheDocument();
    expect(screen.getByText("Nenhum processamento encontrado.")).toBeInTheDocument();
  });
});
