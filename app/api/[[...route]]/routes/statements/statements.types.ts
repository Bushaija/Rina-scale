import { z } from "@hono/zod-openapi";

export const rowSchema = z.object({
  description: z.string(),
  note: z.number().nullable(),
  current: z.number().nullable(),
  previous: z.number().nullable(),
  isTotal: z.boolean(),
  isSubtotal: z.boolean(),
});

export const statementParamSchema = z.object({
  facilityId: z.coerce.number().int().positive(),
  periodId: z.coerce.number().int().positive(),
});

export type StatementRow = z.infer<typeof rowSchema>;
