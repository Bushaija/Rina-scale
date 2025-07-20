import { db } from '@/db';
import { eq, and, like, asc, desc, sql } from 'drizzle-orm';
import * as schema from '@/db/schema';

// ============================================================================
// INTERFACES
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
// DATABASE OPERATIONS
// ============================================================================

const DatabaseOperations = {
  // ============================================================================
  // PROJECTS
  // ============================================================================
  projects: {
    async create(params: CreateProjectParams) {
      try {
        const [project] = await db
          .insert(schema.projects)
          .values({
            name: params.name,
            code: params.code,
            description: params.description,
            projectType: params.projectType || 'HIV',
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        console.log(`✅ Project created: ${project.name}`);
        return { success: true, data: project };
      } catch (error: any) {
        console.error('❌ Error creating project:', error.message);
        return { success: false, error: error.message };
      }
    },

    async getAll(filters?: {
      status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
      projectType?: 'HIV' | 'Malaria' | 'TB';
      code?: string;
    }) {
      try {
        const whereConditions: any[] = [];
        
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
        console.error('❌ Error retrieving projects:', error.message);
        return { success: false, error: error.message };
      }
    },

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
        console.error('❌ Error retrieving project:', error.message);
        return { success: false, error: error.message };
      }
    },

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
        console.error('❌ Error updating project:', error.message);
        return { success: false, error: error.message };
      }
    },

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
        console.error('❌ Error archiving project:', error.message);
        return { success: false, error: error.message };
      }
    },
  },

  // ============================================================================
  // FACILITIES
  // ============================================================================
  facilities: {
    async create(params: CreateFacilityParams) {
      try {
        const [facility] = await db
          .insert(schema.facilities)
          .values({
            name: params.name,
            facilityType: params.facilityType,
            districtId: params.districtId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        console.log(`✅ Facility created: ${facility.name}`);
        return { success: true, data: facility };
      } catch (error: any) {
        console.error('❌ Error creating facility:', error.message);
        return { success: false, error: error.message };
      }
    },

    async getAll(filters?: {
      facilityType?: 'hospital' | 'health_center';
      districtId?: number;
      name?: string;
    }) {
      try {
        const whereConditions: any[] = [];
        
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
        console.error('❌ Error retrieving facilities:', error.message);
        return { success: false, error: error.message };
      }
    },

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
        console.error('❌ Error retrieving facility:', error.message);
        return { success: false, error: error.message };
      }
    },

    async update(id: number, updates: Partial<CreateFacilityParams>) {
      try {
        const [updatedFacility] = await db
          .update(schema.facilities)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(schema.facilities.id, id))
          .returning();

        if (!updatedFacility) {
          return { success: false, error: 'Facility not found' };
        }

        console.log(`✅ Facility updated: ${updatedFacility.name}`);
        return { success: true, data: updatedFacility };
      } catch (error: any) {
        console.error('❌ Error updating facility:', error.message);
        return { success: false, error: error.message };
      }
    },

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
        console.error('❌ Error deleting facility:', error.message);
        return { success: false, error: error.message };
      }
    },
  },

  // ============================================================================
  // PLANNING CATEGORIES
  // ============================================================================
  planningCategories: {
    async create(params: CreatePlanningCategoryParams) {
      try {
        const [category] = await db
          .insert(schema.categories)
          .values({
            code: params.code,
            name: params.name,
            displayOrder: params.displayOrder,
            projectId: params.projectId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        console.log(`✅ Planning category created: ${category.name}`);
        return { success: true, data: category };
      } catch (error: any) {
        console.error('❌ Error creating planning category:', error.message);
        return { success: false, error: error.message };
      }
    },

    async getByProject(projectId: number, facilityType: 'hospital' | 'health_center') {
      try {
        const categories = await db
          .select()
          .from(schema.categories)
          .where(eq(schema.categories.projectId, projectId))
          .orderBy(asc(schema.categories.displayOrder));

        console.log(`✅ Retrieved ${categories.length} categories for project ${projectId}`);
        return { success: true, data: categories };
      } catch (error: any) {
        console.error('❌ Error retrieving categories:', error.message);
        return { success: false, error: error.message };
      }
    },

    async update(id: number, updates: Partial<CreatePlanningCategoryParams>) {
      try {
        const [updatedCategory] = await db
          .update(schema.categories)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(schema.categories.id, id))
          .returning();

        if (!updatedCategory) {
          return { success: false, error: 'Category not found' };
        }

        console.log(`✅ Category updated: ${updatedCategory.name}`);
        return { success: true, data: updatedCategory };
      } catch (error: any) {
        console.error('❌ Error updating category:', error.message);
        return { success: false, error: error.message };
      }
    },

    async delete(id: number) {
      try {
        const [deletedCategory] = await db
          .delete(schema.categories)
          .where(eq(schema.categories.id, id))
          .returning();

        if (!deletedCategory) {
          return { success: false, error: 'Category not found' };
        }

        console.log(`✅ Category deleted: ${deletedCategory.name}`);
        return { success: true, data: deletedCategory };
      } catch (error: any) {
        console.error('❌ Error deleting category:', error.message);
        return { success: false, error: error.message };
      }
    },
  },

  // ============================================================================
  // PLANNING ACTIVITIES
  // ============================================================================
  planningActivities: {
    async create(params: CreatePlanningActivityParams) {
      try {
        const [activity] = await db
          .insert(schema.activities)
          .values({
            name: params.name,
            displayOrder: params.displayOrder,
            categoryId: params.categoryId,
            projectId: params.projectId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        console.log(`✅ Planning activity created: ${activity.name}`);
        return { success: true, data: activity };
      } catch (error: any) {
        console.error('❌ Error creating planning activity:', error.message);
        return { success: false, error: error.message };
      }
    },

    async getByCategory(categoryId: number) {
      try {
        const activities = await db
          .select()
          .from(schema.activities)
          .where(eq(schema.activities.categoryId, categoryId))
          .orderBy(asc(schema.activities.displayOrder));

        console.log(`✅ Retrieved ${activities.length} activities for category ${categoryId}`);
        return { success: true, data: activities };
      } catch (error: any) {
        console.error('❌ Error retrieving activities:', error.message);
        return { success: false, error: error.message };
      }
    },

    async getByProject(projectId: number, facilityType: 'hospital' | 'health_center') {
      try {
        const activities = await db
          .select({
            id: schema.activities.id,
            name: schema.activities.name,
            displayOrder: schema.activities.displayOrder,
            categoryId: schema.activities.categoryId,
            categoryName: schema.categories.name,
            categoryCode: schema.categories.code,
          })
          .from(schema.activities)
          .leftJoin(schema.categories, eq(schema.activities.categoryId, schema.categories.id))
          .where(eq(schema.activities.projectId, projectId))
          .orderBy(asc(schema.categories.displayOrder), asc(schema.activities.displayOrder));

        console.log(`✅ Retrieved ${activities.length} activities for project ${projectId}`);
        return { success: true, data: activities };
      } catch (error: any) {
        console.error('❌ Error retrieving activities:', error.message);
        return { success: false, error: error.message };
      }
    },

    async update(id: number, updates: Partial<CreatePlanningActivityParams>) {
      try {
        const [updatedActivity] = await db
          .update(schema.activities)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(schema.activities.id, id))
          .returning();

        if (!updatedActivity) {
          return { success: false, error: 'Activity not found' };
        }

        console.log(`✅ Activity updated: ${updatedActivity.name}`);
        return { success: true, data: updatedActivity };
      } catch (error: any) {
        console.error('❌ Error updating activity:', error.message);
        return { success: false, error: error.message };
      }
    },

    async delete(id: number) {
      try {
        const [deletedActivity] = await db
          .delete(schema.activities)
          .where(eq(schema.activities.id, id))
          .returning();

        if (!deletedActivity) {
          return { success: false, error: 'Activity not found' };
        }

        console.log(`✅ Activity deleted: ${deletedActivity.name}`);
        return { success: true, data: deletedActivity };
      } catch (error: any) {
        console.error('❌ Error deleting activity:', error.message);
        return { success: false, error: error.message };
      }
    },
  },

  // ============================================================================
  // ACTIVITY TEMPLATES
  // ============================================================================
  activityTemplates: {
    async create(params: CreateActivityTemplateParams) {
      try {
        const [template] = await db
          .insert(schema.activityTemplates)
          .values({
            name: params.name,
            description: params.description,
            categoryType: params.categoryType,
            tags: params.tags,
            metadata: params.metadata,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        console.log(`✅ Activity template created: ${template.name}`);
        return { success: true, data: template };
      } catch (error: any) {
        console.error('❌ Error creating activity template:', error.message);
        return { success: false, error: error.message };
      }
    },

    async getAll(filters?: {
      categoryType?: string;
      tags?: string[];
      isActive?: boolean;
    }) {
      try {
        const whereConditions: any[] = [];
        
        if (filters?.categoryType) {
          whereConditions.push(eq(schema.activityTemplates.categoryType, filters.categoryType));
        }
        if (filters?.isActive !== undefined) {
          whereConditions.push(eq(schema.activityTemplates.isActive, filters.isActive));
        }

        const templates = await db
          .select()
          .from(schema.activityTemplates)
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
          .orderBy(asc(schema.activityTemplates.name));

        console.log(`✅ Retrieved ${templates.length} activity templates`);
        return { success: true, data: templates };
      } catch (error: any) {
        console.error('❌ Error retrieving activity templates:', error.message);
        return { success: false, error: error.message };
      }
    },

    async getById(id: number) {
      try {
        const [template] = await db
          .select()
          .from(schema.activityTemplates)
          .where(eq(schema.activityTemplates.id, id))
          .limit(1);

        if (!template) {
          return { success: false, error: 'Activity template not found' };
        }

        console.log(`✅ Retrieved activity template: ${template.name}`);
        return { success: true, data: template };
      } catch (error: any) {
        console.error('❌ Error retrieving activity template:', error.message);
        return { success: false, error: error.message };
      }
    },

    async update(id: number, updates: Partial<CreateActivityTemplateParams>) {
      try {
        const [updatedTemplate] = await db
          .update(schema.activityTemplates)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(schema.activityTemplates.id, id))
          .returning();

        if (!updatedTemplate) {
          return { success: false, error: 'Activity template not found' };
        }

        console.log(`✅ Activity template updated: ${updatedTemplate.name}`);
        return { success: true, data: updatedTemplate };
      } catch (error: any) {
        console.error('❌ Error updating activity template:', error.message);
        return { success: false, error: error.message };
      }
    },

    async deactivate(id: number) {
      try {
        const [deactivatedTemplate] = await db
          .update(schema.activityTemplates)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(schema.activityTemplates.id, id))
          .returning();

        if (!deactivatedTemplate) {
          return { success: false, error: 'Activity template not found' };
        }

        console.log(`✅ Activity template deactivated: ${deactivatedTemplate.name}`);
        return { success: true, data: deactivatedTemplate };
      } catch (error: any) {
        console.error('❌ Error deactivating activity template:', error.message);
        return { success: false, error: error.message };
      }
    },
  },

  // ============================================================================
  // PLANNING DATA
  // ============================================================================
  planningData: {
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
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        console.log(`✅ Planning data created for activity ${params.activityId}`);
        return { success: true, data: planningData };
      } catch (error: any) {
        console.error('❌ Error creating planning data:', error.message);
        return { success: false, error: error.message };
      }
    },

    async getByFacilityAndPeriod(facilityId: number, reportingPeriodId: number, projectId?: number) {
      try {
        const whereConditions: any[] = [
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
            activityName: schema.activities.name,
            categoryName: schema.categories.name,
            categoryCode: schema.categories.code,
            frequency: schema.planningData.frequency,
            unitCost: schema.planningData.unitCost,
            countQ1: schema.planningData.countQ1,
            countQ2: schema.planningData.countQ2,
            countQ3: schema.planningData.countQ3,
            countQ4: schema.planningData.countQ4,
            amountQ1: sql`${schema.planningData.countQ1} * ${schema.planningData.unitCost}`,
            amountQ2: sql`${schema.planningData.countQ2} * ${schema.planningData.unitCost}`,
            amountQ3: sql`${schema.planningData.countQ3} * ${schema.planningData.unitCost}`,
            amountQ4: sql`${schema.planningData.countQ4} * ${schema.planningData.unitCost}`,
            totalBudget: sql`(${schema.planningData.countQ1} + ${schema.planningData.countQ2} + ${schema.planningData.countQ3} + ${schema.planningData.countQ4}) * ${schema.planningData.unitCost}`,
            comment: schema.planningData.comment,
          })
          .from(schema.planningData)
          .leftJoin(schema.activities, eq(schema.planningData.activityId, schema.activities.id))
          .leftJoin(schema.categories, eq(schema.activities.categoryId, schema.categories.id))
          .where(and(...whereConditions))
          .orderBy(asc(schema.categories.displayOrder), asc(schema.activities.displayOrder));

        console.log(`✅ Retrieved ${planningData.length} planning data records`);
        return { success: true, data: planningData };
      } catch (error: any) {
        console.error('❌ Error retrieving planning data:', error.message);
        return { success: false, error: error.message };
      }
    },

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

        console.log(`✅ Planning data updated: ${updatedPlanningData.id}`);
        return { success: true, data: updatedPlanningData };
      } catch (error: any) {
        console.error('❌ Error updating planning data:', error.message);
        return { success: false, error: error.message };
      }
    },

    async delete(id: number) {
      try {
        const [deletedPlanningData] = await db
          .delete(schema.planningData)
          .where(eq(schema.planningData.id, id))
          .returning();

        if (!deletedPlanningData) {
          return { success: false, error: 'Planning data not found' };
        }

        console.log(`✅ Planning data deleted: ${deletedPlanningData.id}`);
        return { success: true, data: deletedPlanningData };
      } catch (error: any) {
        console.error('❌ Error deleting planning data:', error.message);
        return { success: false, error: error.message };
      }
    },
  },

  // ============================================================================
  // EXECUTION DATA
  // ============================================================================
  executionData: {
    async create(params: CreateExecutionDataParams) {
      try {
        const [executionData] = await db
          .insert(schema.executionData)
          .values({
            facilityId: params.facilityId,
            projectId: params.projectId,
            activityId: params.activityId,
            reportingPeriodId: params.reportingPeriodId,
            q1Amount: params.q1Amount || '0.00',
            q2Amount: params.q2Amount || '0.00',
            q3Amount: params.q3Amount || '0.00',
            q4Amount: params.q4Amount || '0.00',
            comment: params.comment,
            createdBy: params.createdBy,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        console.log(`✅ Execution data created for facility ${params.facilityId}`);
        return { success: true, data: executionData };
      } catch (error: any) {
        console.error('❌ Error creating execution data:', error.message);
        return { success: false, error: error.message };
      }
    },

    async getByFacilityAndPeriod(facilityId: number, reportingPeriodId: number, projectId?: number) {
      try {
        const whereConditions: any[] = [
          eq(schema.executionData.facilityId, facilityId),
          eq(schema.executionData.reportingPeriodId, reportingPeriodId),
        ];

        if (projectId) {
          whereConditions.push(eq(schema.executionData.projectId, projectId));
        }

        const executionData = await db
          .select({
            id: schema.executionData.id,
            activityId: schema.executionData.activityId,
            activityName: schema.activities.name,
            categoryName: schema.categories.name,
            categoryCode: schema.categories.code,
            q1Amount: schema.executionData.q1Amount,
            q2Amount: schema.executionData.q2Amount,
            q3Amount: schema.executionData.q3Amount,
            q4Amount: schema.executionData.q4Amount,
            cumulativeBalance: schema.executionData.cumulativeBalance,
            comment: schema.executionData.comment,
            createdBy: schema.executionData.createdBy,
          })
          .from(schema.executionData)
          .leftJoin(schema.activities, eq(schema.executionData.activityId, schema.activities.id))
          .leftJoin(schema.categories, eq(schema.activities.categoryId, schema.categories.id))
          .where(and(...whereConditions))
          .orderBy(asc(schema.categories.displayOrder), asc(schema.activities.displayOrder));

        console.log(`✅ Retrieved ${executionData.length} execution data records`);
        return { success: true, data: executionData };
      } catch (error: any) {
        console.error('❌ Error retrieving execution data:', error.message);
        return { success: false, error: error.message };
      }
    },

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

        console.log(`✅ Execution data updated: ${updatedExecutionData.id}`);
        return { success: true, data: updatedExecutionData };
      } catch (error: any) {
        console.error('❌ Error updating execution data:', error.message);
        return { success: false, error: error.message };
      }
    },

    async delete(id: number) {
      try {
        const [deletedExecutionData] = await db
          .delete(schema.executionData)
          .where(eq(schema.executionData.id, id))
          .returning();

        if (!deletedExecutionData) {
          return { success: false, error: 'Execution data not found' };
        }

        console.log(`✅ Execution data deleted: ${deletedExecutionData.id}`);
        return { success: true, data: deletedExecutionData };
      } catch (error: any) {
        console.error('❌ Error deleting execution data:', error.message);
        return { success: false, error: error.message };
      }
    },
  },

  // ============================================================================
  // UTILITIES
  // ============================================================================
  utilities: {
    async getDatabaseStats() {
      try {
        const [projects] = await db.select({ count: sql<number>`count(*)` }).from(schema.projects);
        const [facilities] = await db.select({ count: sql<number>`count(*)` }).from(schema.facilities);
        const [planningCategories] = await db.select({ count: sql<number>`count(*)` }).from(schema.categories);
        const [planningActivities] = await db.select({ count: sql<number>`count(*)` }).from(schema.activities);
        const [planningData] = await db.select({ count: sql<number>`count(*)` }).from(schema.planningData);
        const [executionData] = await db.select({ count: sql<number>`count(*)` }).from(schema.executionData);
        const [activityTemplates] = await db.select({ count: sql<number>`count(*)` }).from(schema.activityTemplates);

        const stats = {
          projects: [projects],
          facilities: [facilities],
          planningCategories: [planningCategories],
          planningActivities: [planningActivities],
          planningData: [planningData],
          executionData: [executionData],
          activityTemplates: [activityTemplates],
        };

        console.log('✅ Database statistics retrieved');
        return { success: true, data: stats };
      } catch (error: any) {
        console.error('❌ Error retrieving database stats:', error.message);
        return { success: false, error: error.message };
      }
    },

    async bulkCreatePlanningData(data: CreatePlanningDataParams[]) {
      try {
        const planningData = await db
          .insert(schema.planningData)
          .values(data.map(item => ({
            ...item,
            countQ1: item.countQ1 || 0,
            countQ2: item.countQ2 || 0,
            countQ3: item.countQ3 || 0,
            countQ4: item.countQ4 || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          })))
          .returning();

        console.log(`✅ Bulk created ${planningData.length} planning data records`);
        return { success: true, data: planningData };
      } catch (error: any) {
        console.error('❌ Error bulk creating planning data:', error.message);
        return { success: false, error: error.message };
      }
    },

    async validatePlanningData(facilityId: number, reportingPeriodId: number, projectId: number) {
      try {
        const planningData = await db
          .select()
          .from(schema.planningData)
          .where(
            and(
              eq(schema.planningData.facilityId, facilityId),
              eq(schema.planningData.reportingPeriodId, reportingPeriodId),
              eq(schema.planningData.projectId, projectId)
            )
          );

        const validation = {
          totalRecords: planningData.length,
          hasData: planningData.length > 0,
          totalBudget: planningData.reduce((sum, item) => {
            const total = (item.countQ1 || 0) + (item.countQ2 || 0) + (item.countQ3 || 0) + (item.countQ4 || 0);
            return sum + (total * parseFloat(item.unitCost || '0'));
          }, 0),
        };

        console.log('✅ Planning data validation completed');
        return { success: true, data: validation };
      } catch (error: any) {
        console.error('❌ Error validating planning data:', error.message);
        return { success: false, error: error.message };
      }
    },
  },
};

export default DatabaseOperations; 