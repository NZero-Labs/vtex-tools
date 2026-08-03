import { describe, expect, it, vi } from "vitest";

import type { ServerEnv } from "@/lib/env";
import { calculateWeight, fetchSkuWeights } from "./vtex-catalog-repository";

const env = { VTEX_ACCOUNT: "amara", VTEX_ENVIRONMENT: "vtexcommercestable", VTEX_APP_KEY: "key", VTEX_APP_TOKEN: "token", VTEX_TIMEOUT_MS: 1_000, USE_VTEX_FIXTURES: false } as ServerEnv;

describe("fetchSkuWeights", () => {
  it("deduplica SKUs e prefere PackagedWeightKg positivo", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ PackagedWeightKg: 3, WeightKg: 2 }), { status: 200 })) as unknown as typeof fetch;
    const result = await fetchSkuWeights(["1", "1"], env, fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.weights.get("1")).toBe(3);
  });

  it("usa WeightKg como fallback e informa falhas parciais", async () => {
    const fetcher: typeof fetch = async (input) => String(input).endsWith("/1")
      ? new Response(JSON.stringify({ PackagedWeightKg: 0, WeightKg: 2 }), { status: 200 })
      : new Response(null, { status: 404 });
    const result = await fetchSkuWeights(["1", "2"], env, fetcher);

    expect(result.weights.get("1")).toBe(2);
    expect(result.failedSkuIds).toEqual(["2"]);
    expect(calculateWeight({ id: "x", kind: "budget", items: [{ skuId: "1", name: "A", quantity: 2, listPrice: 1, sellingPrice: 1, totalPrice: 2, sellerIds: [] }, { skuId: "2", name: "B", quantity: 1, listPrice: 1, sellingPrice: 1, totalPrice: 1, sellerIds: [] }], totals: { subtotal: 3, discount: 0, shipping: 0, tax: 0, total: 3 }, shipping: { deliveryTypes: [], slas: [], value: 0 }, promotions: [], marketingTags: [] }, result.weights)).toEqual({ totalKg: 4, complete: false, missingSkuIds: ["2"] });
  });
});
