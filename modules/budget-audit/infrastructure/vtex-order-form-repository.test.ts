import { describe, expect, it, vi } from "vitest";

import type { ServerEnv } from "@/lib/env";
import { extractOrderFormId, fetchOrderForm } from "./vtex-order-form-repository";

const env = {
  VTEX_ACCOUNT: "amara",
  VTEX_ENVIRONMENT: "vtexcommercestable",
  VTEX_TIMEOUT_MS: 1_000,
  USE_VTEX_FIXTURES: false,
} as ServerEnv;

describe("extractOrderFormId", () => {
  it("aceita ID direto, query, hash e endpoint VTEX", () => {
    expect(extractOrderFormId("DEMO-CART-1001")).toBe("DEMO-CART-1001");
    expect(extractOrderFormId("https://loja.test/checkout?orderFormId=cart-id-12345")).toBe("cart-id-12345");
    expect(extractOrderFormId("https://loja.test/checkout#/cart?orderFormId=hash-id-12345")).toBe("hash-id-12345");
    expect(extractOrderFormId("https://loja.test/api/checkout/pub/orderForm/path-id-12345")).toBe("path-id-12345");
  });

  it("rejeita URL sem ID", () => {
    expect(() => extractOrderFormId("https://loja.test/checkout#/cart")).toThrow("orderFormId");
  });
});

describe("fetchOrderForm", () => {
  it("ignora o host fornecido e consulta apenas a conta configurada", async () => {
    const fetcher = vi.fn(async (...args: Parameters<typeof fetch>) => {
      void args;
      return new Response(JSON.stringify({ orderFormId: "cart-id-12345", items: [], totalizers: [], value: 0 }), { status: 200 });
    });

    await fetchOrderForm("https://malicioso.test/checkout?orderFormId=cart-id-12345", env, fetcher as unknown as typeof fetch);

    expect(String(fetcher.mock.calls[0]?.[0])).toBe("https://amara.vtexcommercestable.com.br/api/checkout/pub/orderForm/cart-id-12345");
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ cache: "no-store" });
  });
});
