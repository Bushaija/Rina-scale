import { z } from "zod";

export const CategorySchema = z.object({
  id: z.number().int(),
  code: z.string(),
  name: z.string(),
  displayOrder: z.number().int(),
});

export const CategoryWithSubCategoryCountSchema = CategorySchema.extend({
  subCategoryCount: z.number().int(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});
