// Response and helper schemas for Master Data routes
import { z } from "zod";

// ------------------------------
// Response Schemas
// ------------------------------
export const CategoryResponseSchema = z.object({
  id: z.number().int(),
  code: z.string(),
  name: z.string(),
  displayOrder: z.number().int(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export const SubCategoryResponseSchema = z.object({
  id: z.number().int(),
  categoryId: z.number().int().nullable(),
  code: z.string(),
  name: z.string(),
  displayOrder: z.number().int(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  category: CategoryResponseSchema.nullable(),
});

export const ActivityResponseSchema = z.object({
  id: z.number().int(),
  categoryId: z.number().int().nullable(),
  subCategoryId: z.number().int().nullable(),
  name: z.string(),
  displayOrder: z.number().int(),
  isTotalRow: z.boolean().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  category: CategoryResponseSchema.nullable(),
  subCategory: SubCategoryResponseSchema.nullable(),
});

export const HierarchicalDataSchema = z.object({
  categories: z.array(
    z.object({
      id: z.number().int(),
      code: z.string(),
      name: z.string(),
      displayOrder: z.number().int(),
      subCategories: z.array(
        z.object({
          id: z.number().int(),
          code: z.string(),
          name: z.string(),
          displayOrder: z.number().int(),
          activities: z.array(
            z.object({
              id: z.number().int(),
              name: z.string(),
              displayOrder: z.number().int(),
              isTotalRow: z.boolean(),
            })
          ),
        })
      ),
      directActivities: z.array(
        z.object({
          id: z.number().int(),
          name: z.string(),
          displayOrder: z.number().int(),
          isTotalRow: z.boolean(),
        })
      ),
    })
  ),
});

// ------------------------------
// Query Schemas
// ------------------------------
export const SubCategoryQuerySchema = z.object({
  categoryId: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const ActivitiesQuerySchema = z.object({
  categoryId: z.string().regex(/^\d+$/).transform(Number).optional(),
  subCategoryId: z.string().regex(/^\d+$/).transform(Number).optional(),
  excludeTotalRows: z.string().transform((str) => str === "true").optional(),
});

export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type SubCategoryResponse = z.infer<typeof SubCategoryResponseSchema>;
export type ActivityResponse = z.infer<typeof ActivityResponseSchema>;
