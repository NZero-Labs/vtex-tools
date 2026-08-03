import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "./login-form";

const { signInSocial } = vi.hoisted(() => ({ signInSocial: vi.fn() }));

vi.mock("@/lib/auth-client", () => ({ authClient: { signIn: { social: signInSocial } } }));

describe("LoginForm", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("oferece somente login com Microsoft", () => {
    render(<LoginForm destination="/dashboard" />);

    expect(screen.getByRole("button", { name: "Continuar com Microsoft" })).toBeInTheDocument();
    expect(screen.queryByLabelText("E-mail")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Senha")).not.toBeInTheDocument();
  });

  it("inicia o login com a Microsoft usando o destino informado", async () => {
    signInSocial.mockResolvedValueOnce({ data: {} });
    const user = userEvent.setup();
    render(<LoginForm destination="/ferramentas" />);

    await user.click(screen.getByRole("button", { name: "Continuar com Microsoft" }));

    expect(signInSocial).toHaveBeenCalledWith({
      provider: "microsoft",
      callbackURL: "/ferramentas",
    });
  });
});
