import { db } from "@/db";
import * as schema from "@/db/schema";
import * as scalabilitySchema from "@/db/schema/planning-scalability";
import { eq, and, or, like, inArray, desc, asc, isNull, sql } from "drizzle-orm";
import { toast } from "sonner";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CreateProjectParams {
  name: string;
  code: string;
  description?: string;
  projectType?: 'HIV' | 'Malaria' | 'TB';
  facilityId?: number;
  reportingPeriodId?: number;
  userId?: number;
}

export interface CreateFacilityParams {
  name: string;
  facilityType: 'hospital' | 'health_center';
  districtId: number;
}

export interface CreatePlanningCategoryParams {
  projectId: number;
  facilityType: 'hospital' | 'health_center';
  code: string;
  name: string;
  displayOrder: number;
}

export interface CreatePlanningActivityParams {
  categoryId: number;
  facilityType: 'hospital' | 'health_center';
  name: string;
  displayOrder: number;
  isTotalRow?: boolean;
  projectId: number;
}

export interface CreateActivityTemplateParams {
  name: string;
  description?: string;
  categoryType: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdBy?: number;
}

export interface CreatePlanningDataParams {
  activityId: number;
  facilityId: number;
  reportingPeriodId: number;
  projectId: number;
  frequency: string;
  unitCost: string;
  countQ1?: number;
  countQ2?: number;
  countQ3?: number;
  countQ4?: number;
  comment?: string;
}

export interface CreateExecutionDataParams {
  reportingPeriodId?: number;
  activityId?: number;
  q1Amount?: string;
  q2Amount?: string;
  q3Amount?: string;
  q4Amount?: string;
  comment?: string;
  facilityId: number;
  projectId: number;
  createdBy?: string;
}


// ============================================================================
// PROJECT OPERATIONS
// ============================================================================

export const ProjectOperations = {
  // Create a new project
  async create(params: CreateProjectParams) {
    try {
      const [project] = await db
        .insert(schema.projects)
        .values({
          name: params.name,
          code: params.code,
          description: params.description,
          projectType: params.projectType,
          facilityId: params.facilityId,
          reportingPeriodId: params.reportingPeriodId,
          userId: params.userId,
        })
        .returning();

      console.log(`✅ Project created: ${project.name} (ID: ${project.id})`);
      return { success: true, data: project };
    } catch (error: any) {
      console.error('❌ Error creating project:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all projects with optional filters
  async getAll(filters?: {
    status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
    projectType?: 'HIV' | 'Malaria' | 'TB';
    code?: string;
  }) {
    try {
      let whereConditions = [];
      
      if (filters?.status) {
        whereConditions.push(eq(schema.projects.status, filters.status));
      }
      if (filters?.projectType) {
        whereConditions.push(eq(schema.projects.projectType, filters.projectType));
      }
      if (filters?.code) {
        whereConditions.push(eq(schema.projects.code, filters.code));
      }

      const projects = await db
        .select()
        .from(schema.projects)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(asc(schema.projects.name));

      console.log(`✅ Retrieved ${projects.length} projects`);
      return { success: true, data: projects };
    } catch (error: any) {
      console.error('❌ Error retrieving projects:', error);
      return { success: false, error: error.message };
    }
  },

  // Get project by ID
  async getById(id: number) {
    try {
      const [project] = await db
        .select()
        .from(schema.projects)
        .where(eq(schema.projects.id, id))
        .limit(1);

      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      console.log(`✅ Retrieved project: ${project.name}`);
      return { success: true, data: project };
    } catch (error: any) {
      console.error('❌ Error retrieving project:', error);
      return { success: false, error: error.message };
    }
  },

  // Update project
  async update(id: number, updates: Partial<CreateProjectParams>) {
    try {
      const [updatedProject] = await db
        .update(schema.projects)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(schema.projects.id, id))
        .returning();

      if (!updatedProject) {
        return { success: false, error: 'Project not found' };
      }

      console.log(`✅ Project updated: ${updatedProject.name}`);
      return { success: true, data: updatedProject };
    } catch (error: any) {
      console.error('❌ Error updating project:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete project (soft delete by setting status to ARCHIVED)
  async delete(id: number) {
    try {
      const [deletedProject] = await db
        .update(schema.projects)
        .set({
          status: 'ARCHIVED',
          updatedAt: new Date(),
        })
        .where(eq(schema.projects.id, id))
        .returning();

      if (!deletedProject) {
        return { success: false, error: 'Project not found' };
      }

      console.log(`✅ Project archived: ${deletedProject.name}`);
      return { success: true, data: deletedProject };
    } catch (error: any) {
      console.error('❌ Error archiving project:', error);
      return { success: false, error: error.message };
    }
  },
};

// ============================================================================
// FACILITY OPERATIONS
// ============================================================================

export const FacilityOperations = {
  // Create a new facility
  async create(params: CreateFacilityParams) {
    try {
      const [facility] = await db
        .insert(schema.facilities)
        .values({
          name: params.name,
          facilityType: params.facilityType,
          districtId: params.districtId,
        })
        .returning();

      console.log(`✅ Facility created: ${facility.name} (ID: ${facility.id})`);
      return { success: true, data: facility };
    } catch (error: any) {
      console.error('❌ Error creating facility:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all facilities with optional filters
  async getAll(filters?: {
    facilityType?: 'hospital' | 'health_center';
    districtId?: number;
    name?: string;
  }) {
    try {
      let whereConditions = [];
      
      if (filters?.facilityType) {
        whereConditions.push(eq(schema.facilities.facilityType, filters.facilityType));
      }
      if (filters?.districtId) {
        whereConditions.push(eq(schema.facilities.districtId, filters.districtId));
      }
      if (filters?.name) {
        whereConditions.push(like(schema.facilities.name, `%${filters.name}%`));
      }

      const facilities = await db
        .select({
          id: schema.facilities.id,
          name: schema.facilities.name,
          facilityType: schema.facilities.facilityType,
          districtId: schema.facilities.districtId,
          districtName: schema.districts.name,
          provinceName: schema.provinces.name,
        })
        .from(schema.facilities)
        .leftJoin(schema.districts, eq(schema.facilities.districtId, schema.districts.id))
        .leftJoin(schema.provinces, eq(schema.districts.provinceId, schema.provinces.id))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(asc(schema.facilities.name));

      console.log(`✅ Retrieved ${facilities.length} facilities`);
      return { success: true, data: facilities };
    } catch (error: any) {
      console.error('❌ Error retrieving facilities:', error);
      return { success: false, error: error.message };
    }
  },

  // Get facility by ID
  async getById(id: number) {
    try {
      const [facility] = await db
        .select({
          id: schema.facilities.id,
          name: schema.facilities.name,
          facilityType: schema.facilities.facilityType,
          districtId: schema.facilities.districtId,
          districtName: schema.districts.name,
          provinceName: schema.provinces.name,
        })
        .from(schema.facilities)
        .leftJoin(schema.districts, eq(schema.facilities.districtId, schema.districts.id))
        .leftJoin(schema.provinces, eq(schema.districts.provinceId, schema.provinces.id))
        .where(eq(schema.facilities.id, id))
        .limit(1);

      if (!facility) {
        return { success: false, error: 'Facility not found' };
      }

      console.log(`✅ Retrieved facility: ${facility.name}`);
      return { success: true, data: facility };
    } catch (error: any) {
      console.error('❌ Error retrieving facility:', error);
      return { success: false, error: error.message };
    }
  },

  // Update facility
  async update(id: number, updates: Partial<CreateFacilityParams>) {
    try {
      const [updatedFacility] = await db
        .update(schema.facilities)
        .set(updates)
        .where(eq(schema.facilities.id, id))
        .returning();

      if (!updatedFacility) {
        return { success: false, error: 'Facility not found' };
      }

      console.log(`✅ Facility updated: ${updatedFacility.name}`);
      return { success: true, data: updatedFacility };
    } catch (error: any) {
      console.error('❌ Error updating facility:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete facility
  async delete(id: number) {
    try {
      const [deletedFacility] = await db
        .delete(schema.facilities)
        .where(eq(schema.facilities.id, id))
        .returning();

      if (!deletedFacility) {
        return { success: false, error: 'Facility not found' };
      }

      console.log(`✅ Facility deleted: ${deletedFacility.name}`);
      return { success: true, data: deletedFacility };
    } catch (error: any) {
      console.error('❌ Error deleting facility:', error);
      return { success: false, error: error.message };
    }
  },
};

// ============================================================================
// PLANNING CATEGORIES OPERATIONS (Current System)
// ============================================================================

export const PlanningCategoryOperations = {
  // Create a new planning category
  async create(params: CreatePlanningCategoryParams) {
    try {
      const [category] = await db
        .insert(schema.planningCategories)
        .values({
          projectId: params.projectId,
          facilityType: params.facilityType,
          code: params.code,
          name: params.name,
          displayOrder: params.displayOrder,
        })
        .returning();

      console.log(`✅ Planning category created: ${category.name} (ID: ${category.id})`);
      return { success: true, data: category };
    } catch (error: any) {
      console.error('❌ Error creating planning category:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all planning categories for a project and facility type
  async getByProject(projectId: number, facilityType: 'hospital' | 'health_center') {
    try {
      const categories = await db
        .select()
        .from(schema.planningCategories)
        .where(
          and(
            eq(schema.planningCategories.projectId, projectId),
            eq(schema.planningCategories.facilityType, facilityType)
          )
        )
        .orderBy(asc(schema.planningCategories.displayOrder));

      console.log(`✅ Retrieved ${categories.length} planning categories`);
      return { success: true, data: categories };
    } catch (error: any) {
      console.error('❌ Error retrieving planning categories:', error);
      return { success: false, error: error.message };
    }
  },

  // Update planning category
  async update(id: number, updates: Partial<CreatePlanningCategoryParams>) {
    try {
      const [updatedCategory] = await db
        .update(schema.planningCategories)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(schema.planningCategories.id, id))
        .returning();

      if (!updatedCategory) {
        return { success: false, error: 'Planning category not found' };
      }

      console.log(`✅ Planning category updated: ${updatedCategory.name}`);
      return { success: true, data: updatedCategory };
    } catch (error: any) {
      console.error('❌ Error updating planning category:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete planning category
  async delete(id: number) {
    try {
      const [deletedCategory] = await db
        .delete(schema.planningCategories)
        .where(eq(schema.planningCategories.id, id))
        .returning();

      if (!deletedCategory) {
        return { success: false, error: 'Planning category not found' };
      }

      console.log(`✅ Planning category deleted: ${deletedCategory.name}`);
      return { success: true, data: deletedCategory };
    } catch (error: any) {
      console.error('❌ Error deleting planning category:', error);
      return { success: false, error: error.message };
    }
  },
};

// ============================================================================
// PLANNING ACTIVITIES OPERATIONS (Current System)
// ============================================================================

export const PlanningActivityOperations = {
  // Create a new planning activity
  async create(params: CreatePlanningActivityParams) {
    try {
      const [activity] = await db
        .insert(schema.planningActivities)
        .values({
          categoryId: params.categoryId,
          facilityType: params.facilityType,
          name: params.name,
          displayOrder: params.displayOrder,
          isTotalRow: params.isTotalRow || false,
          projectId: params.projectId,
        })
        .returning();

      console.log(`✅ Planning activity created: ${activity.name} (ID: ${activity.id})`);
      return { success: true, data: activity };
    } catch (error: any) {
      console.error('❌ Error creating planning activity:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all planning activities for a category
  async getByCategory(categoryId: number) {
    try {
      const activities = await db
        .select()
        .from(schema.planningActivities)
        .where(eq(schema.planningActivities.categoryId, categoryId))
        .orderBy(asc(schema.planningActivities.displayOrder));

      console.log(`✅ Retrieved ${activities.length} planning activities`);
      return { success: true, data: activities };
    } catch (error: any) {
      console.error('❌ Error retrieving planning activities:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all planning activities for a project and facility type
  async getByProject(projectId: number, facilityType: 'hospital' | 'health_center') {
    try {
      const activities = await db
        .select({
          id: schema.planningActivities.id,
          name: schema.planningActivities.name,
          displayOrder: schema.planningActivities.displayOrder,
          isTotalRow: schema.planningActivities.isTotalRow,
          categoryId: schema.planningActivities.categoryId,
          categoryName: schema.planningCategories.name,
          categoryCode: schema.planningCategories.code,
        })
        .from(schema.planningActivities)
        .leftJoin(schema.planningCategories, eq(schema.planningActivities.categoryId, schema.planningCategories.id))
        .where(
          and(
            eq(schema.planningActivities.projectId, projectId),
            eq(schema.planningActivities.facilityType, facilityType)
          )
        )
        .orderBy(
          asc(schema.planningCategories.displayOrder),
          asc(schema.planningActivities.displayOrder)
        );

      console.log(`✅ Retrieved ${activities.length} planning activities`);
      return { success: true, data: activities };
    } catch (error: any) {
      console.error('❌ Error retrieving planning activities:', error);
      return { success: false, error: error.message };
    }
  },

  // Update planning activity
  async update(id: number, updates: Partial<CreatePlanningActivityParams>) {
    try {
      const [updatedActivity] = await db
        .update(schema.planningActivities)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(schema.planningActivities.id, id))
        .returning();

      if (!updatedActivity) {
        return { success: false, error: 'Planning activity not found' };
      }

      console.log(`✅ Planning activity updated: ${updatedActivity.name}`);
      return { success: true, data: updatedActivity };
    } catch (error: any) {
      console.error('❌ Error updating planning activity:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete planning activity
  async delete(id: number) {
    try {
      const [deletedActivity] = await db
        .delete(schema.planningActivities)
        .where(eq(schema.planningActivities.id, id))
        .returning();

      if (!deletedActivity) {
        return { success: false, error: 'Planning activity not found' };
      }

      console.log(`✅ Planning activity deleted: ${deletedActivity.name}`);
      return { success: true, data: deletedActivity };
    } catch (error: any) {
      console.error('❌ Error deleting planning activity:', error);
      return { success: false, error: error.message };
    }
  },
};

// ============================================================================
// ACTIVITY TEMPLATES OPERATIONS (Scalability System)
// ============================================================================

export const ActivityTemplateOperations = {
  // Create a new activity template
  async create(params: CreateActivityTemplateParams) {
    try {
      const [template] = await db
        .insert(scalabilitySchema.activityTemplates)
        .values({
          name: params.name,
          description: params.description,
          categoryType: params.categoryType,
          tags: params.tags || [],
          metadata: params.metadata,
          createdBy: params.createdBy,
        })
        .returning();

      console.log(`✅ Activity template created: ${template.name} (ID: ${template.id})`);
      return { success: true, data: template };
    } catch (error: any) {
      console.error('❌ Error creating activity template:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all activity templates with optional filters
  async getAll(filters?: {
    categoryType?: string;
    tags?: string[];
    isActive?: boolean;
  }) {
    try {
      let whereConditions = [];
      
      if (filters?.categoryType) {
        whereConditions.push(eq(scalabilitySchema.activityTemplates.categoryType, filters.categoryType));
      }
      if (filters?.isActive !== undefined) {
        whereConditions.push(eq(scalabilitySchema.activityTemplates.isActive, filters.isActive));
      }
      if (filters?.tags && filters.tags.length > 0) {
        whereConditions.push(
          sql`${scalabilitySchema.activityTemplates.tags} && ${filters.tags}`
        );
      }

      const templates = await db
        .select()
        .from(scalabilitySchema.activityTemplates)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(
          asc(scalabilitySchema.activityTemplates.categoryType),
          asc(scalabilitySchema.activityTemplates.name)
        );

      console.log(`✅ Retrieved ${templates.length} activity templates`);
      return { success: true, data: templates };
    } catch (error: any) {
      console.error('❌ Error retrieving activity templates:', error);
      return { success: false, error: error.message };
    }
  },

  // Get activity template by ID
  async getById(id: number) {
    try {
      const [template] = await db
        .select()
        .from(scalabilitySchema.activityTemplates)
        .where(eq(scalabilitySchema.activityTemplates.id, id))
        .limit(1);

      if (!template) {
        return { success: false, error: 'Activity template not found' };
      }

      console.log(`✅ Retrieved activity template: ${template.name}`);
      return { success: true, data: template };
    } catch (error: any) {
      console.error('❌ Error retrieving activity template:', error);
      return { success: false, error: error.message };
    }
  },

  // Update activity template
  async update(id: number, updates: Partial<CreateActivityTemplateParams>) {
    try {
      const [updatedTemplate] = await db
        .update(scalabilitySchema.activityTemplates)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(scalabilitySchema.activityTemplates.id, id))
        .returning();

      if (!updatedTemplate) {
        return { success: false, error: 'Activity template not found' };
      }

      console.log(`✅ Activity template updated: ${updatedTemplate.name}`);
      return { success: true, data: updatedTemplate };
    } catch (error: any) {
      console.error('❌ Error updating activity template:', error);
      return { success: false, error: error.message };
    }
  },

  // Deactivate activity template (soft delete)
  async deactivate(id: number) {
    try {
      const [deactivatedTemplate] = await db
        .update(scalabilitySchema.activityTemplates)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(scalabilitySchema.activityTemplates.id, id))
        .returning();

      if (!deactivatedTemplate) {
        return { success: false, error: 'Activity template not found' };
      }

      console.log(`✅ Activity template deactivated: ${deactivatedTemplate.name}`);
      return { success: true, data: deactivatedTemplate };
    } catch (error: any) {
      console.error('❌ Error deactivating activity template:', error);
      return { success: false, error: error.message };
    }
  },
};

// ============================================================================
// PLANNING DATA OPERATIONS
// ============================================================================

export const PlanningDataOperations = {
  // Create planning data
  async create(params: CreatePlanningDataParams) {
    try {
      const [planningData] = await db
        .insert(schema.planningData)
        .values({
          activityId: params.activityId,
          facilityId: params.facilityId,
          reportingPeriodId: params.reportingPeriodId,
          projectId: params.projectId,
          frequency: params.frequency,
          unitCost: params.unitCost,
          countQ1: params.countQ1 || 0,
          countQ2: params.countQ2 || 0,
          countQ3: params.countQ3 || 0,
          countQ4: params.countQ4 || 0,
          comment: params.comment,
        } as any)
        .returning();

      console.log(`✅ Planning data created for activity ${params.activityId}`);
      return { success: true, data: planningData };
    } catch (error: any) {
      console.error('❌ Error creating planning data:', error);
      return { success: false, error: error.message };
    }
  },

  // Get planning data by facility and reporting period
  async getByFacilityAndPeriod(facilityId: number, reportingPeriodId: number, projectId?: number) {
    try {
      let whereConditions = [
        eq(schema.planningData.facilityId, facilityId),
        eq(schema.planningData.reportingPeriodId, reportingPeriodId),
      ];

      if (projectId) {
        whereConditions.push(eq(schema.planningData.projectId, projectId));
      }

      const planningData = await db
        .select({
          id: schema.planningData.id,
          activityId: schema.planningData.activityId,
          facilityId: schema.planningData.facilityId,
          reportingPeriodId: schema.planningData.reportingPeriodId,
          projectId: schema.planningData.projectId,
          frequency: schema.planningData.frequency,
          unitCost: schema.planningData.unitCost,
          countQ1: schema.planningData.countQ1,
          countQ2: schema.planningData.countQ2,
          countQ3: schema.planningData.countQ3,
          countQ4: schema.planningData.countQ4,
          amountQ1: schema.planningData.amountQ1,
          amountQ2: schema.planningData.amountQ2,
          amountQ3: schema.planningData.amountQ3,
          amountQ4: schema.planningData.amountQ4,
          totalBudget: schema.planningData.totalBudget,
          comment: schema.planningData.comment,
          activityName: schema.planningActivities.name,
          categoryName: schema.planningCategories.name,
        })
        .from(schema.planningData)
        .leftJoin(schema.planningActivities, eq(schema.planningData.activityId, schema.planningActivities.id))
        .leftJoin(schema.planningCategories, eq(schema.planningActivities.categoryId, schema.planningCategories.id))
        .where(and(...whereConditions))
        .orderBy(
          asc(schema.planningCategories.displayOrder),
          asc(schema.planningActivities.displayOrder)
        );

      console.log(`✅ Retrieved ${planningData.length} planning data records`);
      return { success: true, data: planningData };
    } catch (error: any) {
      console.error('❌ Error retrieving planning data:', error);
      return { success: false, error: error.message };
    }
  },

  // Update planning data
  async update(id: number, updates: Partial<CreatePlanningDataParams>) {
    try {
      const [updatedPlanningData] = await db
        .update(schema.planningData)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(schema.planningData.id, id))
        .returning();

      if (!updatedPlanningData) {
        return { success: false, error: 'Planning data not found' };
      }

      console.log(`✅ Planning data updated (ID: ${id})`);
      return { success: true, data: updatedPlanningData };
    } catch (error: any) {
      console.error('❌ Error updating planning data:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete planning data
  async delete(id: number) {
    try {
      const [deletedPlanningData] = await db
        .delete(schema.planningData)
        .where(eq(schema.planningData.id, id))
        .returning();

      if (!deletedPlanningData) {
        return { success: false, error: 'Planning data not found' };
      }

      console.log(`✅ Planning data deleted (ID: ${id})`);
      return { success: true, data: deletedPlanningData };
    } catch (error: any) {
      console.error('❌ Error deleting planning data:', error);
      return { success: false, error: error.message };
    }
  },
};

// ============================================================================
// EXECUTION DATA OPERATIONS
// ============================================================================

export const ExecutionDataOperations = {
  // Create execution data
  async create(params: CreateExecutionDataParams) {
    try {
      const [executionData] = await db
        .insert(schema.executionData)
        .values({
          reportingPeriodId: params.reportingPeriodId,
          activityId: params.activityId,
          q1Amount: params.q1Amount || '0.00',
          q2Amount: params.q2Amount || '0.00',
          q3Amount: params.q3Amount || '0.00',
          q4Amount: params.q4Amount || '0.00',
          comment: params.comment,
          facilityId: params.facilityId,
          projectId: params.projectId,
          createdBy: params.createdBy,
        } as any)
        .returning();

      console.log(`✅ Execution data created for facility ${params.facilityId}`);
      return { success: true, data: executionData };
    } catch (error: any) {
      console.error('❌ Error creating execution data:', error);
      return { success: false, error: error.message };
    }
  },

  // Get execution data by facility and reporting period
  async getByFacilityAndPeriod(facilityId: number, reportingPeriodId: number, projectId?: number) {
    try {
      let whereConditions = [
        eq(schema.executionData.facilityId, facilityId),
        eq(schema.executionData.reportingPeriodId, reportingPeriodId),
      ];

      if (projectId) {
        whereConditions.push(eq(schema.executionData.projectId, projectId));
      }

      const executionData = await db
        .select({
          id: schema.executionData.id,
          reportingPeriodId: schema.executionData.reportingPeriodId,
          activityId: schema.executionData.activityId,
          q1Amount: schema.executionData.q1Amount,
          q2Amount: schema.executionData.q2Amount,
          q3Amount: schema.executionData.q3Amount,
          q4Amount: schema.executionData.q4Amount,
          cumulativeBalance: schema.executionData.cumulativeBalance,
          comment: schema.executionData.comment,
          facilityId: schema.executionData.facilityId,
          projectId: schema.executionData.projectId,
          createdBy: schema.executionData.createdBy,
          updatedBy: schema.executionData.updatedBy,
          activityName: schema.activities.name,
          categoryName: schema.categories.name,
        })
        .from(schema.executionData)
        .leftJoin(schema.activities, eq(schema.executionData.activityId, schema.activities.id))
        .leftJoin(schema.categories, eq(schema.activities.categoryId, schema.categories.id))
        .where(and(...whereConditions))
        .orderBy(
          asc(schema.categories.displayOrder),
          asc(schema.activities.displayOrder)
        );

      console.log(`✅ Retrieved ${executionData.length} execution data records`);
      return { success: true, data: executionData };
    } catch (error: any) {
      console.error('❌ Error retrieving execution data:', error);
      return { success: false, error: error.message };
    }
  },

  // Update execution data
  async update(id: number, updates: Partial<CreateExecutionDataParams>) {
    try {
      const [updatedExecutionData] = await db
        .update(schema.executionData)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(schema.executionData.id, id))
        .returning();

      if (!updatedExecutionData) {
        return { success: false, error: 'Execution data not found' };
      }

      console.log(`✅ Execution data updated (ID: ${id})`);
      return { success: true, data: updatedExecutionData };
    } catch (error: any) {
      console.error('❌ Error updating execution data:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete execution data
  async delete(id: number) {
    try {
      const [deletedExecutionData] = await db
        .delete(schema.executionData)
        .where(eq(schema.executionData.id, id))
        .returning();

      if (!deletedExecutionData) {
        return { success: false, error: 'Execution data not found' };
      }

      console.log(`✅ Execution data deleted (ID: ${id})`);
      return { success: true, data: deletedExecutionData };
    } catch (error: any) {
      console.error('❌ Error deleting execution data:', error);
      return { success: false, error: error.message };
    }
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const UtilityOperations = {
  // Get database statistics
  async getDatabaseStats() {
    try {
      const stats = {
        projects: await db.select({ count: sql<number>`count(*)` }).from(schema.projects),
        facilities: await db.select({ count: sql<number>`count(*)` }).from(schema.facilities),
        planningCategories: await db.select({ count: sql<number>`count(*)` }).from(schema.planningCategories),
        planningActivities: await db.select({ count: sql<number>`count(*)` }).from(schema.planningActivities),
        planningData: await db.select({ count: sql<number>`count(*)` }).from(schema.planningData),
        executionData: await db.select({ count: sql<number>`count(*)` }).from(schema.executionData),
        activityTemplates: await db.select({ count: sql<number>`count(*)` }).from(scalabilitySchema.activityTemplates),
      };

      console.log('📊 Database Statistics:', stats);
      return { success: true, data: stats };
    } catch (error: any) {
      console.error('❌ Error getting database stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Bulk operations
  async bulkCreatePlanningData(data: CreatePlanningDataParams[]) {
    try {
      const results = await db
        .insert(schema.planningData)
        .values(data as any)
        .returning();

      console.log(`✅ Bulk created ${results.length} planning data records`);
      return { success: true, data: results };
    } catch (error: any) {
      console.error('❌ Error bulk creating planning data:', error);
      return { success: false, error: error.message };
    }
  },

  // Data validation
  async validatePlanningData(facilityId: number, reportingPeriodId: number, projectId: number) {
    try {
      // Check for duplicate entries
      const duplicates = await db
        .select()
        .from(schema.planningData)
        .where(
          and(
            eq(schema.planningData.facilityId, facilityId),
            eq(schema.planningData.reportingPeriodId, reportingPeriodId),
            eq(schema.planningData.projectId, projectId)
          )
        );

      const duplicateActivities = duplicates.reduce((acc, curr) => {
        acc[curr.activityId] = (acc[curr.activityId] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const issues = Object.entries(duplicateActivities)
        .filter(([_, count]) => count > 1)
        .map(([activityId, count]) => `Activity ${activityId} has ${count} entries`);

      if (issues.length > 0) {
        return { success: false, error: 'Validation failed', issues };
      }

      return { success: true, message: 'Data validation passed' };
    } catch (error: any) {
      console.error('❌ Error validating planning data:', error);
      return { success: false, error: error.message };
    }
  },
};

// ============================================================================
// EXPORT ALL OPERATIONS
// ============================================================================

export const DatabaseOperations = {
  projects: ProjectOperations,
  facilities: FacilityOperations,
  planningCategories: PlanningCategoryOperations,
  planningActivities: PlanningActivityOperations,
  activityTemplates: ActivityTemplateOperations,
  planningData: PlanningDataOperations,
  executionData: ExecutionDataOperations,
  utilities: UtilityOperations,
};

export default DatabaseOperations; 