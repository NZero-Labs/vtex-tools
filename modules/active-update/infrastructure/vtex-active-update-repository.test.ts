import { describe, expect, it, vi } from "vitest";

import type { ServerEnv } from "@/lib/env";
import { processActiveUpdateRow } from "./vtex-active-update-repository";

const env = {
  VTEX_ACCOUNT: "account",
  VTEX_ENVIRONMENT: "vtexcommercestable",
  VTEX_APP_KEY: "key",
  VTEX_APP_TOKEN: "token",
  VTEX_TIMEOUT_MS: 1_000,
} satisfies Pick<ServerEnv, "VTEX_ACCOUNT" | "VTEX_ENVIRONMENT" | "VTEX_APP_KEY" | "VTEX_APP_TOKEN" | "VTEX_TIMEOUT_MS">;
const row = { rowNumber: 2, email: "a@x.com", cnpjDoc: "1" };

describe("atualização VTEX", () => {
  it("não envia PATCH quando o status já é false", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json([{ integratorId: "abc" }]))
      .mockResolvedValueOnce(Response.json({ id: "abc", has_used_coupon: "false" }));

    await expect(processActiveUpdateRow(row, env, fetcher)).resolves.toMatchObject({ status: "unchanged", code: "ALREADY_FALSE", attempts: 1 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("altera somente has_used_coupon", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json([{ integratorId: "abc" }]))
      .mockResolvedValueOnce(Response.json({ id: "abc", has_used_coupon: "true" }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(processActiveUpdateRow(row, env, fetcher)).resolves.toMatchObject({ status: "updated", attempts: 1 });
    expect(fetcher.mock.calls[2]?.[1]).toMatchObject({ method: "PATCH", body: JSON.stringify({ has_used_coupon: "false" }) });
  });

  it("repete falhas transitórias e encerra falhas definitivas", async () => {
    const wait = vi.fn(async () => undefined);
    const transientFetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json([{ integratorId: "abc" }]))
      .mockResolvedValueOnce(Response.json({ has_used_coupon: false }));
    await expect(processActiveUpdateRow(row, env, transientFetcher, wait)).resolves.toMatchObject({ status: "unchanged", attempts: 2 });
    expect(wait).toHaveBeenCalledOnce();

    const missingFetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json([]));
    await expect(processActiveUpdateRow(row, env, missingFetcher, wait)).resolves.toMatchObject({ status: "failed", code: "CLIENT_NOT_FOUND", attempts: 1 });
  });
});
