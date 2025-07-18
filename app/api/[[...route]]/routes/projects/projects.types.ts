import { z } from "zod";

// ------------------------------
// Request Schemas
// ------------------------------
export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  facilityId: z.number().int().positive(),
  reportingPeriodId: z.number().int().positive(),
  userId: z.number().int().positive(),
  status: z.enum(["ACTIVE", "INACTIVE", "COMPLETED"]).default("ACTIVE"),
});

export const ProjectQuerySchema = z.object({
  facilityId: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "COMPLETED"]).optional(),
});

export const UserProjectsParamsSchema = z.object({
  userId: z.string().regex(/^\d+$/).transform(Number),
});

export const CheckProjectExistsQuerySchema = z.object({
  facilityId: z.string().regex(/^\d+$/).transform(Number),
  reportingPeriodId: z.string().regex(/^\d+$/).transform(Number),
  userId: z.string().regex(/^\d+$/).transform(Number),
});

export const UpdateProjectStatusParamsSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export const UpdateProjectStatusBodySchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "COMPLETED"]),
  userId: z.number().int().positive(),
});

// Params for GET /projects/{id}
export const GetProjectParamsSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

// ------------------------------
// Response Schemas
// ------------------------------
export const ProjectResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  code: z.string(),
  status: z.string().nullable(),
  facilityId: z.number().int().nullable(),
  reportingPeriodId: z.number().int().nullable(),
  userId: z.number().int().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  facility: z.object({
    id: z.number().int(),
    name: z.string(),
    facilityType: z.string(),
  }).nullable(),
  reportingPeriod: z.object({
    id: z.number().int(),
    year: z.number().int(),
    periodType: z.string().nullable(),
  }).nullable(),
  user: z.object({
    id: z.number().int(),
    name: z.string(),
  }).nullable(),
});

export const ProjectExistsResponseSchema = z.object({
  exists: z.boolean(),
  project: z
    .object({
      id: z.number().int(),
      name: z.string(),
      status: z.string().nullable(),
    })
    .nullable(),
});

export const UpdateProjectStatusResponseSchema = z.object({
  id: z.number().int(),
  status: z.string().nullable(),
});

// Generic error response schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});
