import { z } from "zod";

export const SubCategorySchema = z.object({
  id: z.number().int(),
  categoryId: z.number().int().nullable(),
  code: z.string(),
  name: z.string(),
  displayOrder: z.number().int(),
});

export const SubCategoryDetailSchema = SubCategorySchema.extend({
  categoryCode: z.string().nullable(),
  categoryName: z.string().nullable(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});
