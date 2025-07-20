import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";

const planningConfigTags = ["planning-config"];

// Schema definitions for the centralized planning system
const ActivityTemplateSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
  categoryType: z.string(),
  tags: z.array(z.string()),
  isActive: z.boolean(),
  metadata: z.record(z.any()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const PlanningCategoryVersionSchema = z.object({
  id: z.number().int(),
  categoryId: z.number().int(),
  version: z.number().int(),
  projectId: z.number().int(),
  facilityType: z.enum(["hospital", "health_center"]),
  code: z.string(),
  name: z.string(),
  displayOrder: z.number().int(),
  isActive: z.boolean(),
  validFrom: z.string(),
  validTo: z.string().nullable(),
  changeReason: z.string().nullable(),
});

const PlanningActivityVersionSchema = z.object({
  id: z.number().int(),
  activityId: z.number().int(),
  version: z.number().int(),
  templateId: z.number().int().nullable(),
  categoryVersionId: z.number().int(),
  facilityType: z.enum(["hospital", "health_center"]),
  name: z.string(),
  displayOrder: z.number().int(),
  isTotalRow: z.boolean(),
  isActive: z.boolean(),
  validFrom: z.string(),
  validTo: z.string().nullable(),
  config: z.record(z.any()).nullable(),
  defaultFrequency: z.number().nullable(),
  defaultUnitCost: z.number().nullable(),
  changeReason: z.string().nullable(),
});

const ActivityStructureSchema = z.object({
  categories: z.array(PlanningCategoryVersionSchema),
  activities: z.array(PlanningActivityVersionSchema),
  templates: z.array(ActivityTemplateSchema),
});

const CreateActivityTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  categoryType: z.string().min(1, "Category type is required"),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
});

const UpdateActivityTemplateSchema = CreateActivityTemplateSchema.partial();

const CreateActivityConfigSchema = z.object({
  projectId: z.number().int(),
  facilityType: z.enum(["hospital", "health_center"]),
  categories: z.array(z.object({
    code: z.string(),
    name: z.string(),
    displayOrder: z.number().int(),
    activities: z.array(z.object({
      name: z.string(),
      displayOrder: z.number().int(),
      templateId: z.number().int().optional(),
      isTotalRow: z.boolean().default(false),
      config: z.record(z.any()).optional(),
      defaultFrequency: z.number().optional(),
      defaultUnitCost: z.number().optional(),
    })),
  })),
  changeReason: z.string().optional(),
});

const ActivityConfigQuerySchema = z.object({
  projectId: z.string().regex(/^\d+$/, "Project ID must be a valid number").transform(Number).optional(),
  projectCode: z.string().optional(),
  facilityType: z.enum(["hospital", "health_center"]).optional(),
  version: z.string().regex(/^\d+$/, "Version must be a valid number").transform(Number).optional(),
  active: z.string().transform(val => val === "true").optional(),
});

const TemplateQuerySchema = z.object({
  categoryType: z.string().optional(),
  tags: z.string().optional(), // comma-separated tags
  active: z.string().transform(val => val === "true").optional(),
});

// GET /planning-config/activities - Get activity structure for a project/facility
export const getActivityStructure = createRoute({
  method: "get",
  path: "/planning-config/activities",
  request: {
    query: ActivityConfigQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      ActivityStructureSchema,
      "Activity structure for the specified project and facility type"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Invalid query parameters"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "No activity structure found for the specified criteria"
    ),
  },
  tags: planningConfigTags,
});

// POST /planning-config/activities - Create new activity configuration
export const createActivityConfiguration = createRoute({
  method: "post",
  path: "/planning-config/activities",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateActivityConfigSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({ 
        message: z.string(),
        version: z.number().int(),
        categoriesCreated: z.number().int(),
        activitiesCreated: z.number().int(),
      }),
      "Activity configuration created successfully"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Invalid input data"
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Configuration already exists for this project/facility combination"
    ),
  },
  tags: planningConfigTags,
});

// GET /planning-config/templates - Get activity templates
export const getActivityTemplates = createRoute({
  method: "get",
  path: "/planning-config/templates",
  request: {
    query: TemplateQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(ActivityTemplateSchema) }),
      "List of activity templates"
    ),
  },
  tags: planningConfigTags,
});

// POST /planning-config/templates - Create activity template
export const createActivityTemplate = createRoute({
  method: "post",
  path: "/planning-config/templates",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateActivityTemplateSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      ActivityTemplateSchema,
      "Activity template created successfully"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Invalid input data"
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Template with this name and category already exists"
    ),
  },
  tags: planningConfigTags,
});

// PUT /planning-config/templates/{templateId} - Update activity template
const TemplateIdParamSchema = z.object({
  templateId: z.string().regex(/^\d+$/, "Template ID must be a valid number").transform(Number),
});

export const updateActivityTemplate = createRoute({
  method: "put",
  path: "/planning-config/templates/{templateId}",
  request: {
    params: TemplateIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateActivityTemplateSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      ActivityTemplateSchema,
      "Activity template updated successfully"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Invalid input data"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Template not found"
    ),
  },
  tags: planningConfigTags,
});

// DELETE /planning-config/templates/{templateId} - Deactivate activity template
export const deactivateActivityTemplate = createRoute({
  method: "delete",
  path: "/planning-config/templates/{templateId}",
  request: {
    params: TemplateIdParamSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "Activity template deactivated successfully"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Template not found"
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Cannot deactivate template that is currently in use"
    ),
  },
  tags: planningConfigTags,
});

// GET /planning-config/templates/{templateId}/activities - Get activities using template
export const getActivitiesByTemplate = createRoute({
  method: "get",
  path: "/planning-config/templates/{templateId}/activities",
  request: {
    params: TemplateIdParamSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ 
        template: ActivityTemplateSchema,
        activities: z.array(PlanningActivityVersionSchema),
        projectsUsing: z.array(z.object({
          projectId: z.number().int(),
          projectName: z.string(),
          facilityType: z.string(),
        })),
      }),
      "Activities using the specified template"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Template not found"
    ),
  },
  tags: planningConfigTags,
});

// POST /planning-config/activities/individual - Create individual activity
const CreateIndividualActivitySchema = z.object({
  projectId: z.number().int().optional(),
  projectCode: z.string().optional(),
  facilityType: z.enum(["hospital", "health_center"]),
  activity: z.object({
    name: z.string().min(1, "Activity name is required"),
    description: z.string().optional(),
    categoryCode: z.string().min(1, "Category code is required"),
    displayOrder: z.number().int().min(1),
    isTotalRow: z.boolean().default(false),
    templateId: z.number().int().optional(),
    config: z.record(z.any()).optional(),
    defaultFrequency: z.number().optional(),
    defaultUnitCost: z.number().optional(),
    changeReason: z.string().optional(),
  }),
});

export const createIndividualActivity = createRoute({
  method: "post",
  path: "/planning-config/activity",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateIndividualActivitySchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({ 
        message: z.string(),
        activity: z.object({
          id: z.number().int(),
          name: z.string(),
          categoryCode: z.string(),
          displayOrder: z.number().int(),
          isTotalRow: z.boolean(),
          defaultFrequency: z.number().nullable(),
          defaultUnitCost: z.number().nullable(),
        }),
      }),
      "Individual activity created successfully"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Invalid input data"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Project or category not found"
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Activity already exists in this category"
    ),
  },
  tags: planningConfigTags,
});

// Admin routes for project management
const ProjectIdParamSchema = z.object({
  projectId: z.string().regex(/^\d+$/, "Project ID must be a valid number").transform(Number),
});

// GET /admin/planning/projects/{projectId}/structure - Get complete project structure
export const getProjectStructure = createRoute({
  method: "get",
  path: "/admin/planning/projects/{projectId}/structure",
  request: {
    params: ProjectIdParamSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        project: z.object({
          id: z.number().int(),
          name: z.string(),
          code: z.string(),
          description: z.string().nullable(),
        }),
        hospital: ActivityStructureSchema.optional(),
        healthCenter: ActivityStructureSchema.optional(),
        versions: z.array(z.object({
          version: z.number().int(),
          facilityType: z.string(),
          createdAt: z.string(),
          createdBy: z.string().nullable(),
          changeReason: z.string().nullable(),
          isActive: z.boolean(),
        })),
      }),
      "Complete project structure with all versions"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Project not found"
    ),
  },
  tags: planningConfigTags,
});

// POST /admin/planning/projects/{projectId}/import - Import activities from templates or other projects
const ImportConfigSchema = z.object({
  sourceType: z.enum(["project", "templates"]),
  sourceProjectId: z.number().int().optional(),
  templateIds: z.array(z.number().int()).optional(),
  facilityType: z.enum(["hospital", "health_center"]),
  replaceExisting: z.boolean().default(false),
  changeReason: z.string().optional(),
});

export const importActivityConfiguration = createRoute({
  method: "post",
  path: "/admin/planning/projects/{projectId}/import",
  request: {
    params: ProjectIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: ImportConfigSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        version: z.number().int(),
        imported: z.object({
          categories: z.number().int(),
          activities: z.number().int(),
        }),
      }),
      "Activities imported successfully"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Invalid import configuration"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Source project or templates not found"
    ),
  },
  tags: planningConfigTags,
});

// POST /admin/planning/projects/{projectId}/publish - Publish draft changes to active version
const PublishConfigSchema = z.object({
  facilityType: z.enum(["hospital", "health_center"]),
  version: z.number().int(),
  changeReason: z.string().optional(),
});

export const publishActivityConfiguration = createRoute({
  method: "post",
  path: "/admin/planning/projects/{projectId}/publish",
  request: {
    params: ProjectIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: PublishConfigSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        publishedVersion: z.number().int(),
        activatedAt: z.string(),
      }),
      "Configuration published successfully"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Invalid publish request"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Project or version not found"
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Cannot publish - version has validation errors"
    ),
  },
  tags: planningConfigTags,
});

export type GetActivityStructureRoute = typeof getActivityStructure;
export type CreateActivityConfigurationRoute = typeof createActivityConfiguration;
export type CreateIndividualActivityRoute = typeof createIndividualActivity;
export type GetActivityTemplatesRoute = typeof getActivityTemplates;
export type CreateActivityTemplateRoute = typeof createActivityTemplate;
export type UpdateActivityTemplateRoute = typeof updateActivityTemplate;
export type DeactivateActivityTemplateRoute = typeof deactivateActivityTemplate;
export type GetActivitiesByTemplateRoute = typeof getActivitiesByTemplate;
export type GetProjectStructureRoute = typeof getProjectStructure;
export type ImportActivityConfigurationRoute = typeof importActivityConfiguration;
export type PublishActivityConfigurationRoute = typeof publishActivityConfiguration; 