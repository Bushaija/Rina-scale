import type { Database } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

interface SubCategoryData {
    categoryCode: string;
    code: string;
    name: string;
    displayOrder: number;
}

// Default HIV project sub-categories
const hivSubCategoriesData: SubCategoryData[] = [
    { categoryCode: 'B', code: 'B-01', name: 'Human Resources + BONUS', displayOrder: 1 },
    { categoryCode: 'B', code: 'B-02', name: 'Monitoring & Evaluation', displayOrder: 2 },
    { categoryCode: 'B', code: 'B-03', name: 'Living Support to Clients/Target Populations', displayOrder: 3 },
    { categoryCode: 'B', code: 'B-04', name: 'Overheads (22 - Use of goods & services)', displayOrder: 4 },
    { categoryCode: 'B', code: 'B-05', name: 'Transfer to other reporting entities', displayOrder: 5 },
];

/* eslint-disable no-console */
/**
 * Generic sub-category seeder for a given project.
 */
export async function seedSubCategories(
    db: Database,
    subCategoriesData: SubCategoryData[],
    projectCode: string,
) {
    console.log(`Seeding ${subCategoriesData.length} sub-categories for project ${projectCode}…`);

    // 1. Fetch the project id
    const projectRow = await db
        .select({ id: schema.projects.id })
        .from(schema.projects)
        .where(eq(schema.projects.code, projectCode))
        .limit(1);

    const projectId = projectRow[0]?.id;
    if (!projectId) {
        throw new Error(`Project with code "${projectCode}" not found. Seed projects first.`);
    }

    // 2. Pull all categories for this project only
    const categoryRows = await db
        .select({ id: schema.categories.id, code: schema.categories.code })
        .from(schema.categories)
        .where(eq(schema.categories.projectId, projectId));

    const categoryMap = new Map<string, number>(categoryRows.map((c) => [c.code, c.id]));

    // 3. Build sub-category inserts
    const rows = subCategoriesData.map((item) => {
        const categoryId = categoryMap.get(item.categoryCode);
        if (categoryId === undefined) {
            throw new Error(`Category "${item.categoryCode}" not found for project ${projectCode}`);
        }
        return {
            categoryId: categoryId as number,
            code: item.code,
            name: item.name,
            displayOrder: item.displayOrder,
            projectId,
        };
    });

    await db.insert(schema.subCategories).values(rows).onConflictDoNothing();
    console.log(`Seeded ${rows.length} sub-categories for project ${projectCode}.`);
}

// Default export keeps existing behavior (HIV)
export default async function seed(db: Database) {
    await seedSubCategories(db, hivSubCategoriesData, 'HIV');
} 