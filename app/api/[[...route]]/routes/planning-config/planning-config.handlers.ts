import { AppRouteHandler } from "../../lib/types";
import { 
  GetActivityStructureRoute, 
  CreateActivityConfigurationRoute,
  CreateActivityTemplateRoute,
  GetActivityTemplatesRoute,
  UpdateActivityTemplateRoute,
  DeactivateActivityTemplateRoute,
  GetActivitiesByTemplateRoute,
  GetProjectStructureRoute,
  ImportActivityConfigurationRoute,
  PublishActivityConfigurationRoute
} from "./planning-config.routes";
import { db } from "@/db";
import * as schema from "@/db/schema";
import * as scalabilitySchema from "@/db/schema/planning-scalability";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { eq, and, desc, isNull, or, sql, inArray } from "drizzle-orm";

// Main handler for getting activity structure
export const getActivityStructure: AppRouteHandler<any> = async (c) => {
  // Casting to any to bypass strict RouteConfig typing temporarily
  const { projectId, projectCode, facilityType, version, active } = (c as any).req.valid("query");
  
  try {
    // Resolve project ID from code if needed
    let resolvedProjectId = projectId;
    if (!resolvedProjectId && projectCode) {
      const project = await db.query.projects.findFirst({
        where: eq(schema.projects.code, projectCode),
        columns: { id: true }
      });
      if (!project) {
        return c.json({ 
          error: "NOT_FOUND", 
          message: `Project with code "${projectCode}" not found` 
        }, HttpStatusCodes.NOT_FOUND);
      }
      resolvedProjectId = project.id;
    }

    if (!resolvedProjectId) {
      return c.json({ 
        error: "BAD_REQUEST", 
        message: "Either projectId or projectCode must be provided" 
      }, HttpStatusCodes.BAD_REQUEST);
    }

    if (!facilityType) {
      return c.json({ 
        error: "BAD_REQUEST", 
        message: "facilityType parameter is required" 
      }, HttpStatusCodes.BAD_REQUEST);
    }

    // Get categories from the new versioned system
    const categoriesQuery = db
      .select()
      .from(scalabilitySchema.planningCategoryVersions)
      .where(
        and(
          eq(scalabilitySchema.planningCategoryVersions.projectId, resolvedProjectId),
          eq(scalabilitySchema.planningCategoryVersions.facilityType, facilityType),
          version ? eq(scalabilitySchema.planningCategoryVersions.version, version) : isNull(scalabilitySchema.planningCategoryVersions.validTo),
          active !== undefined ? eq(scalabilitySchema.planningCategoryVersions.isActive, active) : undefined
        )
      )
      .orderBy(scalabilitySchema.planningCategoryVersions.displayOrder);

    const categories = await categoriesQuery;

    if (categories.length === 0) {
      // Fallback to current system for gradual migration
      const fallbackCategories = await db
        .select({
          id: schema.planningCategories.id,
          categoryId: schema.planningCategories.id,
          version: sql<number>`1`,
          projectId: schema.planningCategories.projectId,
          facilityType: schema.planningCategories.facilityType,
          code: schema.planningCategories.code,
          name: schema.planningCategories.name,
          displayOrder: schema.planningCategories.displayOrder,
          isActive: sql<boolean>`true`,
          validFrom: schema.planningCategories.createdAt,
          validTo: sql<string | null>`null`,
          changeReason: sql<string | null>`'Legacy system compatibility'`,
        })
        .from(schema.planningCategories)
        .where(
          and(
            eq(schema.planningCategories.projectId, resolvedProjectId),
            eq(schema.planningCategories.facilityType, facilityType)
          )
        )
        .orderBy(schema.planningCategories.displayOrder);

      if (fallbackCategories.length === 0) {
        return c.json({
          error: "NOT_FOUND",
          message: `No activity structure found for project ${resolvedProjectId} and facility type ${facilityType}`
        }, HttpStatusCodes.NOT_FOUND);
      }

      // Get activities from current system for fallback
      const fallbackActivities = await db
        .select({
          id: schema.planningActivities.id,
          activityId: schema.planningActivities.id,
          version: sql<number>`1`,
          templateId: sql<number | null>`null`,
          categoryVersionId: schema.planningActivities.categoryId,
          facilityType: schema.planningActivities.facilityType,
          name: schema.planningActivities.name,
          displayOrder: schema.planningActivities.displayOrder,
          isTotalRow: schema.planningActivities.isTotalRow,
          isActive: sql<boolean>`true`,
          validFrom: schema.planningActivities.createdAt,
          validTo: sql<string | null>`null`,
          config: sql<Record<string, any> | null>`null`,
          defaultFrequency: sql<number | null>`null`,
          defaultUnitCost: sql<number | null>`null`,
          changeReason: sql<string | null>`'Legacy system compatibility'`,
        })
        .from(schema.planningActivities)
        .innerJoin(
          schema.planningCategories, 
          eq(schema.planningActivities.categoryId, schema.planningCategories.id)
        )
        .where(
          and(
            eq(schema.planningCategories.projectId, resolvedProjectId),
            eq(schema.planningActivities.facilityType, facilityType)
          )
        )
        .orderBy(
          schema.planningCategories.displayOrder,
          schema.planningActivities.displayOrder
        );

      const templates = await getDefaultTemplates();

      const result = {
        categories: fallbackCategories.map(cat => ({
          ...cat,
          validFrom: cat.validFrom?.toISOString() || null,
          validTo: cat.validTo,
        })),
        activities: fallbackActivities.map(act => ({
          ...act,
          validFrom: act.validFrom?.toISOString() || null,
          validTo: act.validTo,
        })),
        templates,
      };

      return c.json(result, HttpStatusCodes.OK);
    }

    // Get activities from versioned system
    const categoryVersionIds = categories.map(cat => cat.id);
    const activities = await db
      .select()
      .from(scalabilitySchema.planningActivityVersions)
      .where(
        and(
          inArray(scalabilitySchema.planningActivityVersions.categoryVersionId, categoryVersionIds),
          version ? eq(scalabilitySchema.planningActivityVersions.version, version) : isNull(scalabilitySchema.planningActivityVersions.validTo),
          active !== undefined ? eq(scalabilitySchema.planningActivityVersions.isActive, active) : undefined
        )
      )
      .orderBy(scalabilitySchema.planningActivityVersions.displayOrder);

    // Get templates
    const templates = await db
      .select()
      .from(scalabilitySchema.activityTemplates)
      .where(eq(scalabilitySchema.activityTemplates.isActive, true))
      .orderBy(scalabilitySchema.activityTemplates.categoryType, scalabilitySchema.activityTemplates.name);

    const result = {
      categories: categories.map(cat => ({
        ...cat,
        validFrom: cat.validFrom?.toISOString() || null,
        validTo: cat.validTo?.toISOString() || null,
      })),
      activities: activities.map(act => ({
        ...act,
        validFrom: act.validFrom?.toISOString() || null,
        validTo: act.validTo?.toISOString() || null,
      })),
      templates: templates.map(tmpl => ({
        ...tmpl,
        createdAt: tmpl.createdAt?.toISOString() || null,
        updatedAt: tmpl.updatedAt?.toISOString() || null,
      })),
    };

    return c.json(result, HttpStatusCodes.OK);

  } catch (error) {
    console.error("Error fetching activity structure:", error);
    return c.json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch activity structure"
    }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

// Handler for creating new activity configuration
export const createActivityConfiguration: AppRouteHandler<any> = async (c) => {
  const body = (c as any).req.valid("json");
  
  try {
    // Check if configuration already exists
    const existingConfig = await db
      .select({ id: scalabilitySchema.planningCategoryVersions.id })
      .from(scalabilitySchema.planningCategoryVersions)
      .where(
        and(
          eq(scalabilitySchema.planningCategoryVersions.projectId, body.projectId),
          eq(scalabilitySchema.planningCategoryVersions.facilityType, body.facilityType),
          isNull(scalabilitySchema.planningCategoryVersions.validTo)
        )
      )
      .limit(1);

    if (existingConfig.length > 0) {
      return c.json({
        error: "CONFLICT",
        message: `Active configuration already exists for project ${body.projectId} and facility type ${body.facilityType}`
      }, HttpStatusCodes.CONFLICT);
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      let categoriesCreated = 0;
      let activitiesCreated = 0;
      
      // Determine next version
      const maxVersionResult = await tx
        .select({ maxVersion: sql<number>`COALESCE(MAX(version), 0)` })
        .from(scalabilitySchema.planningCategoryVersions)
        .where(
          and(
            eq(scalabilitySchema.planningCategoryVersions.projectId, body.projectId),
            eq(scalabilitySchema.planningCategoryVersions.facilityType, body.facilityType)
          )
        );
      
      const nextVersion = (maxVersionResult[0]?.maxVersion || 0) + 1;

      // Create categories
      for (const category of body.categories) {
        // Get next category ID using a sequence or simple counter
        const maxCategoryIdResult = await tx
          .select({ maxCategoryId: sql<number>`COALESCE(MAX(category_id), 0)` })
          .from(scalabilitySchema.planningCategoryVersions);
        const categoryId = (maxCategoryIdResult[0]?.maxCategoryId || 0) + 1;
        
        const [insertedCategory] = await tx
          .insert(scalabilitySchema.planningCategoryVersions)
          .values({
            categoryId,
            version: nextVersion,
            projectId: body.projectId,
            facilityType: body.facilityType,
            code: category.code,
            name: category.name,
            displayOrder: category.displayOrder,
            changeReason: body.changeReason || 'New configuration created',
          })
          .returning({ id: scalabilitySchema.planningCategoryVersions.id });

        categoriesCreated++;

        // Create activities for this category
        for (const activity of category.activities) {
          // Get next activity ID using a sequence or simple counter
          const maxActivityIdResult = await tx
            .select({ maxActivityId: sql<number>`COALESCE(MAX(activity_id), 0)` })
            .from(scalabilitySchema.planningActivityVersions);
          const activityId = (maxActivityIdResult[0]?.maxActivityId || 0) + 1;
          
          await tx
            .insert(scalabilitySchema.planningActivityVersions)
            .values({
              activityId,
              version: nextVersion,
              templateId: activity.templateId || null,
              categoryVersionId: insertedCategory.id,
              facilityType: body.facilityType,
              name: activity.name,
              displayOrder: activity.displayOrder,
              isTotalRow: activity.isTotalRow,
              config: activity.config || null,
              defaultFrequency: activity.defaultFrequency || null,
              defaultUnitCost: activity.defaultUnitCost || null,
              changeReason: body.changeReason || 'New configuration created',
            });

          activitiesCreated++;
        }
      }

      return { version: nextVersion, categoriesCreated, activitiesCreated };
    });

    c.get("logger")?.info("Activity configuration created", {
      projectId: body.projectId,
      facilityType: body.facilityType,
      version: result.version,
      categoriesCreated: result.categoriesCreated,
      activitiesCreated: result.activitiesCreated
    });

    return c.json({
      message: "Activity configuration created successfully",
      version: result.version,
      categoriesCreated: result.categoriesCreated,
      activitiesCreated: result.activitiesCreated,
    }, HttpStatusCodes.CREATED);

  } catch (error) {
    console.error("Error creating activity configuration:", error);
    return c.json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Failed to create activity configuration"
    }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

// Handler for getting activity templates
export const getActivityTemplates: AppRouteHandler<any> = async (c) => {
  const { categoryType, tags, active } = (c as any).req.valid("query");
  
  try {
    let whereConditions = [];
    
    if (categoryType) {
      whereConditions.push(eq(scalabilitySchema.activityTemplates.categoryType, categoryType));
    }
    
    if (active !== undefined) {
      whereConditions.push(eq(scalabilitySchema.activityTemplates.isActive, active));
    }

    // For tags, we'd need to use array contains logic (PostgreSQL specific)
    if (tags) {
      const requestedTags = tags.split(',').map((tag: string) => tag.trim());
      whereConditions.push(
        sql`${scalabilitySchema.activityTemplates.tags} && ${requestedTags}`
      );
    }

    const templates = await db
      .select()
      .from(scalabilitySchema.activityTemplates)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(
        scalabilitySchema.activityTemplates.categoryType,
        scalabilitySchema.activityTemplates.name
      );

    const result = templates.map(template => ({
      ...template,
      createdAt: template.createdAt?.toISOString() || null,
      updatedAt: template.updatedAt?.toISOString() || null,
    }));

    return c.json({ data: result }, HttpStatusCodes.OK);

  } catch (error) {
    console.error("Error fetching activity templates:", error);
    return c.json({
      error: "INTERNAL_SERVER_ERROR", 
      message: "Failed to fetch activity templates"
    }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

// Handler for creating activity template
export const createActivityTemplate: AppRouteHandler<any> = async (c) => {
  const body = (c as any).req.valid("json");
  
  try {
    // Check for duplicates
    const existing = await db
      .select({ id: scalabilitySchema.activityTemplates.id })
      .from(scalabilitySchema.activityTemplates)
      .where(
        and(
          eq(scalabilitySchema.activityTemplates.name, body.name),
          eq(scalabilitySchema.activityTemplates.categoryType, body.categoryType)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return c.json({
        error: "CONFLICT",
        message: `Template with name "${body.name}" already exists in category "${body.categoryType}"`
      }, HttpStatusCodes.CONFLICT);
    }

    const [newTemplate] = await db
      .insert(scalabilitySchema.activityTemplates)
      .values({
        name: body.name,
        description: body.description || null,
        categoryType: body.categoryType,
        tags: body.tags || [],
        metadata: body.metadata || null,
      })
      .returning();

    c.get("logger")?.info("Activity template created", {
      templateId: newTemplate.id,
      name: newTemplate.name,
      categoryType: newTemplate.categoryType
    });

    const result = {
      ...newTemplate,
      createdAt: newTemplate.createdAt?.toISOString() || null,
      updatedAt: newTemplate.updatedAt?.toISOString() || null,
    };

    return c.json(result, HttpStatusCodes.CREATED);

  } catch (error) {
    console.error("Error creating activity template:", error);
    return c.json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Failed to create activity template"
    }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

// Handler for getting project structure (admin endpoint)
export const getProjectStructure: AppRouteHandler<any> = async (c) => {
  const { projectId } = (c as any).req.valid("param");
  
  try {
    // Get project info
    const project = await db.query.projects.findFirst({
      where: eq(schema.projects.id, projectId),
      columns: {
        id: true,
        name: true,
        code: true,
        description: true,
      }
    });

    if (!project) {
      return c.json({
        error: "NOT_FOUND",
        message: `Project with ID ${projectId} not found`
      }, HttpStatusCodes.NOT_FOUND);
    }

    // Get structure for both facility types
    const hospitalStructure = await getStructureForFacilityType(projectId, "hospital");
    const healthCenterStructure = await getStructureForFacilityType(projectId, "health_center");

    // Get version history
    const versions = await db
      .select({
        version: scalabilitySchema.planningCategoryVersions.version,
        facilityType: scalabilitySchema.planningCategoryVersions.facilityType,
        createdAt: scalabilitySchema.planningCategoryVersions.createdAt,
        createdBy: scalabilitySchema.planningCategoryVersions.createdBy,
        changeReason: scalabilitySchema.planningCategoryVersions.changeReason,
        isActive: scalabilitySchema.planningCategoryVersions.isActive,
      })
      .from(scalabilitySchema.planningCategoryVersions)
      .where(eq(scalabilitySchema.planningCategoryVersions.projectId, projectId))
      .groupBy(
        scalabilitySchema.planningCategoryVersions.version,
        scalabilitySchema.planningCategoryVersions.facilityType,
        scalabilitySchema.planningCategoryVersions.createdAt,
        scalabilitySchema.planningCategoryVersions.createdBy,
        scalabilitySchema.planningCategoryVersions.changeReason,
        scalabilitySchema.planningCategoryVersions.isActive
      )
      .orderBy(
        desc(scalabilitySchema.planningCategoryVersions.version),
        scalabilitySchema.planningCategoryVersions.facilityType
      );

    const result = {
      project,
      hospital: hospitalStructure,
      healthCenter: healthCenterStructure,
      versions: versions.map(v => ({
        ...v,
        createdAt: v.createdAt?.toISOString() || null,
        createdBy: v.createdBy?.toString() || null,
      })),
    };

    return c.json(result, HttpStatusCodes.OK);

  } catch (error) {
    console.error("Error fetching project structure:", error);
    return c.json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch project structure"
    }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

// Helper function to get structure for a specific facility type
async function getStructureForFacilityType(projectId: number, facilityType: "hospital" | "health_center") {
  try {
    // Get categories
    const categories = await db
      .select()
      .from(scalabilitySchema.planningCategoryVersions)
      .where(
        and(
          eq(scalabilitySchema.planningCategoryVersions.projectId, projectId),
          eq(scalabilitySchema.planningCategoryVersions.facilityType, facilityType),
          isNull(scalabilitySchema.planningCategoryVersions.validTo)
        )
      )
      .orderBy(scalabilitySchema.planningCategoryVersions.displayOrder);

    if (categories.length === 0) {
      return undefined;
    }

    // Get activities
    const categoryVersionIds = categories.map(cat => cat.id);
    const activities = await db
      .select()
      .from(scalabilitySchema.planningActivityVersions)
      .where(
        and(
          inArray(scalabilitySchema.planningActivityVersions.categoryVersionId, categoryVersionIds),
          isNull(scalabilitySchema.planningActivityVersions.validTo)
        )
      )
      .orderBy(scalabilitySchema.planningActivityVersions.displayOrder);

    // Get templates
    const templates = await db
      .select()
      .from(scalabilitySchema.activityTemplates)
      .where(eq(scalabilitySchema.activityTemplates.isActive, true));

    return {
      categories: categories.map(cat => ({
        ...cat,
        validFrom: cat.validFrom?.toISOString() || null,
        validTo: cat.validTo?.toISOString() || null,
      })),
      activities: activities.map(act => ({
        ...act,
        validFrom: act.validFrom?.toISOString() || null,
        validTo: act.validTo?.toISOString() || null,
      })),
      templates: templates.map(tmpl => ({
        ...tmpl,
        createdAt: tmpl.createdAt?.toISOString() || null,
        updatedAt: tmpl.updatedAt?.toISOString() || null,
      })),
    };

  } catch (error) {
    console.error(`Error fetching structure for ${facilityType}:`, error);
    return undefined;
  }
}

// Helper function to get default templates (for fallback compatibility)
async function getDefaultTemplates() {
  return [
    {
      id: 1,
      name: "Medical Doctor Salary",
      description: "Template for medical doctor salary activities",
      categoryType: "HR",
      tags: ["salary", "medical", "staff"],
      isActive: true,
      metadata: { 
        suggestedFrequency: 12,
        costRange: { min: 50000, max: 200000 }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: "Transport Costs",
      description: "Template for various transport-related activities",
      categoryType: "TRC",
      tags: ["transport", "travel", "mission"],
      isActive: true,
      metadata: {
        suggestedFrequency: 4,
        costRange: { min: 100, max: 10000 }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];
}

// Placeholder handlers for the remaining endpoints
export const updateActivityTemplate: AppRouteHandler<any> = async (c) => {
  const { templateId } = (c as any).req.valid("param");
  const body = (c as any).req.valid("json");
  
  try {
    const [updatedTemplate] = await db
      .update(scalabilitySchema.activityTemplates)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(scalabilitySchema.activityTemplates.id, templateId))
      .returning();

    if (!updatedTemplate) {
      return c.json({
        error: "NOT_FOUND",
        message: "Template not found"
      }, HttpStatusCodes.NOT_FOUND);
    }

    const result = {
      ...updatedTemplate,
      createdAt: updatedTemplate.createdAt?.toISOString() || null,
      updatedAt: updatedTemplate.updatedAt?.toISOString() || null,
    };

    return c.json(result, HttpStatusCodes.OK);

  } catch (error) {
    console.error("Error updating activity template:", error);
    return c.json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Failed to update activity template"
    }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const deactivateActivityTemplate: AppRouteHandler<any> = async (c) => {
  const { templateId } = (c as any).req.valid("param");
  
  try {
    // Check if template is in use
    const usageCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(scalabilitySchema.planningActivityVersions)
      .where(
        and(
          eq(scalabilitySchema.planningActivityVersions.templateId, templateId),
          isNull(scalabilitySchema.planningActivityVersions.validTo)
        )
      );

    if (usageCount[0]?.count > 0) {
      return c.json({
        error: "CONFLICT",
        message: "Cannot deactivate template that is currently in use"
      }, HttpStatusCodes.CONFLICT);
    }

    const [updatedTemplate] = await db
      .update(scalabilitySchema.activityTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(scalabilitySchema.activityTemplates.id, templateId))
      .returning({ id: scalabilitySchema.activityTemplates.id });

    if (!updatedTemplate) {
      return c.json({
        error: "NOT_FOUND",
        message: "Template not found"
      }, HttpStatusCodes.NOT_FOUND);
    }

    return c.json({
      message: "Activity template deactivated successfully"
    }, HttpStatusCodes.OK);

  } catch (error) {
    console.error("Error deactivating activity template:", error);
    return c.json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Failed to deactivate activity template"
    }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const getActivitiesByTemplate: AppRouteHandler<any> = async (c) => {
  const { templateId } = (c as any).req.valid("param");
  
  try {
    const [template] = await db
      .select()
      .from(scalabilitySchema.activityTemplates)
      .where(eq(scalabilitySchema.activityTemplates.id, templateId))
      .limit(1);

    if (!template) {
      return c.json({
        error: "NOT_FOUND",
        message: "Template not found"
      }, HttpStatusCodes.NOT_FOUND);
    }

    // Get activities using this template
    const activities = await db
      .select()
      .from(scalabilitySchema.planningActivityVersions)
      .where(eq(scalabilitySchema.planningActivityVersions.templateId, templateId));

    // Get projects using this template
    const projectsUsing = await db
      .select({
        projectId: scalabilitySchema.planningCategoryVersions.projectId,
        projectName: schema.projects.name,
        facilityType: scalabilitySchema.planningActivityVersions.facilityType,
      })
      .from(scalabilitySchema.planningActivityVersions)
      .innerJoin(
        scalabilitySchema.planningCategoryVersions,
        eq(scalabilitySchema.planningActivityVersions.categoryVersionId, scalabilitySchema.planningCategoryVersions.id)
      )
      .innerJoin(
        schema.projects,
        eq(scalabilitySchema.planningCategoryVersions.projectId, schema.projects.id)
      )
      .where(eq(scalabilitySchema.planningActivityVersions.templateId, templateId))
      .groupBy(
        scalabilitySchema.planningCategoryVersions.projectId,
        schema.projects.name,
        scalabilitySchema.planningActivityVersions.facilityType
      );

    const result = {
      template: {
        ...template,
        createdAt: template.createdAt?.toISOString() || null,
        updatedAt: template.updatedAt?.toISOString() || null,
      },
      activities: activities.map(act => ({
        ...act,
        validFrom: act.validFrom?.toISOString() || null,
        validTo: act.validTo?.toISOString() || null,
      })),
      projectsUsing,
    };

    return c.json(result, HttpStatusCodes.OK);

  } catch (error) {
    console.error("Error fetching activities by template:", error);
    return c.json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch activities by template"
    }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const importActivityConfiguration: AppRouteHandler<any> = async (c) => {
  // Implementation would go here - complex logic for importing from other projects or templates
  return c.json({
    message: "Import functionality coming soon",
    version: 1,
    imported: { categories: 0, activities: 0 }
  }, HttpStatusCodes.OK);
};

export const publishActivityConfiguration: AppRouteHandler<any> = async (c) => {
  // Implementation would go here - logic for publishing draft versions to active
  return c.json({
    message: "Publish functionality coming soon",
    publishedVersion: 1,
    activatedAt: new Date().toISOString()
  }, HttpStatusCodes.OK);
}; 

/**
 * Handler for creating individual activities in existing categories
 */
export const createIndividualActivity: AppRouteHandler<any> = async (c) => {
  const body = (c as any).req.valid("json");
  
  try {
    // Resolve project ID from code if needed
    let projectId = body.projectId;
    if (!projectId && body.projectCode) {
      const project = await db.query.projects.findFirst({
        where: eq(schema.projects.code, body.projectCode),
        columns: { id: true }
      });
      if (!project) {
        return c.json({ 
          error: "NOT_FOUND", 
          message: `Project with code "${body.projectCode}" not found` 
        }, HttpStatusCodes.NOT_FOUND);
      }
      projectId = project.id;
    }

    // Find the category by code
    const category = await db
      .select()
      .from(scalabilitySchema.planningCategoryVersions)
      .where(
        and(
          eq(scalabilitySchema.planningCategoryVersions.projectId, projectId),
          eq(scalabilitySchema.planningCategoryVersions.facilityType, body.facilityType),
          eq(scalabilitySchema.planningCategoryVersions.code, body.activity.categoryCode),
          isNull(scalabilitySchema.planningCategoryVersions.validTo)
        )
      )
      .limit(1);

    if (category.length === 0) {
      return c.json({
        error: "NOT_FOUND",
        message: `Category "${body.activity.categoryCode}" not found for project ${projectId} and facility type ${body.facilityType}`
      }, HttpStatusCodes.NOT_FOUND);
    }

    const categoryVersion = category[0];

    // Check if activity already exists with same name in this category
    const existingActivity = await db
      .select({ id: scalabilitySchema.planningActivityVersions.id })
      .from(scalabilitySchema.planningActivityVersions)
      .where(
        and(
          eq(scalabilitySchema.planningActivityVersions.categoryVersionId, categoryVersion.id),
          eq(scalabilitySchema.planningActivityVersions.name, body.activity.name),
          isNull(scalabilitySchema.planningActivityVersions.validTo)
        )
      )
      .limit(1);

    if (existingActivity.length > 0) {
      return c.json({
        error: "CONFLICT",
        message: `Activity "${body.activity.name}" already exists in category "${body.activity.categoryCode}"`
      }, HttpStatusCodes.CONFLICT);
    }

    // Create the new activity
    const activityId = Date.now() + Math.floor(Math.random() * 1000); // Simple ID generation
    
    const [newActivity] = await db
      .insert(scalabilitySchema.planningActivityVersions)
      .values({
        activityId,
        version: categoryVersion.version,
        templateId: body.activity.templateId || null,
        categoryVersionId: categoryVersion.id,
        facilityType: body.facilityType,
        name: body.activity.name,
        displayOrder: body.activity.displayOrder,
        isTotalRow: body.activity.isTotalRow || false,
        config: body.activity.config || null,
        defaultFrequency: body.activity.defaultFrequency || null,
        defaultUnitCost: body.activity.defaultUnitCost || null,
        changeReason: body.activity.changeReason || 'New activity added',
      })
      .returning();

    c.get("logger")?.info("Individual activity created", {
      activityId: newActivity.id,
      projectId,
      facilityType: body.facilityType,
      categoryCode: body.activity.categoryCode,
      activityName: body.activity.name
    });

    return c.json({
      message: "Activity created successfully",
      activity: {
        id: newActivity.id,
        name: newActivity.name,
        categoryCode: body.activity.categoryCode,
        displayOrder: newActivity.displayOrder,
        isTotalRow: newActivity.isTotalRow,
        defaultFrequency: newActivity.defaultFrequency,
        defaultUnitCost: newActivity.defaultUnitCost,
      }
    }, HttpStatusCodes.CREATED);

  } catch (error) {
    console.error("Error creating individual activity:", error);
    return c.json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Failed to create activity"
    }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
}; 