import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "./login-form";

const { refresh, replace, signInEmail } = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
  signInEmail: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, replace }) }));
vi.mock("@/lib/auth-client", () => ({ authClient: { signIn: { email: signInEmail } } }));

describe("LoginForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("trata falhas de rede sem deixar uma rejeição não capturada", async () => {
    signInEmail.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const user = userEvent.setup();
    render(<LoginForm destination="/dashboard" />);

    await user.type(screen.getByLabelText("E-mail"), "user@example.com");
    await user.type(screen.getByLabelText("Senha"), "password123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Não foi possível conectar ao serviço de autenticação. Tente novamente.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
    expect(replace).not.toHaveBeenCalled();
  });
});
