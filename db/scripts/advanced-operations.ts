import { db } from "@/db";
import * as schema from "@/db/schema";
import * as scalabilitySchema from "@/db/schema/planning-scalability";
import { eq, and, or, like, inArray, desc, asc, isNull, sql, sum, count, avg } from "drizzle-orm";

// Global type assertion to fix Drizzle ORM version compatibility issues
const schemaAny = schema as any;
const scalabilitySchemaAny = scalabilitySchema as any;

// ============================================================================
// DATA MIGRATION OPERATIONS
// ============================================================================

export const MigrationOperations = {
  // Migrate planning categories from current to scalability system
  async migratePlanningCategories(projectId: number, facilityType: 'hospital' | 'health_center', changeReason: string = 'Migration from current system') {
    try {
      console.log(`🔄 Starting migration for project ${projectId}, facility type ${facilityType}`);

      // Get current planning categories
      const currentCategories = await db
        .select()
        .from(planningCategories)
        .where(
          and(
            eq(planningCategories.projectId, projectId),
            eq(planningCategories.facilityType, facilityType)
          )
        );

      if (currentCategories.length === 0) {
        return { success: false, error: 'No categories found to migrate' };
      }

      const migratedCategories = [];

      for (const category of currentCategories) {
        // Create versioned category
        const [versionedCategory] = await db
          .insert(planningCategoryVersions)
          .values({
            categoryId: category.id,
            version: 1,
            projectId: category.projectId,
            facilityType: category.facilityType,
            code: category.code,
            name: category.name,
            displayOrder: category.displayOrder,
            isActive: true,
            validFrom: category.createdAt,
            validTo: null,
            changeReason,
            createdBy: null,
          })
          .returning();

        migratedCategories.push(versionedCategory);
        console.log(`✅ Migrated category: ${category.name}`);
      }

      console.log(`✅ Migration completed: ${migratedCategories.length} categories migrated`);
      return { success: true, data: migratedCategories };
    } catch (error: any) {
      console.error('❌ Error during category migration:', error);
      return { success: false, error: error.message };
    }
  },

  // Migrate planning activities from current to scalability system
  async migratePlanningActivities(projectId: number, facilityType: 'hospital' | 'health_center', changeReason: string = 'Migration from current system') {
    try {
      console.log(`🔄 Starting activity migration for project ${projectId}, facility type ${facilityType}`);

      // Get current planning activities with their categories
      const currentActivities = await db
        .select({
          id: schema.planningActivities.id,
          categoryId: schema.planningActivities.categoryId,
          facilityType: schema.planningActivities.facilityType,
          name: schema.planningActivities.name,
          displayOrder: schema.planningActivities.displayOrder,
          isTotalRow: schema.planningActivities.isTotalRow,
          projectId: schema.planningActivities.projectId,
          createdAt: schema.planningActivities.createdAt,
          categoryVersionId: scalabilitySchema.planningCategoryVersions.id,
        })
        .from(schema.planningActivities)
        .leftJoin(
          scalabilitySchema.planningCategoryVersions,
          and(
            eq(schema.planningActivities.categoryId, scalabilitySchema.planningCategoryVersions.categoryId) as any,
            eq(scalabilitySchema.planningCategoryVersions.projectId, projectId) as any,
            eq(scalabilitySchema.planningCategoryVersions.facilityType, facilityType) as any,
            isNull(scalabilitySchema.planningCategoryVersions.validTo) as any
          )
        )
        .where(
          and(
            eq(schema.planningActivities.projectId, projectId) as any,
            eq(schema.planningActivities.facilityType, facilityType) as any
          )
        );

      if (currentActivities.length === 0) {
        return { success: false, error: 'No activities found to migrate' };
      }

      const migratedActivities = [];

      for (const activity of currentActivities) {
        if (!activity.categoryVersionId) {
          console.warn(`⚠️ Skipping activity ${activity.name} - no category version found`);
          continue;
        }

        // Create versioned activity
        const [versionedActivity] = await db
          .insert(scalabilitySchema.planningActivityVersions)
          .values({
            activityId: activity.id,
            version: 1,
            templateId: null, // No template link in current system
            categoryVersionId: activity.categoryVersionId,
            facilityType: activity.facilityType,
            name: activity.name,
            displayOrder: activity.displayOrder,
            isTotalRow: activity.isTotalRow,
            isActive: true,
            validFrom: activity.createdAt,
            validTo: null,
            config: null,
            defaultFrequency: null,
            defaultUnitCost: null,
            changeReason,
            createdBy: null,
          })
          .returning();

        migratedActivities.push(versionedActivity);
        console.log(`✅ Migrated activity: ${activity.name}`);
      }

      console.log(`✅ Migration completed: ${migratedActivities.length} activities migrated`);
      return { success: true, data: migratedActivities };
    } catch (error: any) {
      console.error('❌ Error during activity migration:', error);
      return { success: false, error: error.message };
    }
  },

  // Full migration for a project
  async migrateProject(projectId: number, facilityType: 'hospital' | 'health_center') {
    try {
      console.log(`🚀 Starting full migration for project ${projectId}, facility type ${facilityType}`);

      // Step 1: Migrate categories
      const categoryResult = await this.migratePlanningCategories(projectId, facilityType);
      if (!categoryResult.success) {
        return categoryResult;
      }

      // Step 2: Migrate activities
      const activityResult = await this.migratePlanningActivities(projectId, facilityType);
      if (!activityResult.success) {
        return activityResult;
      }

      console.log(`🎉 Full migration completed successfully!`);
      return {
        success: true,
        data: {
          categories: categoryResult.data,
          activities: activityResult.data,
        },
        message: 'Project migration completed successfully',
      };
    } catch (error: any) {
      console.error('❌ Error during project migration:', error);
      return { success: false, error: error.message };
    }
  },
};

// ============================================================================
// REPORTING & ANALYTICS OPERATIONS
// ============================================================================

export const ReportingOperations = {
  // Get planning vs execution comparison
  async getPlanningVsExecution(facilityId: number, reportingPeriodId: number, projectId: number) {
    try {
      const comparison = await db
        .select({
          activityId: schema.planningData.activityId,
          activityName: schema.planningActivities.name,
          categoryName: schema.planningCategories.name,
          plannedQ1: schema.planningData.amountQ1,
          plannedQ2: schema.planningData.amountQ2,
          plannedQ3: schema.planningData.amountQ3,
          plannedQ4: schema.planningData.amountQ4,
          plannedTotal: schema.planningData.totalBudget,
          executedQ1: schema.executionData.q1Amount,
          executedQ2: schema.executionData.q2Amount,
          executedQ3: schema.executionData.q3Amount,
          executedQ4: schema.executionData.q4Amount,
          executedTotal: schema.executionData.cumulativeBalance,
        })
        .from(schema.planningData)
        .leftJoin(schema.planningActivities, eq(schema.planningData.activityId, schema.planningActivities.id) as any)
        .leftJoin(schema.planningCategories, eq(schema.planningActivities.categoryId, schema.planningCategories.id) as any)
        .leftJoin(
          schema.executionData,
          and(
            eq(schema.planningData.activityId, schema.executionData.activityId) as any,
            eq(schema.planningData.facilityId, schema.executionData.facilityId) as any,
            eq(schema.planningData.reportingPeriodId, schema.executionData.reportingPeriodId) as any,
            eq(schema.planningData.projectId, schema.executionData.projectId) as any
          )
        )
        .where(
          and(
            eq(schema.planningData.facilityId, facilityId) as any,
            eq(schema.planningData.reportingPeriodId, reportingPeriodId) as any,
            eq(schema.planningData.projectId, projectId) as any
          )
        )
        .orderBy(
          asc(schema.planningCategories.displayOrder),
          asc(schema.planningActivities.displayOrder)
        );

      // Calculate variances
      const comparisonWithVariance = comparison.map(item => ({
        ...item,
        varianceQ1: (parseFloat(item.executedQ1 || '0') - parseFloat(item.plannedQ1 || '0')),
        varianceQ2: (parseFloat(item.executedQ2 || '0') - parseFloat(item.plannedQ2 || '0')),
        varianceQ3: (parseFloat(item.executedQ3 || '0') - parseFloat(item.plannedQ3 || '0')),
        varianceQ4: (parseFloat(item.executedQ4 || '0') - parseFloat(item.plannedQ4 || '0')),
        varianceTotal: (parseFloat(item.executedTotal || '0') - parseFloat(item.plannedTotal || '0')),
        variancePercentage: item.plannedTotal ? 
          ((parseFloat(item.executedTotal || '0') - parseFloat(item.plannedTotal || '0')) / parseFloat(item.plannedTotal || '0')) * 100 : 0,
      }));

      console.log(`📊 Generated planning vs execution report for ${comparisonWithVariance.length} activities`);
      return { success: true, data: comparisonWithVariance };
    } catch (error: any) {
      console.error('❌ Error generating planning vs execution report:', error);
      return { success: false, error: error.message };
    }
  },

  // Get facility performance summary
  async getFacilityPerformanceSummary(facilityId: number, reportingPeriodId: number) {
    try {
      const summary = await db
        .select({
          totalPlanned: sum(schema.planningData.totalBudget),
          totalExecuted: sum(schema.executionData.cumulativeBalance),
          plannedActivities: count(schema.planningData.id),
          executedActivities: count(schema.executionData.id),
          avgVariancePercentage: avg(
            sql`CASE 
              WHEN ${schema.planningData.totalBudget} > 0 
              THEN ((${schema.executionData.cumulativeBalance} - ${schema.planningData.totalBudget}) / ${schema.planningData.totalBudget}) * 100 
              ELSE 0 
            END`
          ),
        })
        .from(schema.planningData)
        .leftJoin(
          schema.executionData,
          and(
            eq(schema.planningData.activityId, schema.executionData.activityId),
            eq(schema.planningData.facilityId, schema.executionData.facilityId),
            eq(schema.planningData.reportingPeriodId, schema.executionData.reportingPeriodId),
            eq(schema.planningData.projectId, schema.executionData.projectId)
          )
        )
        .where(
          and(
            eq(schema.planningData.facilityId, facilityId),
            eq(schema.planningData.reportingPeriodId, reportingPeriodId)
          )
        );

      console.log(`📊 Generated facility performance summary`);
      return { success: true, data: summary[0] };
    } catch (error: any) {
      console.error('❌ Error generating facility performance summary:', error);
      return { success: false, error: error.message };
    }
  },

  // Get project performance across all facilities
  async getProjectPerformance(projectId: number, reportingPeriodId: number) {
    try {
      const performance = await db
        .select({
          facilityId: schema.facilities.id,
          facilityName: schema.facilities.name,
          facilityType: schema.facilities.facilityType,
          totalPlanned: sum(schema.planningData.totalBudget),
          totalExecuted: sum(schema.executionData.cumulativeBalance),
          plannedActivities: count(schema.planningData.id),
          executedActivities: count(schema.executionData.id),
        })
        .from(schema.facilities)
        .leftJoin(
          schema.planningData,
          and(
            eq(schema.facilities.id, schema.planningData.facilityId) as any,
            eq(schema.planningData.projectId, projectId) as any,
            eq(schema.planningData.reportingPeriodId, reportingPeriodId) as any
          )
        )
        .leftJoin(
          schema.executionData,
          and(
            eq(schema.facilities.id, schema.executionData.facilityId) as any,
            eq(schema.executionData.projectId, projectId) as any,
            eq(schema.executionData.reportingPeriodId, reportingPeriodId) as any
          )
        )
        .where(eq(schema.planningData.projectId, projectId))
        .groupBy(schema.facilities.id, schema.facilities.name, schema.facilities.facilityType)
        .orderBy(asc(schema.facilities.name));

      console.log(`📊 Generated project performance report for ${performance.length} facilities`);
      return { success: true, data: performance };
    } catch (error: any) {
      console.error('❌ Error generating project performance report:', error);
      return { success: false, error: error.message };
    }
  },

  // Get quarterly trends
  async getQuarterlyTrends(facilityId: number, projectId: number, year: number) {
    try {
      const trends = await db
        .select({
          quarter: sql<number>`EXTRACT(QUARTER FROM ${schema.reportingPeriods.startDate})`,
          totalPlanned: sum(schema.planningData.totalBudget),
          totalExecuted: sum(schema.executionData.cumulativeBalance),
          plannedActivities: count(schema.planningData.id),
          executedActivities: count(schema.executionData.id),
        })
        .from(schema.reportingPeriods)
        .leftJoin(
          schema.planningData,
          and(
            eq(schema.reportingPeriods.id, schema.planningData.reportingPeriodId),
            eq(schema.planningData.facilityId, facilityId),
            eq(schema.planningData.projectId, projectId)
          )
        )
        .leftJoin(
          schema.executionData,
          and(
            eq(schema.reportingPeriods.id, schema.executionData.reportingPeriodId),
            eq(schema.executionData.facilityId, facilityId),
            eq(schema.executionData.projectId, projectId)
          )
        )
        .where(
          and(
            eq(schema.reportingPeriods.year, year),
            eq(schema.reportingPeriods.periodType, 'ANNUAL')
          )
        )
        .groupBy(sql`EXTRACT(QUARTER FROM ${schema.reportingPeriods.startDate})`)
        .orderBy(sql`EXTRACT(QUARTER FROM ${schema.reportingPeriods.startDate})`);

      console.log(`📊 Generated quarterly trends for year ${year}`);
      return { success: true, data: trends };
    } catch (error: any) {
      console.error('❌ Error generating quarterly trends:', error);
      return { success: false, error: error.message };
    }
  },
};

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export const BulkOperations = {
  // Bulk create planning data from template
  async bulkCreateFromTemplate(templateData: {
    facilityIds: number[];
    reportingPeriodId: number;
    projectId: number;
    template: {
      categoryCode: string;
      activities: Array<{
        name: string;
        frequency: number;
        unitCost: number;
        countQ1?: number;
        countQ2?: number;
        countQ3?: number;
        countQ4?: number;
      }>;
    };
  }) {
    try {
      console.log(`🔄 Starting bulk creation for ${templateData.facilityIds.length} facilities`);

      const results = [];
      const errors = [];

      for (const facilityId of templateData.facilityIds) {
        try {
          // Get category for this facility
          const [category] = await db
            .select()
            .from(schema.planningCategories)
            .where(
              and(
                eq(schema.planningCategories.projectId, templateData.projectId),
                eq(schema.planningCategories.code, templateData.template.categoryCode)
              )
            )
            .limit(1);

          if (!category) {
            errors.push(`Category ${templateData.template.categoryCode} not found for facility ${facilityId}`);
            continue;
          }

          // Create activities for this facility
          for (const activityTemplate of templateData.template.activities) {
            // Check if activity exists
            let [activity] = await db
              .select()
              .from(schema.planningActivities)
              .where(
                and(
                  eq(schema.planningActivities.categoryId, category.id),
                  eq(schema.planningActivities.name, activityTemplate.name)
                )
              )
              .limit(1);

            // Create activity if it doesn't exist
            if (!activity) {
              [activity] = await db
                .insert(schema.planningActivities)
                .values({
                  categoryId: category.id,
                  facilityType: category.facilityType,
                  name: activityTemplate.name,
                  displayOrder: 1, // Default order
                  isTotalRow: false,
                  projectId: templateData.projectId,
                })
                .returning();
            }

            // Create planning data
            const [planningData] = await db
              .insert(schema.planningData)
              .values({
                activityId: activity.id,
                facilityId,
                reportingPeriodId: templateData.reportingPeriodId,
                projectId: templateData.projectId,
                frequency: activityTemplate.frequency.toString(),
                unitCost: activityTemplate.unitCost.toString(),
                countQ1: activityTemplate.countQ1 || 0,
                countQ2: activityTemplate.countQ2 || 0,
                countQ3: activityTemplate.countQ3 || 0,
                countQ4: activityTemplate.countQ4 || 0,
              } as any)
              .returning();

            results.push(planningData);
          }

          console.log(`✅ Created planning data for facility ${facilityId}`);
        } catch (error: any) {
          errors.push(`Error processing facility ${facilityId}: ${error.message}`);
        }
      }

      console.log(`✅ Bulk creation completed: ${results.length} records created, ${errors.length} errors`);
      return {
        success: true,
        data: results,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      console.error('❌ Error during bulk creation:', error);
      return { success: false, error: error.message };
    }
  },

  // Bulk update planning data
  async bulkUpdatePlanningData(updates: Array<{
    id: number;
    frequency?: number;
    unitCost?: number;
    countQ1?: number;
    countQ2?: number;
    countQ3?: number;
    countQ4?: number;
    comment?: string;
  }>) {
    try {
      console.log(`🔄 Starting bulk update for ${updates.length} records`);

      const results = [];
      const errors = [];

      for (const update of updates) {
        try {
          const [updatedRecord] = await db
            .update(schema.planningData)
            .set({
              ...(update.frequency !== undefined ? { frequency: update.frequency.toString() } : {}),
              ...(update.unitCost !== undefined ? { unitCost: update.unitCost.toString() } : {}),
              ...(update.countQ1 !== undefined ? { countQ1: update.countQ1 } : {}),
              ...(update.countQ2 !== undefined ? { countQ2: update.countQ2 } : {}),
              ...(update.countQ3 !== undefined ? { countQ3: update.countQ3 } : {}),
              ...(update.countQ4 !== undefined ? { countQ4: update.countQ4 } : {}),
              ...(update.comment !== undefined ? { comment: update.comment } : {}),
              updatedAt: new Date(),
            })
            .where(eq(schema.planningData.id, update.id))
            .returning();

          if (updatedRecord) {
            results.push(updatedRecord);
          } else {
            errors.push(`Record ${update.id} not found`);
          }
        } catch (error: any) {
          errors.push(`Error updating record ${update.id}: ${error.message}`);
        }
      }

      console.log(`✅ Bulk update completed: ${results.length} records updated, ${errors.length} errors`);
      return {
        success: true,
        data: results,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      console.error('❌ Error during bulk update:', error);
      return { success: false, error: error.message };
    }
  },

  // Bulk delete planning data
  async bulkDeletePlanningData(ids: number[]) {
    try {
      console.log(`🔄 Starting bulk delete for ${ids.length} records`);

      const deletedRecords = await db
        .delete(schema.planningData)
        .where(inArray(schema.planningData.id, ids))
        .returning();

      console.log(`✅ Bulk delete completed: ${deletedRecords.length} records deleted`);
      return { success: true, data: deletedRecords };
    } catch (error: any) {
      console.error('❌ Error during bulk delete:', error);
      return { success: false, error: error.message };
    }
  },
};

// ============================================================================
// DATA VALIDATION & CLEANUP OPERATIONS
// ============================================================================

export const ValidationOperations = {
  // Validate data integrity
  async validateDataIntegrity() {
    try {
      console.log('🔍 Starting data integrity validation');

      const issues = [];

      // Check for orphaned planning data
      const orphanedPlanningData = await db
        .select()
        .from(schema.planningData)
        .leftJoin(schema.planningActivities, eq(schema.planningData.activityId, schema.planningActivities.id))
        .where(isNull(schema.planningActivities.id));

      if (orphanedPlanningData.length > 0) {
        issues.push(`Found ${orphanedPlanningData.length} orphaned planning data records`);
      }

      // Check for orphaned execution data
      const orphanedExecutionData = await db
        .select()
        .from(schema.executionData)
        .leftJoin(schema.activities, eq(schema.executionData.activityId, schema.activities.id))
        .where(isNull(schema.activities.id));

      if (orphanedExecutionData.length > 0) {
        issues.push(`Found ${orphanedExecutionData.length} orphaned execution data records`);
      }

      // Check for duplicate planning data
      const duplicatePlanningData = await db
        .select({
          activityId: schema.planningData.activityId,
          facilityId: schema.planningData.facilityId,
          reportingPeriodId: schema.planningData.reportingPeriodId,
          projectId: schema.planningData.projectId,
          count: count(schema.planningData.id),
        })
        .from(schema.planningData)
        .groupBy(
          schema.planningData.activityId,
          schema.planningData.facilityId,
          schema.planningData.reportingPeriodId,
          schema.planningData.projectId
        )
        .having(sql`count(*) > 1`);

      if (duplicatePlanningData.length > 0) {
        issues.push(`Found ${duplicatePlanningData.length} duplicate planning data combinations`);
      }

      // Check for duplicate execution data
      const duplicateExecutionData = await db
        .select({
          activityId: schema.executionData.activityId,
          facilityId: schema.executionData.facilityId,
          reportingPeriodId: schema.executionData.reportingPeriodId,
          projectId: schema.executionData.projectId,
          count: count(schema.executionData.id),
        })
        .from(schema.executionData)
        .groupBy(
          schema.executionData.activityId,
          schema.executionData.facilityId,
          schema.executionData.reportingPeriodId,
          schema.executionData.projectId
        )
        .having(sql`count(*) > 1`);

      if (duplicateExecutionData.length > 0) {
        issues.push(`Found ${duplicateExecutionData.length} duplicate execution data combinations`);
      }

      console.log(`🔍 Data integrity validation completed: ${issues.length} issues found`);
      return {
        success: true,
        data: {
          issues,
          orphanedPlanningData: orphanedPlanningData.length,
          orphanedExecutionData: orphanedExecutionData.length,
          duplicatePlanningData: duplicatePlanningData.length,
          duplicateExecutionData: duplicateExecutionData.length,
        },
      };
    } catch (error: any) {
      console.error('❌ Error during data integrity validation:', error);
      return { success: false, error: error.message };
    }
  },

  // Clean up orphaned data
  async cleanupOrphanedData() {
    try {
      console.log('🧹 Starting orphaned data cleanup');

      let cleanedCount = 0;

      // Clean up orphaned planning data
      const orphanedPlanningResult = await db
        .delete(schema.planningData)
        .where(
          sql`${schema.planningData.activityId} NOT IN (
            SELECT id FROM ${schema.planningActivities}
          )`
        );

      cleanedCount += orphanedPlanningResult.length;
      console.log(`🧹 Cleaned up ${orphanedPlanningResult.length} orphaned planning data records`);

      // Clean up orphaned execution data
      const orphanedExecutionResult = await db
        .delete(schema.executionData)
        .where(
          sql`${schema.executionData.activityId} NOT IN (
            SELECT id FROM ${schema.activities}
          )`
        );

      cleanedCount += orphanedExecutionResult.length;
      console.log(`🧹 Cleaned up ${orphanedExecutionResult.length} orphaned execution data records`);

      console.log(`🧹 Orphaned data cleanup completed: ${cleanedCount} total records cleaned`);
      return { success: true, data: { cleanedCount } };
    } catch (error: any) {
      console.error('❌ Error during orphaned data cleanup:', error);
      return { success: false, error: error.message };
    }
  },

  // Remove duplicate data (keeps the first occurrence)
  async removeDuplicateData() {
    try {
      console.log('🧹 Starting duplicate data removal');

      let removedCount = 0;

      // Remove duplicate planning data
      const duplicatePlanningRemoved = await db
        .delete(schema.planningData)
        .where(
          sql`id NOT IN (
            SELECT MIN(id) FROM ${schema.planningData}
            GROUP BY activity_id, facility_id, reporting_period_id, project_id
          )`
        );

      removedCount += duplicatePlanningRemoved.length;
      console.log(`🧹 Removed ${duplicatePlanningRemoved.length} duplicate planning data records`);

      // Remove duplicate execution data
      const duplicateExecutionRemoved = await db
        .delete(schema.executionData)
        .where(
          sql`id NOT IN (
            SELECT MIN(id) FROM ${schema.executionData}
            GROUP BY activity_id, facility_id, reporting_period_id, project_id
          )`
        );

      removedCount += duplicateExecutionRemoved.length;
      console.log(`🧹 Removed ${duplicateExecutionRemoved.length} duplicate execution data records`);

      console.log(`🧹 Duplicate data removal completed: ${removedCount} total records removed`);
      return { success: true, data: { removedCount } };
    } catch (error: any) {
      console.error('❌ Error during duplicate data removal:', error);
      return { success: false, error: error.message };
    }
  },
};

// ============================================================================
// EXPORT ALL ADVANCED OPERATIONS
// ============================================================================

export const AdvancedOperations = {
  migration: MigrationOperations,
  reporting: ReportingOperations,
  bulk: BulkOperations,
  validation: ValidationOperations,
};

export default AdvancedOperations; 