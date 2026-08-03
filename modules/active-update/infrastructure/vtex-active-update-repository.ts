import "server-only";

import type { ServerEnv } from "@/lib/env";
import {
  MAX_ATTEMPTS,
  type ActiveUpdateResult,
  type ActiveUpdateRow,
} from "../domain/active-update";

class ActiveUpdateIntegrationError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly transient = false,
  ) {
    super(message);
    this.name = "ActiveUpdateIntegrationError";
  }
}

type VtexEnv = Pick<
  ServerEnv,
  | "VTEX_ACCOUNT"
  | "VTEX_ENVIRONMENT"
  | "VTEX_APP_KEY"
  | "VTEX_APP_TOKEN"
  | "VTEX_TIMEOUT_MS"
>;

function assertConfigured(env: VtexEnv) {
  if (!env.VTEX_ACCOUNT || !env.VTEX_APP_KEY || !env.VTEX_APP_TOKEN) {
    throw new ActiveUpdateIntegrationError(
      "VTEX_NOT_CONFIGURED",
      "A integração VTEX não está configurada",
    );
  }
}

async function requestVtex(
  url: URL,
  env: VtexEnv,
  fetcher: typeof fetch,
  init?: RequestInit,
) {
  let response: Response;
  try {
    response = await fetcher(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(env.VTEX_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        "X-VTEX-API-AppKey": env.VTEX_APP_KEY ?? "",
        "X-VTEX-API-AppToken": env.VTEX_APP_TOKEN ?? "",
        ...init?.headers,
      },
    });
  } catch {
    throw new ActiveUpdateIntegrationError(
      "VTEX_TIMEOUT",
      "A VTEX não respondeu dentro do tempo esperado",
      true,
    );
  }

  if (response.status === 429 || response.status >= 500) {
    throw new ActiveUpdateIntegrationError(
      "VTEX_UNAVAILABLE",
      "A VTEX está temporariamente indisponível",
      true,
    );
  }
  if (response.status === 401 || response.status === 403) {
    throw new ActiveUpdateIntegrationError(
      "VTEX_FORBIDDEN",
      "As credenciais VTEX não permitem esta atualização",
    );
  }
  return response;
}

async function updateOnce(
  row: ActiveUpdateRow,
  env: VtexEnv,
  fetcher: typeof fetch,
): Promise<Omit<ActiveUpdateResult, "attempts">> {
  assertConfigured(env);
  const base = `https://${env.VTEX_ACCOUNT}.${env.VTEX_ENVIRONMENT}.com.br/api/dataentities`;
  const clientUrl = new URL(`${base}/CL/search`);
  clientUrl.searchParams.set("_fields", "email,integratorId");
  clientUrl.searchParams.set("_where", `email=${row.email}`);

  const clientResponse = await requestVtex(clientUrl, env, fetcher);
  if (!clientResponse.ok)
    throw new ActiveUpdateIntegrationError(
      "CLIENT_LOOKUP_FAILED",
      "Não foi possível consultar o cliente",
    );
  const clients: unknown = await clientResponse.json().catch(() => null);
  if (!Array.isArray(clients) || clients.length === 0)
    throw new ActiveUpdateIntegrationError(
      "CLIENT_NOT_FOUND",
      "Cliente não localizado pelo e-mail",
    );
  if (clients.length > 1)
    throw new ActiveUpdateIntegrationError(
      "CLIENT_AMBIGUOUS",
      "Mais de um cliente foi localizado pelo e-mail",
    );

  const client = clients[0] as { integratorId?: unknown };
  if (typeof client.integratorId !== "string" || !client.integratorId.trim()) {
    throw new ActiveUpdateIntegrationError(
      "INVALID_LINK",
      "Cliente sem vínculo integrador válido",
    );
  }

  const integratorId = encodeURIComponent(client.integratorId);
  const integratorUrl = new URL(`${base}/IN/documents/${integratorId}`);
  integratorUrl.searchParams.set("_fields", "id,has_used_coupon");
  const integratorResponse = await requestVtex(integratorUrl, env, fetcher);
  if (integratorResponse.status === 404)
    throw new ActiveUpdateIntegrationError(
      "INTEGRATOR_NOT_FOUND",
      "Registro integrador não localizado",
    );
  if (!integratorResponse.ok)
    throw new ActiveUpdateIntegrationError(
      "INTEGRATOR_LOOKUP_FAILED",
      "Não foi possível consultar o registro integrador",
    );
  const integrator: unknown = await integratorResponse.json().catch(() => null);
  if (!integrator || typeof integrator !== "object")
    throw new ActiveUpdateIntegrationError(
      "INVALID_INTEGRATOR",
      "A VTEX retornou um registro integrador inválido",
    );
  const current = (integrator as { has_used_coupon?: unknown }).has_used_coupon;
  if (current === "false" || current === false) {
    return {
      status: "unchanged",
      code: "ALREADY_FALSE",
      message: "has_used_coupon já estava false",
    };
  }

  const patchResponse = await requestVtex(
    new URL(`${base}/IN/documents/${integratorId}`),
    env,
    fetcher,
    {
      method: "PATCH",
      body: JSON.stringify({ has_used_coupon: "false" }),
    },
  );
  if (!patchResponse.ok)
    throw new ActiveUpdateIntegrationError(
      "UPDATE_FAILED",
      "A VTEX recusou a atualização do registro integrador",
    );
  return {
    status: "updated",
    code: "UPDATED",
    message: "has_used_coupon atualizado para false",
  };
}

export async function processActiveUpdateRow(
  row: ActiveUpdateRow,
  env: VtexEnv,
  fetcher: typeof fetch = fetch,
  wait: (milliseconds: number) => Promise<void> = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
): Promise<ActiveUpdateResult> {
  for (let attempts = 1; attempts <= MAX_ATTEMPTS; attempts += 1) {
    try {
      return { ...(await updateOnce(row, env, fetcher)), attempts };
    } catch (error) {
      const integrationError =
        error instanceof ActiveUpdateIntegrationError
          ? error
          : new ActiveUpdateIntegrationError(
              "UNEXPECTED_RESPONSE",
              "A VTEX retornou uma resposta inesperada",
            );
      if (!integrationError.transient || attempts === MAX_ATTEMPTS) {
        return {
          status: "failed",
          code: integrationError.code,
          message: integrationError.message,
          attempts,
        };
      }
      await wait(attempts * 250);
    }
  }
  return {
    status: "failed",
    code: "RETRIES_EXHAUSTED",
    message: "Tentativas esgotadas",
    attempts: MAX_ATTEMPTS,
  };
}
