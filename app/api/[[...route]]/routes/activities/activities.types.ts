import { z } from "zod";

export const ActivitySchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayOrder: z.number().int(),
  isTotalRow: z.boolean().nullable(),
  categoryId: z.number().int().nullable(),
  subCategoryId: z.number().int().nullable(),
});

export const ActivityDetailSchema = ActivitySchema.extend({
  categoryCode: z.string().nullable(),
  categoryName: z.string().nullable(),
  subCategoryCode: z.string().nullable(),
  subCategoryName: z.string().nullable(),
});

export const ActivityBasicSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    displayOrder: z.number().int(),
});

export const ActivitiesByCategoryQuerySchema = z.object({
    subCategoryId: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});
