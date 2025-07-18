import type { Database } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

interface ActivityData {
    categoryCode: string;
    subCategoryCode?: string | null; // null for activities that belong directly to category
    name: string;
    displayOrder: number;
    isTotalRow: boolean;
}

// Group activities for the HIV project by category for clarity
const hivActivitiesData: ActivityData[] = [
    // ==========================================
    // Category A - Receipts total
    // ==========================================
    { categoryCode: 'A', subCategoryCode: null, name: 'Other Incomes', displayOrder: 1, isTotalRow: false },
    { categoryCode: 'A', subCategoryCode: null, name: 'Transfers from SPIU/RBC', displayOrder: 2, isTotalRow: false },
    { categoryCode: 'A', subCategoryCode: null, name: 'A. Receipts', displayOrder: 3, isTotalRow: true },

    // ==========================================
    // Category B - Expenditures (with subcategories)
    // ==========================================
    
    // B.01 - Human Resources + BONUS
    { categoryCode: 'B', subCategoryCode: 'B-01', name: 'Laboratory Technician', displayOrder: 1, isTotalRow: false },
    { categoryCode: 'B', subCategoryCode: 'B-01', name: 'Nurse', displayOrder: 2, isTotalRow: false },

    // B.02 - Monitoring & Evaluation
    { categoryCode: 'B', subCategoryCode: 'B-02', name: 'Supervision CHWs', displayOrder: 1, isTotalRow: false },
    { categoryCode: 'B', subCategoryCode: 'B-02', name: 'Support group meetings', displayOrder: 2, isTotalRow: false },

    // B.03 - Living Support to Clients/Target Populations
    { categoryCode: 'B', subCategoryCode: 'B-03', name: 'Sample transport', displayOrder: 1, isTotalRow: false },
    { categoryCode: 'B', subCategoryCode: 'B-03', name: 'Home visit lost to follow up', displayOrder: 2, isTotalRow: false },
    { categoryCode: 'B', subCategoryCode: 'B-03', name: 'Transport and travel for survey/surveillance', displayOrder: 3, isTotalRow: false },

    // B.04 - Overheads (22 - Use of goods & services)
    { categoryCode: 'B', subCategoryCode: 'B-04', name: 'Infrastructure support', displayOrder: 1, isTotalRow: false },
    { categoryCode: 'B', subCategoryCode: 'B-04', name: 'Office supplies', displayOrder: 2, isTotalRow: false },
    { categoryCode: 'B', subCategoryCode: 'B-04', name: 'Transport and travel (Reporting)', displayOrder: 3, isTotalRow: false },
    { categoryCode: 'B', subCategoryCode: 'B-04', name: 'Bank charges', displayOrder: 4, isTotalRow: false },

    // B.05 - Transfer to other reporting entities
    { categoryCode: 'B', subCategoryCode: 'B-05', name: 'Transfer to RBC', displayOrder: 1, isTotalRow: false },

    // B - Category Total (no subcategory)
    { categoryCode: 'B', subCategoryCode: null, name: 'B. Expenditures', displayOrder: 99, isTotalRow: true },

    // ==========================================
    // Category D - Financial Assets total
    // ==========================================
    { categoryCode: 'D', subCategoryCode: null, name: 'Cash at bank', displayOrder: 1, isTotalRow: false },
    { categoryCode: 'D', subCategoryCode: null, name: 'Petty cash', displayOrder: 2, isTotalRow: false },
    { categoryCode: 'D', subCategoryCode: null, name: 'Receivables (VAT refund)', displayOrder: 3, isTotalRow: false },
    { categoryCode: 'D', subCategoryCode: null, name: 'Other Receivables', displayOrder: 4, isTotalRow: false },
    { categoryCode: 'D', subCategoryCode: null, name: 'D. Financial Assets', displayOrder: 5, isTotalRow: true },

    // ==========================================
    // Category E - Financial Liabilities total
    // ==========================================
    { categoryCode: 'E', subCategoryCode: null, name: 'Salaries on borrowed funds (BONUS)', displayOrder: 1, isTotalRow: false },
    { categoryCode: 'E', subCategoryCode: null, name: 'Payable - Maintenance & Repairs', displayOrder: 2, isTotalRow: false },
    { categoryCode: 'E', subCategoryCode: null, name: 'Payable - Office suppliers', displayOrder: 3, isTotalRow: false },
    { categoryCode: 'E', subCategoryCode: null, name: 'Payable - Transportation fees', displayOrder: 4, isTotalRow: false },
    { categoryCode: 'E', subCategoryCode: null, name: 'VAT refund to RBC', displayOrder: 5, isTotalRow: false },
    { categoryCode: 'E', subCategoryCode: null, name: 'E. Financial Liabilities', displayOrder: 6, isTotalRow: true },

    // ==========================================
    // Category F - Net Financial Assets total
    // ==========================================
    { categoryCode: 'F', subCategoryCode: null, name: 'F. Net Financial Assets', displayOrder: 1, isTotalRow: true },

    // ==========================================
    // Category G - Closing Balance total
    // ==========================================
    { categoryCode: 'G', subCategoryCode: null, name: 'Accumulated Surplus/Deficit', displayOrder: 1, isTotalRow: false },
    { categoryCode: 'G', subCategoryCode: null, name: 'Prior Year Adjustment', displayOrder: 2, isTotalRow: false },
    { categoryCode: 'G', subCategoryCode: null, name: 'Surplus/Deficit of the Period', displayOrder: 3, isTotalRow: false },
    { categoryCode: 'G', subCategoryCode: null, name: 'G. Closing Balance', displayOrder: 4, isTotalRow: true },
];

/* eslint-disable no-console */

/**
 * Generic helper that seeds a set of activities.  You can call this with any
 * project-specific array that follows the `ActivityData` interface.
 */
export async function seedActivities(
    db: Database,
    activitiesData: ActivityData[],
    projectCode: string,
) {
    console.log(`Seeding ${activitiesData.length} activities for project ${projectCode}…`);

    // Resolve project id
    const projectRow = await db
        .select({ id: schema.projects.id })
        .from(schema.projects)
        .where(eq(schema.projects.code, projectCode))
        .limit(1);

    const projectId = projectRow[0]?.id;
    if (!projectId) {
        throw new Error(`Project with code "${projectCode}" not found. Seed projects first.`);
    }

    // Get categories and subcategories for this project only
    const allCategories = await db
        .select({ id: schema.categories.id, code: schema.categories.code })
        .from(schema.categories)
        .where(eq(schema.categories.projectId, projectId));

    const allSubCategories = await db
        .select({ id: schema.subCategories.id, code: schema.subCategories.code })
        .from(schema.subCategories)
        .where(eq(schema.subCategories.projectId, projectId));

    const categoryMap = new Map(allCategories.map((c) => [c.code, c.id]));
    const subCategoryMap = new Map(allSubCategories.map((sc) => [sc.code, sc.id]));

    // Build rows while respecting the chk_activity_has_one_parent rule:
    //   – Activities linked to a sub-category must have categoryId = NULL.
    //   – Activities linked directly to a category must have subCategoryId = NULL.
    const activityValues = activitiesData.map((item) => {
        let categoryId: number | null = null;
        let subCategoryId: number | null = null;

        if (item.subCategoryCode) {
            // Case 1: Activity belongs to a sub-category
            subCategoryId = subCategoryMap.get(item.subCategoryCode) ?? null;
            if (subCategoryId === null) {
                throw new Error(`Sub-category with code "${item.subCategoryCode}" not found for activity "${item.name}"`);
            }
            // categoryId intentionally left null to satisfy the CHECK constraint
        } else {
            // Case 2: Activity belongs directly to a category
            categoryId = categoryMap.get(item.categoryCode) ?? null;
            if (categoryId === null) {
                throw new Error(`Category with code "${item.categoryCode}" not found for activity "${item.name}"`);
            }
        }

        return {
            categoryId,
            subCategoryId,
            name: item.name,
            displayOrder: item.displayOrder,
            isTotalRow: item.isTotalRow,
            projectId,
        };
    });

    await db.insert(schema.activities).values(activityValues).onConflictDoNothing();
    console.log(`Seeded ${activityValues.length} activities for project ${projectCode}.`);
}

// Default export remains for backwards compatibility; it seeds the HIV activities.
export default async function seed(db: Database) {
    await seedActivities(db, hivActivitiesData, 'HIV');
} 