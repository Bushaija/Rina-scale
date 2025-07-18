import type { Database } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

interface CategoryData {
    code: string;
    name: string;
    displayOrder: number;
}

// Default HIV project categories
const hivCategoriesData: CategoryData[] = [
    { code: 'A', name: 'A. Receipts', displayOrder: 1 },
    { code: 'B', name: 'B. Expenditures', displayOrder: 2 },
    { code: 'C', name: 'C. SURPLUS / DEFICIT', displayOrder: 3 },
    { code: 'D', name: 'D. Financial Assets', displayOrder: 4 },
    { code: 'E', name: 'E. Financial Liabilities', displayOrder: 5 },
    { code: 'F', name: 'F. Net Financial Assets', displayOrder: 6 },
    { code: 'G', name: 'G. Closing Balance', displayOrder: 7 },
];

/* eslint-disable no-console */

/**
 * Generic category seeder.  Call this with any project‐specific category list.
 */
export async function seedCategories(
    db: Database,
    categoriesData: CategoryData[],
    projectCode: string,
) {
    console.log(`Seeding ${categoriesData.length} categories for project ${projectCode}…`);

    // Look up the projectId once
    const projectRow = await db
        .select({ id: schema.projects.id })
        .from(schema.projects)
        .where(eq(schema.projects.code, projectCode))
        .limit(1);

    const projectId = projectRow[0]?.id;
    if (!projectId) {
        throw new Error(`Project with code "${projectCode}" not found. Ensure it is seeded before categories.`);
    }

    const rows = categoriesData.map((c) => ({ ...c, projectId }));

    await db.insert(schema.categories).values(rows).onConflictDoNothing();
    console.log(`Seeded ${rows.length} categories for project ${projectCode}.`);
}

// Default export – seeds the HIV categories to maintain backward compatibility
export default async function seed(db: Database) {
    await seedCategories(db, hivCategoriesData, 'HIV');
} 