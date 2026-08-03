import "server-only";

import { z } from "zod";

import type { ServerEnv } from "@/lib/env";
import type { NormalizedSubject, WeightSummary } from "../domain/subject";

const skuSchema = z.object({ PackagedWeightKg: z.number().nullish(), WeightKg: z.number().nullish() }).passthrough();
const fixtureWeights: Record<string, number> = { "31001": 28.5, "42002": 18, "53003": 4.2, "64004": 6.5 };

export async function fetchSkuWeights(
  skuIds: string[],
  env: ServerEnv,
  fetcher: typeof fetch = fetch,
): Promise<{ weights: Map<string, number>; failedSkuIds: string[] }> {
  const unique = [...new Set(skuIds)];
  if (env.USE_VTEX_FIXTURES) {
    return { weights: new Map(unique.flatMap((id) => fixtureWeights[id] ? [[id, fixtureWeights[id]]] : [])), failedSkuIds: unique.filter((id) => !fixtureWeights[id]) };
  }
  if (!env.VTEX_ACCOUNT || !env.VTEX_APP_KEY || !env.VTEX_APP_TOKEN) return { weights: new Map(), failedSkuIds: unique };
  const weights = new Map<string, number>();
  const failedSkuIds: string[] = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(10, unique.length) }, async () => {
    while (cursor < unique.length) {
      const skuId = unique[cursor++];
      if (!skuId) continue;
      try {
        const url = `https://${env.VTEX_ACCOUNT}.${env.VTEX_ENVIRONMENT}.com.br/api/catalog/pvt/stockkeepingunit/${encodeURIComponent(skuId)}`;
        const response = await fetcher(url, {
          headers: { "X-VTEX-API-AppKey": env.VTEX_APP_KEY!, "X-VTEX-API-AppToken": env.VTEX_APP_TOKEN! },
          next: { revalidate: 300 },
          signal: AbortSignal.timeout(env.VTEX_TIMEOUT_MS),
        });
        if (!response.ok) throw new Error();
        const sku = skuSchema.parse(await response.json());
        const weight = sku.PackagedWeightKg && sku.PackagedWeightKg > 0 ? sku.PackagedWeightKg : sku.WeightKg;
        if (weight && weight > 0) weights.set(skuId, weight);
        else failedSkuIds.push(skuId);
      } catch {
        failedSkuIds.push(skuId);
      }
    }
  });
  await Promise.all(workers);
  return { weights, failedSkuIds };
}

export function calculateWeight(subject: NormalizedSubject, weights: Map<string, number>): WeightSummary {
  const missingSkuIds: string[] = [];
  let totalKg = 0;
  for (const item of subject.items) {
    const weight = weights.get(item.skuId);
    if (weight === undefined) missingSkuIds.push(item.skuId);
    else totalKg += weight * item.quantity;
  }
  return { totalKg: Math.round(totalKg * 100) / 100, complete: missingSkuIds.length === 0, missingSkuIds };
}

export async function addWeights(subjects: NormalizedSubject[], env: ServerEnv, fetcher: typeof fetch = fetch) {
  const { weights } = await fetchSkuWeights(subjects.flatMap((subject) => subject.items.map((item) => item.skuId)), env, fetcher);
  return subjects.map((subject) => ({ ...subject, weight: calculateWeight(subject, weights) }));
}
