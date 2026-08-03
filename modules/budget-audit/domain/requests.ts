import { z } from "zod";

const budgetIdSchema = z.string().trim().min(1, "Informe o identificador do orçamento").max(100, "Identificador muito longo");

export const budgetRequestSchema = z.object({
  budgetIds: z.array(budgetIdSchema).min(2, "Informe pelo menos dois orçamentos").max(5, "Compare no máximo cinco orçamentos"),
}).superRefine(({ budgetIds }, context) => {
  if (new Set(budgetIds).size !== budgetIds.length) {
    context.addIssue({ code: "custom", path: ["budgetIds"], message: "Os orçamentos devem ser únicos" });
  }
});

export const budgetCartRequestSchema = z.object({
  budgetId: budgetIdSchema,
  orderForm: z.string().trim().min(1, "Informe o ID ou a URL do carrinho").max(2_000, "URL do carrinho muito longa"),
});

export const budgetVersionsRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list"), budgetId: budgetIdSchema }),
  z.object({ action: z.literal("compare"), budgetId: budgetIdSchema, versionId: z.string().trim().min(1).max(200) }),
]);

