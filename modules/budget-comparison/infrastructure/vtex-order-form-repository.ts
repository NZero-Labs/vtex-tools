import "server-only";

import { z } from "zod";

import type { ServerEnv } from "@/lib/env";
import { normalizeOrderForm, type NormalizedSubject } from "../domain/budget-comparison";
import { BudgetIntegrationError } from "./vtex-budget-repository";

const idSchema = z.string().regex(/^[A-Za-z0-9-]{11,200}$/, "ID do carrinho inválido");

export function extractOrderFormId(input: string) {
  const value = input.trim();
  const direct = idSchema.safeParse(value);
  if (direct.success) return direct.data;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new BudgetIntegrationError("Informe um ID ou uma URL de carrinho válida", 400);
  }
  const fromQuery = url.searchParams.get("orderFormId");
  const fromPath = url.pathname.match(/\/orderForm\/([A-Za-z0-9-]+)/i)?.[1];
  const fromHash = new URLSearchParams(url.hash.includes("?") ? url.hash.slice(url.hash.indexOf("?") + 1) : "").get("orderFormId");
  const parsed = idSchema.safeParse(fromQuery ?? fromPath ?? fromHash);
  if (!parsed.success) throw new BudgetIntegrationError("A URL não contém um orderFormId válido", 400);
  return parsed.data;
}

export const orderFormFixture = {
  orderFormId: "DEMO-CART-1001",
  items: [
    { id: "31001", productId: "310", name: "Módulo fotovoltaico 550 W", quantity: 12, price: 82_990, sellingPrice: 79_990, seller: "1", refId: "MOD-550" },
    { id: "42002", productId: "420", name: "Inversor solar 6 kW", quantity: 1, price: 438_000, sellingPrice: 418_000, seller: "1", refId: "INV-6K", priceTags: [{ identifier: "promo-cart", name: "Desconto do carrinho", value: -2_000 }] },
    { id: "64004", productId: "640", name: "String box CC", quantity: 1, price: 89_000, sellingPrice: 85_000, seller: "1", refId: "SB-CC" },
  ],
  totalizers: [
    { id: "Items", value: 1_462_880 },
    { id: "Discounts", value: -2_000 },
    { id: "Shipping", value: 42_000 },
  ],
  value: 1_502_880,
  shippingData: {
    address: { postalCode: "01310-100", street: "não deve ser serializada" },
    logisticsInfo: [
      { selectedSla: "AMARANZ LOGISTICA CAJ/FSA", selectedDeliveryChannel: "delivery" },
      { selectedSla: "FOB LOGISTICA CAJ/FSA", selectedDeliveryChannel: "delivery" },
    ],
  },
  marketingData: { marketingTags: ["energia-solar"] },
  ratesAndBenefitsData: { rateAndBenefitsIdentifiers: [{ id: "promo-cart", name: "Desconto do carrinho" }] },
  clientProfileData: { email: "não-deve-ser-serializado@example.com" },
};

export async function fetchOrderForm(
  orderForm: string,
  env: ServerEnv,
  fetcher: typeof fetch = fetch,
): Promise<NormalizedSubject> {
  const orderFormId = extractOrderFormId(orderForm);
  if (env.USE_VTEX_FIXTURES) {
    if (process.env.NODE_ENV === "production") throw new BudgetIntegrationError("Fixtures VTEX não podem ser usadas em produção", 503);
    if (orderFormId !== orderFormFixture.orderFormId) throw new BudgetIntegrationError(`Carrinho ${orderFormId} não encontrado nas fixtures`, 404);
    return normalizeOrderForm(orderFormFixture);
  }
  if (!env.VTEX_ACCOUNT) throw new BudgetIntegrationError("A integração VTEX não está configurada", 503);
  const url = new URL(`https://${env.VTEX_ACCOUNT}.${env.VTEX_ENVIRONMENT}.com.br/api/checkout/pub/orderForm/${encodeURIComponent(orderFormId)}`);
  let response: Response;
  try {
    response = await fetcher(url, { cache: "no-store", signal: AbortSignal.timeout(env.VTEX_TIMEOUT_MS) });
  } catch {
    throw new BudgetIntegrationError("A VTEX não respondeu dentro do tempo esperado", 504);
  }
  if (response.status === 404) throw new BudgetIntegrationError(`Carrinho ${orderFormId} não encontrado`, 404);
  if (!response.ok) throw new BudgetIntegrationError("Não foi possível consultar o carrinho na VTEX");
  try {
    return normalizeOrderForm(await response.json());
  } catch {
    throw new BudgetIntegrationError(`O carrinho ${orderFormId} retornou dados incompletos`);
  }
}
